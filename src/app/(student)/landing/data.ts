export const HOME_CAROUSEL_LIMIT = 20;

export type HomeProduct = {
  id: number | string;
  productName: string;
  orgName: string;
  rating?: number;
  reviewCount?: number;
  price: number;
  imgDir: string | null;
};

export type HomeOrgProducts = {
  id: string;
  orgName: string;
  orgImageUrl?: string;
  products: HomeProduct[];
};
