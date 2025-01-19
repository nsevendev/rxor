import { ReaXar } from "../src/ReaXar";
import { map } from "rxjs/operators";

describe("ReaXar", () => {
  let numberStore: ReaXar<number>;
  let stringStore: ReaXar<string>;
  let objectStore: ReaXar<{ key: string }>;

  beforeEach(() => {
    numberStore = new ReaXar<number>(0);
    stringStore = new ReaXar<string>("initial");
    objectStore = new ReaXar<{ key: string }>({ key: "value" });
  });

  // This test checks that the store is created with the correct initial value.
  it("should create a store with an initial value", () => {
    expect(numberStore.value).toBe(0);
    expect(stringStore.value).toBe("initial");
    expect(objectStore.value).toEqual({ key: "value" });
  });

  // This test checks that a new value can be correctly assigned to the store.
  it("should set a new value correctly", () => {
    numberStore.value = 42;
    stringStore.value = "updated";
    objectStore.value = { key: "new value" };

    expect(numberStore.value).toBe(42);
    expect(stringStore.value).toBe("updated");
    expect(objectStore.value).toEqual({ key: "new value" });
  });

  // This test ensures that subscribers are notified when the value changes.
  it("should notify subscribers when the value changes", () => {
    const callback = jest.fn();

    numberStore.subscribe(callback);
    numberStore.value = 100;

    expect(callback).toHaveBeenCalledWith(100);
  });

  // This test checks that all subscribers are notified when the value changes.
  it("should notify all subscribers when the value changes", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    numberStore.subscribe(callback1);
    numberStore.subscribe(callback2);

    numberStore.value = 42;

    expect(callback1).toHaveBeenCalledWith(42);
    expect(callback2).toHaveBeenCalledWith(42);
  });

  // This test checks that the store works correctly with string values.
  it("should handle string values", () => {
    expect(stringStore.value).toBe("initial");
    stringStore.value = "changed";
    expect(stringStore.value).toBe("changed");
  });

  // This test checks that the store works correctly with object values.
  it("should handle object values", () => {
    expect(objectStore.value).toEqual({ key: "value" });
    objectStore.value = { key: "updated" };
    expect(objectStore.value).toEqual({ key: "updated" });
  });

  // This test checks that multiple stores of different types can be managed correctly.
  it("should handle multiple stores of different types", () => {
    expect(numberStore.value).toBe(0);
    expect(stringStore.value).toBe("initial");
    expect(objectStore.value).toEqual({ key: "value" });

    numberStore.value = 100;
    stringStore.value = "test";
    objectStore.value = { key: "new" };

    expect(numberStore.value).toBe(100);
    expect(stringStore.value).toBe("test");
    expect(objectStore.value).toEqual({ key: "new" });
  });

  // This test checks that subscribers are notified when an observable pipe is applied.
  it("should work with pipe and RxJS operators", () => {
    const callback = jest.fn();

    numberStore.pipe(map((value) => value * 2)).subscribe(callback);

    numberStore.value = 10;
    expect(callback).toHaveBeenCalledWith(20);
  });

  // This test checks that computed values derived from the store are updated properly.
  it("should compute values correctly", () => {
    const callback = jest.fn();

    numberStore.computed((value) => `Number is ${value}`).subscribe(callback);

    numberStore.value = 5; // Change the value
    expect(callback).toHaveBeenCalledWith("Number is 5");
  });

  // This test checks that the unsubscribe function works as expected.
  it("should unsubscribe from a store", () => {
    const callback = jest.fn();
    const subscription = numberStore.subscribe(callback);

    numberStore.value = 100;
    expect(callback).toHaveBeenCalledWith(100);

    numberStore.unsubscribe(subscription);
    numberStore.value = 200;
    expect(callback).not.toHaveBeenCalledWith(200);
  });
});
