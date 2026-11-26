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
const ORGANIZATION_LIMIT = 3;

type CatalogScope =
  | { kind: "joined" | "explore"; studentId: string }
  | { kind: "preOrders"; studentId: string; membership: "joined" | "other"; limit: number };

export async function getYourOrgProducts(supabase: SupabaseClient, studentId: string): Promise<HomeOrgProducts[]> {
  const organizations = await getOrganizationProducts(supabase, { kind: "joined", studentId });
  return toOrgProductRows(supabase, organizations);
}

export async function getPreOrderProducts(supabase: SupabaseClient, studentId: string): Promise<HomeOrgProducts[]> {
  const joined = await getOrganizationProducts(supabase, {
    kind: "preOrders", studentId, membership: "joined", limit: ORGANIZATION_LIMIT,
  });
  const remaining = ORGANIZATION_LIMIT - joined.length;
  if (remaining === 0) return toOrgProductRows(supabase, joined);

  const others = await getOrganizationProducts(supabase, {
    kind: "preOrders", studentId, membership: "other", limit: remaining,
  });
  const joinedIds = new Set(joined.map((org) => org.organization_id));
  return toOrgProductRows(supabase, [...joined, ...others.filter((org) => !joinedIds.has(org.organization_id))]);
}

export async function getExploreProducts(supabase: SupabaseClient, studentId: string): Promise<HomeOrgProducts[]> {
  const organizations = await getOrganizationProducts(supabase, { kind: "explore", studentId });
  return toOrgProductRows(supabase, organizations);
}

async function getOrganizationProducts(
  supabase: SupabaseClient,
  scope: CatalogScope,
): Promise<OrganizationRow[]> {
  const onlyJoined = scope.kind === "joined" || (scope.kind === "preOrders" && scope.membership === "joined");
  const productRelation = scope.kind === "joined" ? "Product" : "Product!inner";
  const affiliationSelection = onlyJoined
    ? `${STUDENT_AFFILIATION_TABLE}!inner(student_id)`
    : `${STUDENT_AFFILIATION_TABLE}()`;

  const query = supabase.from(ORGANIZATION_TABLE)
    .select(`${organizationFields}, ${productRelation}(${productFields}), ${affiliationSelection}`)
    .eq("Product.is_active", true)
    .eq(`${STUDENT_AFFILIATION_TABLE}.student_id`, scope.studentId)
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

  if (!onlyJoined) query.is(STUDENT_AFFILIATION_TABLE, null);
  if (scope.kind === "preOrders") {
    query.eq("Product.has_catalog_preorder", true).limit(scope.limit);
  }
  if (scope.kind === "explore") {
    query.eq("Product.is_member_exclusive", false).limit(ORGANIZATION_LIMIT);
  }

  const { data, error } = await query
    .overrideTypes<OrganizationRow[], { merge: false }>();
  if (error) throw error;

  return data;
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
