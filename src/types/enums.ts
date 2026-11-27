// Postgres enums from Supabase (Custom Types)

export type PaymentModeType = "PHYSICAL" | "DIGITAL";

export type College = "BAGCED" | "CCS" | "CLA" | "COS" | "GCOE" | "SOE" | "RVRCOB";

/** R4P = ready for pickup */
export type OrderStatus = "Processing" | "R4P" | "Claimed" | "Unclaimed";

/** ProductVariant.size; null = free size / not sized */
export type ProductSize = "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL" | "6XL";

export type NotificationType = "ORDER_UPDATE" | "PREORDER_BROADCAST";
