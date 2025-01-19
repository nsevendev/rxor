import { RxStore } from "../src/RxStore";
import { ReaXor } from "../src/ReaXor";

describe("RxStore", () => {
  let rxStore: RxStore;

  beforeEach(() => {
    rxStore = new RxStore();
  });

  // Test case to check if a store is correctly added to the RxStore
  it("should add a store correctly", () => {
    const mockStore = ReaXor.create<number>(0, "testStore");
    rxStore.addStore("testStore", mockStore);

    const retrievedStore = rxStore.getStore("testStore");
    expect(retrievedStore).toBe(mockStore);
  });

  // Test case to check if a warning is logged when trying to add a store with a duplicate key
  it("should warn when adding a store with a duplicate key", () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const mockStore1 = ReaXor.create<number>(0, "testStore");
    const mockStore2 = ReaXor.create<number>(1, "testStore");

    rxStore.addStore("testStore", mockStore1);
    rxStore.addStore("testStore", mockStore2);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Store with key "testStore" already exists. Overwriting.'
    );
    consoleWarnSpy.mockRestore();
  });

  // Test case to check if RxStore returns undefined for a store that does not exist
  it("should return undefined for non-existing stores", () => {
    expect(rxStore.getStore("nonExistentStore")).toBeUndefined();
  });

  // Test case to check if RxStore correctly determines whether a store exists
  it("should correctly check if a store exists", () => {
    const mockStore = ReaXor.create<number>(0, "existingStore");
    rxStore.addStore("existingStore", mockStore);

    expect(rxStore.hasStore("existingStore")).toBe(true);
    expect(rxStore.hasStore("nonExistingStore")).toBe(false);
  });

  // Test case to check if RxStore correctly resets all stores
  it("should reset all stores", () => {
    const mockStore1 = ReaXor.create<number>(0, "store1");
    const mockStore2 = ReaXor.create<number>(1, "store2");

    rxStore.addStore("store1", mockStore1);
    rxStore.addStore("store2", mockStore2);

    rxStore.reset();

    expect(rxStore.getStores()).toEqual({});
  });
});
