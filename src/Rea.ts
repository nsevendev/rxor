import { ReaXar } from "./ReaXar";

// Factory to easily create reactive variables
export function reaxar<T>(initialValue: T): ReaXar<T> {
  return new ReaXar<T>(initialValue);
}
