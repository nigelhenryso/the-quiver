export type ProductMedia = { kind: "image" | "video"; url: string };

export type ProductOptionGroup = {
  key: string; // "size" or "variant"
  name: string;
  options: { id: string; name: string }[];
};

export type ProductCombinationChoice = {
  id: string;
  inventoryId: string | null;
  price: number;
  stock: number;
  optionIds: string[];
  imageUrl: string | null;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: string;
  avatarUrl: string | null;
  variants: string[];
  imageUrls: string[];
};

export type ProductDetails = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  isPreOrder: boolean;
  organization: { id: string; name: string; acronym: string | null };
  media: ProductMedia[];
  optionGroups: ProductOptionGroup[];
  combinations: ProductCombinationChoice[];
  reviews: ProductReview[];
  averageRating: number | null;
};
