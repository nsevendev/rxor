import { describe, expect, it, vi } from "vitest";
import { computed } from "../../src/core/computed";
import { signal } from "../../src/core/signal";

describe("computed", () => {
  it("computes a derived value", () => {
    const count = signal(2);
    const doubled = computed(() => count.value * 2);
    expect(doubled.value).toBe(4);
  });

  it("updates when dependency changes", () => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    expect(doubled.value).toBe(2);
    count.value = 5;
    expect(doubled.value).toBe(10);
  });

  it("is lazy — does not compute until read", () => {
    const fn = vi.fn(() => 42);
    const c = computed(fn);
    expect(fn).not.toHaveBeenCalled();
    expect(c.value).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("caches the value — does not recompute if deps unchanged", () => {
    const count = signal(1);
    const fn = vi.fn(() => count.value * 2);
    const doubled = computed(fn);

    doubled.value;
    doubled.value;
    doubled.value;
    expect(fn).toHaveBeenCalledTimes(1); // computed only once
  });

  it("recomputes only when dirty", () => {
    const count = signal(1);
    const fn = vi.fn(() => count.value * 2);
    const doubled = computed(fn);

    expect(doubled.value).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);

    count.value = 3;
    expect(doubled.value).toBe(6);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("handles multiple dependencies", () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);
    expect(sum.value).toBe(3);

    a.value = 10;
    expect(sum.value).toBe(12);

    b.value = 20;
    expect(sum.value).toBe(30);
  });

  it("handles nested computed (computed of computed)", () => {
    const count = signal(2);
    const doubled = computed(() => count.value * 2);
    const quadrupled = computed(() => doubled.value * 2);
    expect(quadrupled.value).toBe(8);

    count.value = 3;
    expect(quadrupled.value).toBe(12);
  });

  it("solves diamond dependency (no double computation)", () => {
    const source = signal(1);
    const a = computed(() => source.value + 1);
    const b = computed(() => source.value + 2);
    const fn = vi.fn(() => a.value + b.value);
    const diamond = computed(fn);

    expect(diamond.value).toBe(5); // (1+1) + (1+2)
    expect(fn).toHaveBeenCalledTimes(1);

    source.value = 10;
    expect(diamond.value).toBe(23); // (10+1) + (10+2)
    expect(fn).toHaveBeenCalledTimes(2); // only once more, not twice
  });

  it("handles dynamic dependencies (conditional reads)", () => {
    const toggle = signal(true);
    const a = signal("A");
    const b = signal("B");
    const result = computed(() => (toggle.value ? a.value : b.value));

    expect(result.value).toBe("A");

    // Changing b should NOT trigger recomputation since toggle is true
    b.value = "B2";
    const fn = vi.fn(() => result.value);
    fn();
    // result should still be "A" and not recomputed due to b change

    toggle.value = false;
    expect(result.value).toBe("B2");
  });

  it("is readonly — cannot set value", () => {
    const c = computed(() => 42);
    // @ts-expect-error — computed is readonly
    expect(() => {
      c.value = 99;
    }).toThrow();
  });

  it("peek() reads without tracking", () => {
    const c = computed(() => 42);
    expect(c.peek()).toBe(42);
  });

  it("subscribe works", () => {
    const count = signal(0);
    const doubled = computed(() => count.value * 2);
    const fn = vi.fn();

    // Force initial computation
    doubled.value;

    doubled.subscribe(fn);
    count.value = 5;
    expect(fn).toHaveBeenCalledWith(10);
  });
});
