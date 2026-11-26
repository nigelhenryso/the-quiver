import { ProductCardStar } from "@/src/components/ui/logos";

/** Five stars (filled to the nearest whole star) with an optional "(4.5) · 12 reviews" label. */
export default function StarRating({
  rating,
  reviewCount,
  size = 14,
  showLabel = true,
}: {
  rating: number | null;
  reviewCount?: number;
  size?: number;
  showLabel?: boolean;
}) {
  const filled = Math.round(rating ?? 0);
  const label = rating === null
    ? "No reviews yet"
    : `${rating.toFixed(1)} out of 5${reviewCount === undefined ? "" : `, ${reviewCount} review${reviewCount === 1 ? "" : "s"}`}`;

  return (
    <div className="flex items-center gap-2 font-body text-xs text-[#2F4531]">
      <span role="img" aria-label={label} className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <ProductCardStar
            key={index}
            aria-hidden="true"
            width={size}
            height={size}
            color={index < filled ? "#00B775" : "#C9DCC8"}
          />
        ))}
      </span>
      {showLabel && (
        <span aria-hidden="true">
          {rating === null
            ? "No reviews yet"
            : <>({rating.toFixed(1)}){reviewCount !== undefined && <> · {reviewCount} review{reviewCount === 1 ? "" : "s"}</>}</>}
        </span>
      )}
    </div>
  );
}
