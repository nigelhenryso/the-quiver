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

// pretend these are the orgs the logged in student joined
const joinedOrgs = ["LSCS", "ENGLICOM", "LSS"];

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

// makes `count` products by looping over the samples (there are only 9 images)
function makeProducts(prefix: string, count: number, offset = 0): HomeProduct[] {
  return Array.from({ length: count }, (_, i) => {
    const index = (i + offset) % sampleProducts.length;
    return {
      ...sampleProducts[index],
      id: `${prefix}-${i}`, // ids must stay unique since we repeat products
      imgDir: `/images/product-card-${index + 1}.jpg`,
    };
  });
}

// only one slide = no arrows/dots, add more slides to make it a carousel
const promoSlides = ["Some Promo Here or Event-exclusive stuff from orgs"];

export function getStudentHomeData() {
  const forYou = makeProducts("for-you", 7);

  // products from the orgs the student joined (dummy: repeat until there are 7)
  const orgProducts = makeProducts("orgs", 9).filter((p) => joinedOrgs.includes(p.orgName));
  const fromYourOrgs = Array.from({ length: 7 }, (_, i) => ({
    ...orgProducts[i % orgProducts.length],
    id: `orgs-${i}`,
  }));

  const exploreMore = makeProducts("explore", 14, 3);

  return { forYou, fromYourOrgs, exploreMore, promoSlides };
}