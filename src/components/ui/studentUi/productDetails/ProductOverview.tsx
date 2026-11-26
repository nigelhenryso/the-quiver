"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { addToOrderCart } from "@/src/actions/cartActions";
import type { ProductDetails } from "@/src/types/ProductDetails";
import MediaCarousel from "./MediaCarousel";
import StarRating from "./StarRating";

const peso = (value: number) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Selection = Record<string, string | undefined>;

export default function ProductOverview({ product, initialCartCount }: { product: ProductDetails; initialCartCount: number }) {
  const router = useRouter();
  const { optionGroups, combinations } = product;
  const [selection, setSelection] = useState<Selection>(() =>
    // Pre-select groups that only have one option.
    Object.fromEntries(optionGroups.filter((group) => group.options.length === 1).map((group) => [group.key, group.options[0].id])),
  );
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  /** Combinations that fit every chosen option. */
  const matching = (choice: Selection) => combinations.filter((combination) =>
    Object.values(choice).every((optionId) => !optionId || combination.optionIds.includes(optionId)));

  const allChosen = optionGroups.every((group) => selection[group.key]);
  const selected = allChosen ? matching(selection)[0] ?? null : null;
  const maxQuantity = selected?.stock ?? 0;

  const media = useMemo(() => {
    const seen = new Set(product.media.map((item) => item.url));
    const variantPhotos = combinations.flatMap((combination) =>
      combination.imageUrl && !seen.has(combination.imageUrl) && seen.add(combination.imageUrl)
        ? [{ kind: "image" as const, url: combination.imageUrl }]
        : []);
    return [...product.media, ...variantPhotos];
  }, [product.media, combinations]);

  // Photo of the chosen variant, or of the first variant that fits what's chosen so far.
  const focusUrl = selected?.imageUrl
    ?? (Object.values(selection).some(Boolean) ? matching(selection).find((combination) => combination.imageUrl)?.imageUrl : null)
    ?? null;

  const prices = (selected ? [selected] : matching(selection)).map((combination) => combination.price);
  const minPrice = prices.length ? Math.min(...prices) : product.price;
  const maxPrice = prices.length ? Math.max(...prices) : product.price;

  function choose(groupKey: string, optionId: string) {
    setMessage(null);
    setQuantity(1);
    setSelection((current) => {
      if (current[groupKey] === optionId) return { ...current, [groupKey]: undefined };
      const next: Selection = { ...current, [groupKey]: optionId };
      // Drop other choices that no longer combine with this one.
      for (const group of optionGroups) {
        if (group.key !== groupKey && next[group.key] && matching({ [groupKey]: optionId, [group.key]: next[group.key] }).length === 0) {
          next[group.key] = undefined;
        }
      }
      return next;
    });
  }

  function addToCart(thenCheckout: boolean) {
    if (!selected) return;
    setMessage(null);
    startTransition(async () => {
      const result = await addToOrderCart(product.id, selected.id, quantity);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setCartCount(result.cartCount);
      if (thenCheckout) router.push("/cart");
      else setMessage({ tone: "ok", text: `Added ${quantity} to your ${product.organization.acronym ?? product.organization.name} cart.` });
    });
  }

  const outOfStock = combinations.every((combination) => combination.stock <= 0);
  const buttonDisabled = pending || !selected || selected.stock <= 0;
  const hint = outOfStock
    ? "Sold out"
    : !allChosen
      ? `Choose ${optionGroups.filter((group) => !selection[group.key]).map((group) => group.name.toLowerCase()).join(" and ")}`
      : selected && selected.stock <= 0
        ? "This option is sold out"
        : selected && selected.stock <= 5
          ? `Only ${selected.stock} left`
          : null;

  return (
    <>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        <MediaCarousel media={media} name={product.name} focusUrl={focusUrl} />

        <div className="font-body text-[#2F4531]">
          <p className="text-xs text-[#5E9C79]">{product.organization.name}</p>
          <h1 className="mt-1 font-heading text-3xl font-bold leading-tight text-[#2F4531] sm:text-[34px]">{product.name}</h1>
          <p className="mt-2 text-lg font-bold">
            {minPrice === maxPrice ? peso(minPrice) : `${peso(minPrice)} – ${peso(maxPrice)}`}
          </p>

          {product.reviews.length > 0 && (
            <a href="#reviews" className="mt-3 inline-block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#244432]">
              <StarRating rating={product.averageRating} reviewCount={product.reviews.length} size={15} />
            </a>
          )}

          <hr className="my-4 border-[#9ED3B5]" />

          {optionGroups.map((group) => (
            <fieldset key={group.key} className="mb-4">
              <legend className="mb-2 text-sm font-bold">{group.name}</legend>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const active = selection[group.key] === option.id;
                  const fits = matching({ ...selection, [group.key]: option.id });
                  const unavailable = fits.length === 0;
                  const soldOut = !unavailable && fits.every((combination) => combination.stock <= 0);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => choose(group.key, option.id)}
                      title={soldOut ? "Sold out" : unavailable ? "Not available with your other choices" : undefined}
                      className={`min-w-11 rounded-md border px-3 py-1.5 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244432] ${
                        active
                          ? "border-[#1C9C6E] bg-[#1C9C6E] text-white"
                          : "border-[#1C9C6E] bg-white text-[#1C9C6E] hover:bg-[#E6F8DF]"
                      } ${soldOut || unavailable ? "opacity-50" : ""} ${soldOut ? "line-through" : ""}`}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="mb-5">
            <p id="quantity-label" className="mb-2 text-sm font-bold">Quantity</p>
            <div role="group" aria-labelledby="quantity-label" className="inline-flex items-center rounded-full border border-[#9ED3B5] bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                className="grid size-8 place-items-center rounded-full text-[#2F4531] disabled:opacity-30"
              >
                <Minus aria-hidden="true" size={14} />
              </button>
              <output aria-live="polite" className="w-8 text-center text-sm">{quantity}</output>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                disabled={!selected || quantity >= maxQuantity}
                className="grid size-8 place-items-center rounded-full text-[#2F4531] disabled:opacity-30"
              >
                <Plus aria-hidden="true" size={14} />
              </button>
            </div>
            {hint && <p className="mt-2 text-xs text-[#5E9C79]">{hint}</p>}
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => addToCart(false)}
              disabled={buttonDisabled}
              className="h-10 w-full rounded-md bg-[#76CC2A] text-sm font-bold text-white shadow-sm transition hover:bg-[#67B624] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Adding…" : "Add to Order Cart"}
            </button>
            <button
              type="button"
              onClick={() => addToCart(true)}
              disabled={buttonDisabled}
              className="h-10 w-full rounded-md bg-[#1C9C6E] text-sm font-bold text-white shadow-sm transition hover:bg-[#178660] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>
          <p role="status" className={`mt-2 min-h-4 text-xs ${message?.tone === "error" ? "text-[#B3261E]" : "text-[#1C9C6E]"}`}>
            {message?.text}
          </p>
        </div>
      </div>

      <Link
        href="/cart"
        className="fixed bottom-6 left-6 z-40 flex items-center rounded-full font-body shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244432] motion-reduce:hover:scale-100"
      >
        <span className="relative z-10 grid size-14 place-items-center rounded-full bg-[#244432] text-white">
          <ShoppingCart aria-hidden="true" size={26} />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#F5FEF2] px-1 text-[10px] font-bold text-[#244432] ring-2 ring-[#244432]">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </span>
        <span className="-ml-5 rounded-r-full border border-[#AABDA8] bg-[#F5FEF2] py-2 pl-7 pr-5 text-center text-xs leading-tight text-[#2F4531]">
          <span className="block font-bold">{product.organization.acronym ?? product.organization.name}</span>
          Cart
          <span className="sr-only">, {cartCount} item{cartCount === 1 ? "" : "s"}</span>
        </span>
      </Link>
    </>
  );
}
