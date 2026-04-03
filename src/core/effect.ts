type CleanupFn = () => void;
type EffectFn = () => CleanupFn | undefined;

export function effect(_fn: EffectFn): CleanupFn {
  throw new Error("Not implemented yet");
}
