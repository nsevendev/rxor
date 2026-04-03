import { describe, expect, it, vi } from "vitest";
import { computed } from "../../src/core/computed";
import { effect } from "../../src/core/effect";
import { signal } from "../../src/core/signal";

describe("deep reactivity — objects", () => {
  it("reads nested properties", () => {
    const state = signal({ user: { name: "John", age: 25 } });
    expect(state.value.user.name).toBe("John");
    expect(state.value.user.age).toBe(25);
  });

  it("notifies on deep property change", () => {
    const state = signal({ user: { name: "John" } });
    const values: string[] = [];
    effect(() => {
      values.push(state.value.user.name);
    });
    expect(values).toEqual(["John"]);

    state.value.user.name = "Jane";
    expect(values).toEqual(["John", "Jane"]);
  });

  it("does not notify unrelated watchers on deep change", () => {
    const state = signal({ a: { x: 1 }, b: { y: 2 } });
    const fn = vi.fn(() => state.value.a.x);
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    // Changing b.y should NOT trigger effect watching a.x
    state.value.b.y = 99;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("notifies on top-level replacement", () => {
    const state = signal({ count: 0 });
    const values: number[] = [];
    effect(() => {
      values.push(state.value.count);
    });

    state.value = { count: 42 };
    expect(values).toEqual([0, 42]);
  });

  it("works with computed on nested props", () => {
    const state = signal({ price: 100, tax: 0.2 });
    const total = computed(() => state.value.price * (1 + state.value.tax));
    expect(total.value).toBe(120);

    state.value.price = 200;
    expect(total.value).toBe(240);
  });

  it("handles adding new properties", () => {
    const state = signal<Record<string, number>>({ a: 1 });
    const values: number[] = [];
    effect(() => {
      values.push(state.value.b ?? 0);
    });
    expect(values).toEqual([0]);

    state.value.b = 42;
    expect(values).toEqual([0, 42]);
  });

  it("handles deleting properties", () => {
    const state = signal<Record<string, number>>({ a: 1, b: 2 });
    const values: (number | undefined)[] = [];
    effect(() => {
      values.push(state.value.b);
    });
    expect(values).toEqual([2]);

    // biome-ignore lint/performance/noDelete: testing proxy deleteProperty trap
    delete state.value.b;
    expect(values).toEqual([2, undefined]);
  });
});

describe("deep reactivity — arrays", () => {
  it("reads array elements", () => {
    const list = signal([1, 2, 3]);
    expect(list.value[0]).toBe(1);
    expect(list.value.length).toBe(3);
  });

  it("notifies on push", () => {
    const list = signal([1, 2]);
    const lengths: number[] = [];
    effect(() => {
      lengths.push(list.value.length);
    });
    expect(lengths).toEqual([2]);

    list.value.push(3);
    expect(lengths).toEqual([2, 3]);
  });

  it("notifies on splice", () => {
    const list = signal(["a", "b", "c"]);
    const snapshots: string[][] = [];
    effect(() => {
      snapshots.push([...list.value]);
    });
    expect(snapshots).toEqual([["a", "b", "c"]]);

    list.value.splice(1, 1);
    expect(snapshots).toEqual([
      ["a", "b", "c"],
      ["a", "c"],
    ]);
  });

  it("notifies on index assignment", () => {
    const list = signal([10, 20, 30]);
    const fn = vi.fn(() => list.value[0]);
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    list.value[0] = 99;
    expect(fn).toHaveBeenCalledTimes(2);
    expect(list.value[0]).toBe(99);
  });

  it("notifies on pop/shift/unshift", () => {
    const list = signal([1, 2, 3]);
    const lengths: number[] = [];
    effect(() => {
      lengths.push(list.value.length);
    });

    list.value.pop();
    list.value.shift();
    list.value.unshift(10, 20);
    expect(lengths).toEqual([3, 2, 1, 3]);
  });

  it("notifies on sort/reverse", () => {
    const list = signal([3, 1, 2]);
    const snapshots: number[][] = [];
    effect(() => {
      snapshots.push([...list.value]);
    });

    list.value.sort();
    expect(snapshots[1]).toEqual([1, 2, 3]);

    list.value.reverse();
    expect(snapshots[2]).toEqual([3, 2, 1]);
  });
});

describe("deep reactivity — Map", () => {
  it("tracks Map.get()", () => {
    const map = signal(new Map([["key", "value"]]));
    const values: (string | undefined)[] = [];
    effect(() => {
      values.push(map.value.get("key"));
    });
    expect(values).toEqual(["value"]);

    map.value.set("key", "updated");
    expect(values).toEqual(["value", "updated"]);
  });

  it("tracks Map.has()", () => {
    const map = signal(new Map<string, number>());
    const results: boolean[] = [];
    effect(() => {
      results.push(map.value.has("foo"));
    });
    expect(results).toEqual([false]);

    map.value.set("foo", 1);
    expect(results).toEqual([false, true]);
  });

  it("tracks Map.size", () => {
    const map = signal(new Map<string, number>());
    const sizes: number[] = [];
    effect(() => {
      sizes.push(map.value.size);
    });

    map.value.set("a", 1);
    map.value.set("b", 2);
    map.value.delete("a");
    expect(sizes).toEqual([0, 1, 2, 1]);
  });
});

describe("deep reactivity — Set", () => {
  it("tracks Set.has()", () => {
    const set = signal(new Set<string>());
    const results: boolean[] = [];
    effect(() => {
      results.push(set.value.has("foo"));
    });
    expect(results).toEqual([false]);

    set.value.add("foo");
    expect(results).toEqual([false, true]);
  });

  it("tracks Set.size", () => {
    const set = signal(new Set<number>());
    const sizes: number[] = [];
    effect(() => {
      sizes.push(set.value.size);
    });

    set.value.add(1);
    set.value.add(2);
    set.value.delete(1);
    expect(sizes).toEqual([0, 1, 2, 1]);
  });
});

describe("deep reactivity — edge cases", () => {
  it("handles null values", () => {
    const state = signal<{ name: string | null }>({ name: null });
    expect(state.value.name).toBeNull();
    state.value.name = "test";
    expect(state.value.name).toBe("test");
  });

  it("handles nested arrays in objects", () => {
    const state = signal({ items: [1, 2, 3] });
    const lengths: number[] = [];
    effect(() => {
      lengths.push(state.value.items.length);
    });

    state.value.items.push(4);
    expect(lengths).toEqual([3, 4]);
  });

  it("handles nested objects in arrays", () => {
    const state = signal([{ name: "a" }, { name: "b" }]);
    const names: string[] = [];
    effect(() => {
      // biome-ignore lint/style/noNonNullAssertion: test array access
      names.push(state.value[0]!.name);
    });

    // biome-ignore lint/style/noNonNullAssertion: test array mutation
    state.value[0]!.name = "updated";
    expect(names).toEqual(["a", "updated"]);
  });
});
