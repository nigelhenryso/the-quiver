import type { ProductSize } from "./enums";

// one sellable version of a product (ex: Shirt / Blue / M). A product with no variants has a single
// "Default" variant with no size.
export const DEFAULT_VARIANT_NAME = "Default";

export type ProductVariant = {
    variant_id: string;
    product_id: string;
    name: string; // color / design / model; "Default" = no named variant
    size: ProductSize | null; // null = free size / not sized
    price_override: number | null; // null = use Product.price
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

/** "Blue / M", "M", "Blue", or "" for the default variant. */
export function variantLabel(variant: Pick<ProductVariant, "name" | "size">) {
    const name = variant.name.trim();
    return [name === DEFAULT_VARIANT_NAME ? null : name, variant.size].filter(Boolean).join(" / ");
}
