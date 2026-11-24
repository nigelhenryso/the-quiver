export type VariantOption = {
    variant_id: string;
    variant_type_id: string | null; // null = option not under a specific VariantType
    name: string | null;
}
