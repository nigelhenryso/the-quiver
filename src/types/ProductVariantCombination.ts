// one sellable version of a product (ex: Shirt / Black / M); a product with no variants has one with no options
export type ProductVariantCombination = {
    combination_id: string;
    product_id: string;
    sku: string | null;
    price_override: number | null; // null = use Product.price
    image_url: string | null;
}
