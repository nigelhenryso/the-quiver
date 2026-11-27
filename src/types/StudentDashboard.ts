export type HomeProduct = {
  id: number | string;
  productName: string;
  orgName: string;
  rating?: number;
  reviewCount?: number;
  price: number;
  imgDir: string | null;
  /** Pre-order products don't have a product details page. */
  isPreOrder?: boolean;
};

export type HomeOrgProducts = {
  id: string;
  orgName: string;
  orgImageUrl?: string;
  products: HomeProduct[];
};
