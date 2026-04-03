import { describe, expect, it, vi } from "vitest";
import { computed } from "../../src/core/computed";
import { effect } from "../../src/core/effect";
import { signal } from "../../src/core/signal";

describe("effect", () => {
  it("runs immediately on creation", () => {
    const fn = vi.fn();
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("re-runs when a tracked signal changes", () => {
    const count = signal(0);
    const fn = vi.fn(() => {
      count.value;
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    count.value = 1;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not re-run when an unrelated signal changes", () => {
    const a = signal(0);
    const b = signal(0);
    const fn = vi.fn(() => {
      a.value;
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    b.value = 1;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns a dispose function", () => {
    const count = signal(0);
    const fn = vi.fn(() => {
      count.value;
    });
    const dispose = effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    dispose();
    count.value = 1;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls cleanup before re-run", () => {
    const count = signal(0);
    const cleanup = vi.fn();
    const fn = vi.fn(() => {
      count.value;
      return cleanup;
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    count.value = 1;
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("calls cleanup on dispose", () => {
    const cleanup = vi.fn();
    const dispose = effect(() => cleanup);
    expect(cleanup).not.toHaveBeenCalled();

    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("tracks computed values", () => {
    const count = signal(0);
    const doubled = computed(() => count.value * 2);
    const values: number[] = [];
    effect(() => {
      values.push(doubled.value);
    });

    expect(values).toEqual([0]);
    count.value = 5;
    expect(values).toEqual([0, 10]);
  });

  it("re-tracks dependencies on each run", () => {
    const toggle = signal(true);
    const a = signal("A");
    const b = signal("B");
    const values: string[] = [];

    effect(() => {
      values.push(toggle.value ? a.value : b.value);
    });
    expect(values).toEqual(["A"]);

    b.value = "B2";
    expect(values).toEqual(["A"]);

    toggle.value = false;
    expect(values).toEqual(["A", "B2"]);

    a.value = "A2";
    expect(values).toEqual(["A", "B2"]);

    b.value = "B3";
    expect(values).toEqual(["A", "B2", "B3"]);
  });
});
