// dummy data for the student home page
// NOTE: replace this with real data from supabase

export type HomeProduct = {
  id: number | string;
  productName: string;
  orgName: string;
  rating: number; // shown as 5.0
  reviewCount: number; // shown as (20)
  price: number;
  imgDir: string;
};

export type HomeOrgProducts = {
  orgName: string;
  products: HomeProduct[];
};

const sampleProducts = [
  { productName: "ID Lace", orgName: "LSCS", rating: 5, reviewCount: 20, price: 299 },
  { productName: "Jacket", orgName: "ENGLICOM", rating: 5, reviewCount: 20, price: 499 },
  { productName: "Shirt", orgName: "LSS", rating: 5, reviewCount: 20, price: 199 },
  { productName: "Pin", orgName: "DSS", rating: 4.5, reviewCount: 12, price: 350 },
  { productName: "Cap", orgName: "ISO", rating: 5, reviewCount: 20, price: 250 },
  { productName: "Stickers", orgName: "Mafia", rating: 3.5, reviewCount: 8, price: 150 },
  { productName: "Jacket", orgName: "LSCS", rating: 5, reviewCount: 20, price: 400 },
  { productName: "Baller", orgName: "CHEN", rating: 4, reviewCount: 15, price: 275 },
  { productName: "Jacket", orgName: "ENGLICOM", rating: 5, reviewCount: 20, price: 325 },
];

const products = sampleProducts.map((product, index) => ({
  ...product,
  imgDir: `/images/product-card-${index + 1}.jpg`,
}));

function makeOrgRows(orgNames: string[]): HomeOrgProducts[] {
  return orgNames.flatMap((orgName) => {
    const orgProducts = products.filter((product) => product.orgName === orgName);
    if (orgProducts.length === 0) return [];

    // Repeat the temporary samples so tightly spaced cards can fill wide viewports.
    return [{
      orgName,
      products: Array.from({ length: Math.max(26, orgProducts.length) }, (_, index) => ({
        ...orgProducts[index % orgProducts.length],
        id: `${orgName}-${index + 1}`,
      })),
    }];
  });
}

export function getStudentHomeData() {
  return {
    yourOrgs: makeOrgRows(["LSCS", "ENGLICOM"]),
    preOrders: makeOrgRows(["LSS", "CHEN"]),
    exploreMore: makeOrgRows(["DSS", "ISO"]),
  };
}
