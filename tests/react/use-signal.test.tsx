import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { computed } from "../../src/core/computed";
import { signal } from "../../src/core/signal";
import { useSignal } from "../../src/react/use-signal";

describe("useSignal", () => {
  it("renders the initial value", () => {
    const count = signal(42);
    function App() {
      const value = useSignal(count);
      return <div data-testid="value">{value}</div>;
    }
    render(<App />);
    expect(screen.getByTestId("value").textContent).toBe("42");
  });

  it("re-renders when the signal changes", () => {
    const count = signal(0);
    function App() {
      const value = useSignal(count);
      return <div data-testid="value">{value}</div>;
    }
    render(<App />);
    expect(screen.getByTestId("value").textContent).toBe("0");

    act(() => {
      count.value = 10;
    });
    expect(screen.getByTestId("value").textContent).toBe("10");
  });

  it("does not re-render when setting the same value", () => {
    const count = signal(5);
    let renderCount = 0;
    function App() {
      const value = useSignal(count);
      renderCount++;
      return <div data-testid="value">{value}</div>;
    }
    render(<App />);
    expect(renderCount).toBe(1);

    act(() => {
      count.value = 5; // same value
    });
    expect(renderCount).toBe(1);
  });

  it("works with computed signals", () => {
    const count = signal(3);
    const doubled = computed(() => count.value * 2);

    function App() {
      const value = useSignal(doubled);
      return <div data-testid="value">{value}</div>;
    }
    render(<App />);
    expect(screen.getByTestId("value").textContent).toBe("6");

    act(() => {
      count.value = 7;
    });
    expect(screen.getByTestId("value").textContent).toBe("14");
  });

  it("cleans up subscription on unmount", () => {
    const count = signal(0);
    function App() {
      const value = useSignal(count);
      return <div data-testid="value">{value}</div>;
    }
    const { unmount } = render(<App />);
    unmount();

    // Should not throw after unmount
    act(() => {
      count.value = 99;
    });
  });

  it("handles multiple signals in the same component", () => {
    const name = signal("John");
    const age = signal(25);
    function App() {
      const n = useSignal(name);
      const a = useSignal(age);
      return (
        <div>
          <span data-testid="name">{n}</span>
          <span data-testid="age">{a}</span>
        </div>
      );
    }
    render(<App />);
    expect(screen.getByTestId("name").textContent).toBe("John");
    expect(screen.getByTestId("age").textContent).toBe("25");

    act(() => {
      name.value = "Jane";
    });
    expect(screen.getByTestId("name").textContent).toBe("Jane");
    expect(screen.getByTestId("age").textContent).toBe("25");
  });
});
