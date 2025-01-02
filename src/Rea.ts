// Rea.ts
import { ReaXar } from "./ReaXar";
import { ReaXarType } from "./type";

// Factory to easily create reactive variables
export function rea<T>(initialValue: T): ReaXarType<T> {
  return new ReaXar(initialValue);
}
