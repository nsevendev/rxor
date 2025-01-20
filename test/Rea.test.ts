import { ReaXar } from "../src/ReaXar";

describe("ReaXar", () => {
  beforeAll(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Test to ensure that reaxar creates an instance of ReaXar with the correct initial value
  it("should create a ReaXar instance with the initial value", () => {
    const reactiveVar = new ReaXar(10);

    expect(reactiveVar).toBeInstanceOf(ReaXar);
    expect(reactiveVar.value).toBe(10);
  });

  // Test to ensure that the value of the ReaXar instance can be updated
  it("should update the value of the ReaXar instance", () => {
    const reactiveVar = new ReaXar(10);
    reactiveVar.value = 20;

    expect(reactiveVar.value).toBe(20);
  });

  // Test to verify that subscriptions are notified when the value changes
  it("should notify subscribers when the value changes", () => {
    const reactiveVar = new ReaXar(10);
    const mockSubscriber = jest.fn();

    const subscription = reactiveVar.subscribe(mockSubscriber);

    expect(mockSubscriber).toHaveBeenCalledTimes(1);
    expect(mockSubscriber).toHaveBeenCalledWith(10);

    reactiveVar.value = 20;

    expect(mockSubscriber).toHaveBeenCalledTimes(2);
    expect(mockSubscriber).toHaveBeenCalledWith(20);

    subscription.unsubscribe();
  });

  // Test to ensure unsubscribing works
  it("should stop notifying unsubscribed subscribers", () => {
    const reactiveVar = new ReaXar(10);
    const mockSubscriber = jest.fn();

    const subscription = reactiveVar.subscribe(mockSubscriber);

    expect(mockSubscriber).toHaveBeenCalledTimes(1);
    expect(mockSubscriber).toHaveBeenCalledWith(10);

    reactiveVar.value = 20;

    expect(mockSubscriber).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();

    reactiveVar.value = 30;

    expect(mockSubscriber).toHaveBeenCalledTimes(2);
  });

  // Test to verify the computed method works
  it("should compute new values based on the current value", () => {
    const reactiveVar = new ReaXar(10);
    const mockCallback = jest.fn((value: number) => value * 2);

    const computedObservable = reactiveVar.computed(mockCallback);

    const mockSubscriber = jest.fn();
    const subscription = computedObservable.subscribe(mockSubscriber);

    expect(mockCallback).toHaveBeenCalledWith(10, 0);
    expect(mockSubscriber).toHaveBeenCalledWith(20);

    reactiveVar.value = 15;

    expect(mockCallback).toHaveBeenCalledWith(15, 1);
    expect(mockSubscriber).toHaveBeenCalledWith(30);

    subscription.unsubscribe();
  });
});
