import { describe, expect, it, vi } from "vitest";
import { batch } from "../../src/core/batch";
import { computed } from "../../src/core/computed";
import { effect } from "../../src/core/effect";
import { signal } from "../../src/core/signal";

describe("batch", () => {
  it("defers notifications until the batch ends", () => {
    const a = signal(1);
    const b = signal(2);
    const fn = vi.fn(() => {
      a.value + b.value;
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    batch(() => {
      a.value = 10;
      b.value = 20;
    });

    // Effect should run only once after batch, not twice
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("computed values see final state inside batch", () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);

    batch(() => {
      a.value = 10;
      b.value = 20;
    });

    expect(sum.value).toBe(30);
  });

  it("supports nested batches", () => {
    const count = signal(0);
    const fn = vi.fn(() => {
      count.value;
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    batch(() => {
      count.value = 1;
      batch(() => {
        count.value = 2;
        count.value = 3;
      });
      // Still inside outer batch — no notification yet
    });

    // Only one notification at the very end
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("subscribers see the latest value after batch", () => {
    const count = signal(0);
    const values: number[] = [];
    effect(() => {
      values.push(count.value);
    });

    batch(() => {
      count.value = 1;
      count.value = 2;
      count.value = 3;
    });

    // Should see initial (0) and final (3), not intermediate values
    expect(values).toEqual([0, 3]);
  });
});
