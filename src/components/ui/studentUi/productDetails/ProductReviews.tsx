"use client";

import { useId, useState } from "react";
import { ListFilter } from "lucide-react";
import type { ProductReview } from "@/src/types/ProductDetails";
import StarRating from "./StarRating";

const dateFormat = new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });

export default function ProductReviews({ reviews }: { reviews: ProductReview[] }) {
  const [stars, setStars] = useState<number | "all">("all");
  const filterId = useId();
  const shown = stars === "all" ? reviews : reviews.filter((review) => review.rating === stars);

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-20">
      <div className="flex items-center justify-between gap-3">
        <h2 id="reviews-heading" className="font-heading text-xl text-[#2F4531]">
          Customer Reviews <span className="font-body text-sm font-normal text-[#5E9C79]">({reviews.length})</span>
        </h2>
        {reviews.length > 0 && (
          <label htmlFor={filterId} className="flex items-center gap-1.5 font-body text-xs text-[#2F4531]">
            <ListFilter aria-hidden="true" size={16} className="text-[#76CC2A]" />
            <span className="sr-only">Filter reviews by rating</span>
            <select
              id={filterId}
              value={stars}
              onChange={(event) => setStars(event.target.value === "all" ? "all" : Number(event.target.value))}
              className="rounded-md border border-[#AABDA8] bg-white px-2 py-1"
            >
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-3 font-body text-sm text-[#5E9C79]">No reviews yet.</p>
      ) : shown.length === 0 ? (
        <p className="mt-3 font-body text-sm text-[#5E9C79]">No {stars}-star reviews yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {shown.map((review) => (
            <li key={review.id} className="rounded-md border border-[#AABDA8] bg-[#F3FCF0] p-4 font-body text-[#2F4531] shadow-[1px_2px_6px_#233B2530] sm:px-6">
              <div className="flex items-start gap-4">
                <span aria-hidden="true" className="size-11 shrink-0 overflow-hidden rounded-full bg-[#B9D8A6]">
                  {review.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.avatarUrl} alt="" className="size-full object-cover" loading="lazy" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div>
                      <StarRating rating={review.rating} size={12} showLabel={false} />
                      <p className="mt-1 text-sm font-bold">{review.reviewer}</p>
                      {review.variants.length > 0 && (
                        <p className="text-[11px] text-[#5E9C79]">{review.variants.join(", ")}</p>
                      )}
                    </div>
                    <time dateTime={review.createdAt} className="text-xs text-[#1C9C6E]">
                      {dateFormat.format(new Date(review.createdAt))}
                    </time>
                  </div>
                  {review.comment && <p className="mt-3 whitespace-pre-line text-sm [overflow-wrap:anywhere]">{review.comment}</p>}
                  {review.imageUrls.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {review.imageUrls.map((url) => (
                        <li key={url}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Photo from this review" loading="lazy" className="size-20 rounded-md object-cover" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
