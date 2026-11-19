import type { PaymentModeType } from "./enums";

export type PaymentMode = {
    payment_mode_id: string;
    name: string;
    type: PaymentModeType;
}
