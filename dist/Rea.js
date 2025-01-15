import { ReaXar } from "./ReaXar";
// Factory to easily create reactive variables
export function rea(initialValue) {
    return new ReaXar(initialValue);
}
