import type { SupabaseClient } from "@supabase/supabase-js";
import { STUDENT_AFFILIATION_TABLE } from "@/src/lib/supabase/tables";
import { resolveProductMedia } from "@/src/services/productMedia";
import type { Organization } from "@/src/types/Organization";
import type { OrganizationImage } from "@/src/types/OrganizationImage";
import type { Product } from "@/src/types/Product";
import type { ProductImage } from "@/src/types/ProductImage";
import type { ProductVariantCombination } from "@/src/types/ProductVariantCombination";
import { HOME_CAROUSEL_LIMIT, type HomeOrgProducts } from "./data";

type AffiliationRow = {
  Organization: (Pick<Organization, "organization_id" | "name" | "acronym"> & {
    OrganizationImage: Pick<OrganizationImage, "image_url">[];
    Product: (Pick<Product, "product_id" | "name" | "price"> & {
      ProductImage: Pick<ProductImage, "image_url">[];
      ProductVariantCombination: Pick<ProductVariantCombination, "image_url">[];
    })[];
  }) | null;
};

export async function getYourOrgProducts(supabase: SupabaseClient, studentId: string): Promise<HomeOrgProducts[]> {
  const { data, error } = await supabase
    .from(STUDENT_AFFILIATION_TABLE)
    .select(`
      Organization(
        organization_id, name, acronym, OrganizationImage(image_url),
        Product(product_id, name, price, ProductImage(image_url), ProductVariantCombination(image_url))
      )
    `)
    .eq("student_id", studentId)
    .eq("Organization.Product.is_active", true)
    .order("organization_image_id", { referencedTable: "Organization.OrganizationImage" })
    .limit(1, { referencedTable: "Organization.OrganizationImage" })
    .order("created_at", { referencedTable: "Organization.Product", ascending: false, nullsFirst: false })
    .order("product_id", { referencedTable: "Organization.Product" })
    .limit(HOME_CAROUSEL_LIMIT, { referencedTable: "Organization.Product" })
    .order("position", { referencedTable: "Organization.Product.ProductImage", nullsFirst: false })
    .order("product_image_id", { referencedTable: "Organization.Product.ProductImage" })
    .limit(1, { referencedTable: "Organization.Product.ProductImage" })
    .not("Organization.Product.ProductVariantCombination.image_url", "is", null)
    .neq("Organization.Product.ProductVariantCombination.image_url", "")
    .order("combination_id", { referencedTable: "Organization.Product.ProductVariantCombination" })
    .limit(1, { referencedTable: "Organization.Product.ProductVariantCombination" })
    .overrideTypes<AffiliationRow[], { merge: false }>();

  if (error) throw error;

  const organizations = data.flatMap(({ Organization }) => Organization ? [Organization] : []);
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
  })).sort((a, b) => a.orgName.localeCompare(b.orgName));
}
