import { memo } from "react";
import type { ReadonlySignal } from "../core/types";
import { useSignal } from "./use-signal";

interface SignalValueProps<T> {
  signal: ReadonlySignal<T>;
}

function SignalValueInner<T>({ signal: sig }: SignalValueProps<T>) {
  const value = useSignal(sig);
  if (value === null || value === undefined) return null;
  return <>{String(value)}</>;
}

export const SignalValue = memo(SignalValueInner) as typeof SignalValueInner;
