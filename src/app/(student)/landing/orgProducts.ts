import type { SupabaseClient } from "@supabase/supabase-js";
import { ORGANIZATION_TABLE, STUDENT_AFFILIATION_TABLE } from "@/src/lib/supabase/tables";
import { resolveProductMedia } from "@/src/services/productMedia";
import type { Organization } from "@/src/types/Organization";
import type { OrganizationImage } from "@/src/types/OrganizationImage";
import type { Product } from "@/src/types/Product";
import type { ProductImage } from "@/src/types/ProductImage";
import type { ProductVariantCombination } from "@/src/types/ProductVariantCombination";
import { HOME_CAROUSEL_LIMIT, type HomeOrgProducts } from "./data";

type OrganizationRow = Pick<Organization, "organization_id" | "name" | "acronym"> & {
  OrganizationImage: Pick<OrganizationImage, "image_url">[];
  Product: (Pick<Product, "product_id" | "name" | "price"> & {
    ProductImage: Pick<ProductImage, "image_url">[];
    ProductVariantCombination: Pick<ProductVariantCombination, "image_url">[];
  })[];
};

const organizationFields = "organization_id, name, acronym, OrganizationImage(image_url)";
const productFields = "product_id, name, price, ProductImage(image_url), ProductVariantCombination(image_url)";

export async function getYourOrgProducts(supabase: SupabaseClient, studentId: string): Promise<HomeOrgProducts[]> {
  return getOrganizationProducts(supabase, { studentId });
}

export async function getPreOrderProducts(supabase: SupabaseClient): Promise<HomeOrgProducts[]> {
  return getOrganizationProducts(supabase, { preOrders: true });
}

async function getOrganizationProducts(
  supabase: SupabaseClient,
  scope: { studentId: string } | { preOrders: true },
): Promise<HomeOrgProducts[]> {
  const selection = "preOrders" in scope
    ? `Product!inner(${productFields})`
    : `Product(${productFields}), ${STUDENT_AFFILIATION_TABLE}!inner(student_id)`;
  const query = supabase.from(ORGANIZATION_TABLE)
    .select(`${organizationFields}, ${selection}`)
    .eq("Product.is_active", true)
    .order("name")
    .order("organization_id")
    .order("organization_image_id", { referencedTable: "OrganizationImage" })
    .limit(1, { referencedTable: "OrganizationImage" })
    .order("created_at", { referencedTable: "Product", ascending: false, nullsFirst: false })
    .order("product_id", { referencedTable: "Product" })
    .limit(HOME_CAROUSEL_LIMIT, { referencedTable: "Product" })
    .order("position", { referencedTable: "Product.ProductImage", nullsFirst: false })
    .order("product_image_id", { referencedTable: "Product.ProductImage" })
    .limit(1, { referencedTable: "Product.ProductImage" })
    .not("Product.ProductVariantCombination.image_url", "is", null)
    .neq("Product.ProductVariantCombination.image_url", "")
    .order("combination_id", { referencedTable: "Product.ProductVariantCombination" })
    .limit(1, { referencedTable: "Product.ProductVariantCombination" });

  const filtered = "preOrders" in scope
    ? query.eq("Product.has_catalog_preorder", true).limit(3)
    : query.eq(`${STUDENT_AFFILIATION_TABLE}.student_id`, scope.studentId);
  const { data, error } = await filtered
    .overrideTypes<OrganizationRow[], { merge: false }>();
  if (error) throw error;

  return toOrgProductRows(supabase, data);
}

async function toOrgProductRows(supabase: SupabaseClient, organizations: OrganizationRow[]): Promise<HomeOrgProducts[]> {
  const media = await resolveProductMedia(supabase, organizations.flatMap(({ Product }) =>
    Product.flatMap(({ ProductImage, ProductVariantCombination }) => [
      ProductImage[0]?.image_url || null,
      ProductVariantCombination[0]?.image_url || null,
    ]),
  ));

  return organizations.map((org) => ({
    id: org.organization_id,
    orgName: org.name,
    orgImageUrl: org.OrganizationImage[0]?.image_url,
    products: org.Product.map((product) => ({
      id: product.product_id,
      productName: product.name,
      orgName: org.acronym || org.name,
      price: product.price,
      imgDir: media(product.ProductImage[0]?.image_url || null)
        ?? media(product.ProductVariantCombination[0]?.image_url || null),
    })),
  }));
}
