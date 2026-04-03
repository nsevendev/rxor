import { describe, expect, it, vi } from "vitest";
import { computed } from "../../src/core/computed";
import { effect } from "../../src/core/effect";
import { signal } from "../../src/core/signal";
import { createStore } from "../../src/store/store";

describe("createStore", () => {
  it("groups signals, computed and actions into a typed object", () => {
    const count = signal(0);
    const store = createStore({
      count,
      doubled: computed(() => count.value * 2),
      increment() {
        count.value++;
      },
    });

    expect(store.count).toBe(count);
    expect(store.doubled.value).toBe(0);
    expect(typeof store.increment).toBe("function");
  });

  it("actions mutate the signals", () => {
    const count = signal(0);
    const store = createStore({
      count,
      increment() {
        count.value++;
      },
    });

    store.increment();
    expect(store.count.value).toBe(1);
    store.increment();
    expect(store.count.value).toBe(2);
  });

  it("computed reacts to signal changes via actions", () => {
    const count = signal(0);
    const store = createStore({
      count,
      doubled: computed(() => count.value * 2),
      increment() {
        count.value++;
      },
    });

    expect(store.doubled.value).toBe(0);
    store.increment();
    expect(store.doubled.value).toBe(2);
    store.increment();
    expect(store.doubled.value).toBe(4);
  });

  it("effects track store signals", () => {
    const count = signal(0);
    const store = createStore({
      count,
      increment() {
        count.value++;
      },
    });

    const values: number[] = [];
    effect(() => {
      values.push(store.count.value);
    });
    expect(values).toEqual([0]);

    store.increment();
    expect(values).toEqual([0, 1]);
  });

  it("supports multiple signals in a store", () => {
    const name = signal("John");
    const age = signal(25);
    const store = createStore({
      name,
      age,
      birthday() {
        age.value++;
      },
      rename(newName: string) {
        name.value = newName;
      },
    });

    store.birthday();
    expect(store.age.value).toBe(26);

    store.rename("Jane");
    expect(store.name.value).toBe("Jane");
  });

  it("is fully typed — TypeScript infers signal types and action signatures", () => {
    const count = signal(0);
    const store = createStore({
      count,
      doubled: computed(() => count.value * 2),
      increment() {
        count.value++;
      },
    });

    // These should compile without errors
    const _val: number = store.count.value;
    const _computed: number = store.doubled.value;
    store.increment();

    expect(_val).toBe(0);
    expect(_computed).toBe(0);
  });
});
