import { act, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { computed } from "../../src/core/computed";
import { signal } from "../../src/core/signal";
import { SignalValue } from "../../src/react/signal-value";

describe("SignalValue", () => {
  it("renders a signal value", () => {
    const name = signal("John");
    render(
      <p data-testid="name">
        <SignalValue signal={name} />
      </p>,
    );
    expect(screen.getByTestId("name").textContent).toBe("John");
  });

  it("updates only the text when the signal changes", () => {
    const name = signal("John");
    const age = signal(25);
    let parentRenderCount = 0;

    function Parent() {
      parentRenderCount++;
      return (
        <div>
          <span data-testid="name">
            <SignalValue signal={name} />
          </span>
          <span data-testid="age">
            <SignalValue signal={age} />
          </span>
        </div>
      );
    }

    render(<Parent />);
    expect(parentRenderCount).toBe(1);
    expect(screen.getByTestId("name").textContent).toBe("John");
    expect(screen.getByTestId("age").textContent).toBe("25");

    act(() => {
      name.value = "Jane";
    });

    // Parent should NOT re-render — only the SignalValue for name
    expect(parentRenderCount).toBe(1);
    expect(screen.getByTestId("name").textContent).toBe("Jane");
    expect(screen.getByTestId("age").textContent).toBe("25");
  });

  it("works with computed signals", () => {
    const count = signal(3);
    const doubled = computed(() => count.value * 2);

    render(
      <p data-testid="value">
        <SignalValue signal={doubled} />
      </p>,
    );
    expect(screen.getByTestId("value").textContent).toBe("6");

    act(() => {
      count.value = 10;
    });
    expect(screen.getByTestId("value").textContent).toBe("20");
  });

  it("renders numbers, booleans, and null", () => {
    const num = signal(42);
    const bool = signal(true);
    const nullable = signal<string | null>(null);

    render(
      <div>
        <span data-testid="num">
          <SignalValue signal={num} />
        </span>
        <span data-testid="bool">
          <SignalValue signal={bool} />
        </span>
        <span data-testid="null">
          <SignalValue signal={nullable} />
        </span>
      </div>,
    );

    expect(screen.getByTestId("num").textContent).toBe("42");
    expect(screen.getByTestId("bool").textContent).toBe("true");
    expect(screen.getByTestId("null").textContent).toBe("");
  });

  it("cleans up on unmount", () => {
    const name = signal("test");
    const { unmount } = render(
      <p>
        <SignalValue signal={name} />
      </p>,
    );
    unmount();

    act(() => {
      name.value = "changed";
    });
    // Should not throw
  });
});
