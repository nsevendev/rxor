import { ReaXar } from "./ReaXar";
// Factory to easily create reactive variables
export function reaxar(initialValue) {
    return new ReaXar(initialValue);
}
