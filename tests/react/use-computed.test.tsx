import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { signal } from "../../src/core/signal";
import { useComputed } from "../../src/react/use-computed";

describe("useComputed", () => {
  it("renders a derived value", () => {
    const count = signal(3);
    function App() {
      const doubled = useComputed(() => count.value * 2);
      return <div data-testid="value">{doubled}</div>;
    }
    render(<App />);
    expect(screen.getByTestId("value").textContent).toBe("6");
  });

  it("updates when the source signal changes", () => {
    const count = signal(1);
    function App() {
      const doubled = useComputed(() => count.value * 2);
      return <div data-testid="value">{doubled}</div>;
    }
    render(<App />);
    expect(screen.getByTestId("value").textContent).toBe("2");

    act(() => {
      count.value = 5;
    });
    expect(screen.getByTestId("value").textContent).toBe("10");
  });

  it("handles multiple dependencies", () => {
    const a = signal(2);
    const b = signal(3);
    function App() {
      const sum = useComputed(() => a.value + b.value);
      return <div data-testid="value">{sum}</div>;
    }
    render(<App />);
    expect(screen.getByTestId("value").textContent).toBe("5");

    act(() => {
      a.value = 10;
    });
    expect(screen.getByTestId("value").textContent).toBe("13");

    act(() => {
      b.value = 20;
    });
    expect(screen.getByTestId("value").textContent).toBe("30");
  });

  it("cleans up on unmount", () => {
    const count = signal(0);
    function App() {
      const doubled = useComputed(() => count.value * 2);
      return <div data-testid="value">{doubled}</div>;
    }
    const { unmount } = render(<App />);
    unmount();

    act(() => {
      count.value = 99;
    });
    // Should not throw
  });
});
