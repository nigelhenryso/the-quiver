// Postgres enums from Supabase (Custom Types)

export type PaymentModeType = "Physical" | "Digital";

export type College = "BAGCED" | "CCS" | "CLA" | "COS" | "GCOE" | "CLTSOE" | "RVRCOB";

/** R4P = ready for pickup */
export type OrderStatus = "Processing" | "R4P" | "Claimed" | "Unclaimed";
