import { ReaXor } from "../src/ReaXor";

describe("ReaXor", () => {
  let numberStore: ReaXor<number>;
  let stringStore: ReaXor<string>;
  let objectStore: ReaXor<{ key: string }>;

  beforeAll(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  beforeEach(() => {
    numberStore = ReaXor.create<number>(0, "numberStore");
    stringStore = ReaXor.create<string>("initial", "stringStore");
    objectStore = ReaXor.create<{ key: string }>(
      { key: "value" },
      "objectStore"
    );
  });

  afterAll(() => {
    (console.warn as jest.Mock).mockRestore();
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

  // This test checks that the reset method restores the store to its initial value.
  it("should reset to the initial value", () => {
    numberStore.value = 42;
    stringStore.value = "updated";
    objectStore.value = { key: "new value" };

    numberStore.reset();
    stringStore.reset();
    objectStore.reset();

    expect(numberStore.value).toBe(0);
    expect(stringStore.value).toBe("initial");
    expect(objectStore.value).toEqual({ key: "value" });
  });

  // This test ensures that subscribers are notified when the store value changes.
  it("should notify subscribers when the value changes", () => {
    const callback = jest.fn();

    numberStore.subscribe(callback);
    numberStore.value = 100; // Change the value

    expect(callback).toHaveBeenCalledWith(100);
  });

  // This test checks that all subscribers are notified when the store value changes.
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

  // This test checks that the store persists the initial value even after calling reset.
  it("should persist the value after reset", () => {
    numberStore.value = 99;
    numberStore.reset();
    expect(numberStore.value).toBe(0);

    stringStore.value = "changed";
    stringStore.reset();
    expect(stringStore.value).toBe("initial");

    objectStore.value = { key: "modified" };
    objectStore.reset();
    expect(objectStore.value).toEqual({ key: "value" });
  });

  // This test ensures that the reset method works after multiple changes to the store value.
  it("should allow reset after multiple changes", () => {
    numberStore.value = 10;
    numberStore.value = 20;
    numberStore.reset();
    expect(numberStore.value).toBe(0);

    stringStore.value = "new";
    stringStore.value = "final";
    stringStore.reset();
    expect(stringStore.value).toBe("initial");

    objectStore.value = { key: "first" };
    objectStore.value = { key: "second" };
    objectStore.reset();
    expect(objectStore.value).toEqual({ key: "value" });
  });
});
