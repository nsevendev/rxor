import { describe, expect, it, vi } from "vitest";
import { signal } from "../../src/core/signal";

describe("signal", () => {
  it("creates a signal with initial value", () => {
    const s = signal(42);
    expect(s.value).toBe(42);
  });

  it("updates value via setter", () => {
    const s = signal("hello");
    s.value = "world";
    expect(s.value).toBe("world");
  });

  it("returns the current value with peek() without tracking", () => {
    const s = signal(10);
    expect(s.peek()).toBe(10);
    s.value = 20;
    expect(s.peek()).toBe(20);
  });

  it("does not notify when setting the same value (Object.is)", () => {
    const s = signal(5);
    const fn = vi.fn();
    s.subscribe(fn);
    s.value = 5; // same value
    expect(fn).not.toHaveBeenCalled();
  });

  it("notifies subscribers on value change", () => {
    const s = signal(0);
    const fn = vi.fn();
    s.subscribe(fn);
    s.value = 1;
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("unsubscribes correctly", () => {
    const s = signal(0);
    const fn = vi.fn();
    const unsub = s.subscribe(fn);
    s.value = 1;
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    s.value = 2;
    expect(fn).toHaveBeenCalledTimes(1); // not called again
  });

  it("supports multiple subscribers", () => {
    const s = signal(0);
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    s.subscribe(fn1);
    s.subscribe(fn2);
    s.value = 1;
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it("handles null and undefined as values", () => {
    const s1 = signal<string | null>(null);
    expect(s1.value).toBeNull();
    s1.value = "test";
    expect(s1.value).toBe("test");
    s1.value = null;
    expect(s1.value).toBeNull();

    const s2 = signal<number | undefined>(undefined);
    expect(s2.value).toBeUndefined();
  });

  it("handles object values (reference equality)", () => {
    const obj = { a: 1 };
    const s = signal(obj);
    const fn = vi.fn();
    s.subscribe(fn);

    // Same reference — no notification
    s.value = obj;
    expect(fn).not.toHaveBeenCalled();

    // New reference — notification
    s.value = { a: 1 };
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles NaN correctly (NaN === NaN for Object.is)", () => {
    const s = signal(Number.NaN);
    const fn = vi.fn();
    s.subscribe(fn);
    s.value = Number.NaN; // Object.is(NaN, NaN) is true
    expect(fn).not.toHaveBeenCalled();
  });

  it("handles +0 and -0 correctly", () => {
    const s = signal(0);
    const fn = vi.fn();
    s.subscribe(fn);
    s.value = -0; // Object.is(0, -0) is false
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
