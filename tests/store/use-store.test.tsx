import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { computed } from "../../src/core/computed";
import { signal } from "../../src/core/signal";
import { createStore } from "../../src/store/store";
import { useStore } from "../../src/store/use-store";

describe("useStore", () => {
  it("subscribes to a signal in the store", () => {
    const count = signal(0);
    const store = createStore({
      count,
      increment() {
        count.value++;
      },
    });

    function App() {
      const value = useStore(store, (s) => s.count);
      return <div data-testid="value">{value}</div>;
    }

    render(<App />);
    expect(screen.getByTestId("value").textContent).toBe("0");

    act(() => store.increment());
    expect(screen.getByTestId("value").textContent).toBe("1");
  });

  it("subscribes to a computed in the store", () => {
    const count = signal(0);
    const store = createStore({
      count,
      doubled: computed(() => count.value * 2),
      increment() {
        count.value++;
      },
    });

    function App() {
      const value = useStore(store, (s) => s.doubled);
      return <div data-testid="value">{value}</div>;
    }

    render(<App />);
    expect(screen.getByTestId("value").textContent).toBe("0");

    act(() => store.increment());
    expect(screen.getByTestId("value").textContent).toBe("2");
  });

  it("does not re-render for unrelated signal changes", () => {
    const count = signal(0);
    const name = signal("John");
    const store = createStore({ count, name });

    let renderCount = 0;
    function App() {
      const value = useStore(store, (s) => s.name);
      renderCount++;
      return <div data-testid="value">{value}</div>;
    }

    render(<App />);
    expect(renderCount).toBe(1);

    act(() => {
      count.value = 99;
    });
    expect(renderCount).toBe(1); // no re-render
  });

  it("cleans up on unmount", () => {
    const count = signal(0);
    const store = createStore({ count });

    function App() {
      const value = useStore(store, (s) => s.count);
      return <div data-testid="value">{value}</div>;
    }

    const { unmount } = render(<App />);
    unmount();

    act(() => {
      count.value = 99;
    });
    // Should not throw
  });
});
