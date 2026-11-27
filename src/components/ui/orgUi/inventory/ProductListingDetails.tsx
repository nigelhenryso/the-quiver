"use client";

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { CalendarDays, Trash2, Wrench } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { VariantFields } from "@/src/services/createProduct";
import type { EditableProduct } from "@/src/services/editProduct";
import UploadSlot from "./UploadSlot";
import VariantConfigurationDialog, { getVariantColorLabel, getVariantSizeLabel } from "./VariantConfigurationDialog";
import { pickupFieldRowClass, productCardClass } from "./productFormLayout";

export const productHeadingClass = "border-b border-[#DDE5E0] pb-2 font-body font-bold text-[22px] text-[#6D8C78]";
export const productInputStyle = "h-9 rounded-[6px] border border-[#C9D6CE] bg-white px-3 font-body text-[13px] text-[#1E3A2C] placeholder:text-[#6B7770] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008A58]";
const productInputClass = `${productInputStyle} w-[700px]`;
const salesInputClass = `${productInputStyle} min-w-0 flex-1`;
const variantInputClass = `${productInputStyle} w-full min-w-0`;

const fieldLabelClass = "font-body text-[14px] text-[#626963] sm:text-right";
const salesRowClass = "grid items-center gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-4";

function countStock(variant: VariantFields, sizes: string[]) {
  return sizes.reduce((total, size) => total + (Number(variant.stock.get(size.toLowerCase())) || 0), 0);
}

const pickupFields = [
  { id: "contact-person", label: "Contact Person", placeholder: "Enter Name of Contact Person", type: "text", autoComplete: "name", required: true },
  { id: "contact-email", label: "Contact Email", placeholder: "Enter Email of Contact Person", type: "email", autoComplete: "email", required: true },
  { id: "contact-number", label: "Contact Number", placeholder: "Enter Contact Number of Contact Person", type: "tel", autoComplete: "tel", required: true },
  { id: "contact-social-url", label: "Contact Social URL", placeholder: "Enter Social Media Link of Contact Person", type: "url", autoComplete: "url", required: false },
] as const;

export default function ProductListingDetails({ variants, setVariants, sizes, setSizes, existing }: {
  variants: VariantFields[];
  setVariants: Dispatch<SetStateAction<VariantFields[]>>;
  sizes: string[];
  setSizes: (sizes: string[]) => void;
  existing?: EditableProduct;
}) {
  const [configuring, setConfiguring] = useState(false);
  const hasVariants = variants.length > 0;
  const stockSizes = sizes.length ? sizes : [""];
  const totalStock = variants.reduce((total, variant) => total + countStock(variant, variant.sizes ?? stockSizes), 0);

  function applyConfiguration(nextSizes: string[], colors: string[]) {
    const rowColors = colors.length ? colors : nextSizes.length ? [""] : [];
    const choices = nextSizes.length ? nextSizes : [""];
    setVariants((rows) => {
      const legacy = rows.filter((row) => row.label);
      const available = rows.filter((row) => !row.label);
      const configured = rowColors.flatMap<VariantFields>((color) => {
        const matches = available.filter((row) => row.color.toLowerCase() === color.toLowerCase());
        if (!matches.length) return [{ color, price: "", image: null, stock: new Map<string, string>() }];
        const selectedSizes = new Set(choices.map((size) => size.toLowerCase()));
        const retained = matches.map((row) => ({ ...row, sizes: (row.sizes ?? stockSizes).filter((size) => selectedSizes.has(size.toLowerCase())) }));
        const assigned = new Set(retained.flatMap((row) => row.sizes.map((size) => size.toLowerCase())));
        retained[0].sizes.push(...choices.filter((size) => !assigned.has(size.toLowerCase())));
        return retained.filter((row) => row.sizes.length > 0);
      });
      return [...legacy, ...configured];
    });
    setSizes(nextSizes);
  }

  return (
    <>
      <section id="sales-information" aria-labelledby="sales-information-heading" className={productCardClass}>
        <h2 id="sales-information-heading" className={productHeadingClass}>Sales Information</h2>
        <div className="mt-6 space-y-5">
          <div className={salesRowClass}>
            <span className={`${fieldLabelClass} ${hasVariants ? "sm:self-start sm:pt-2" : ""}`}>Variants</span>
            <div className="min-w-0 space-y-4">
              {hasVariants && (
                <div className="overflow-x-auto rounded-[5px] border border-[#DDE5E8]" tabIndex={0} role="region" aria-label="Product variants">
                  <table className="w-full min-w-[800px] table-fixed font-body text-[13px]">
                    <thead className="border-b border-[#B7DDD0] bg-[#F7FCFA] text-left text-[#005B46]">
                      <tr>
                        <th scope="col" className="w-[10%] px-3 py-2 font-normal">Image</th>
                        <th scope="col" className="w-[12%] px-3 py-2 font-normal">{variants.some((row) => row.label) ? "Variant" : "Color"}</th>
                        <th scope="col" className="w-[17%] px-3 py-2 font-normal">Variant Price</th>
                        <th scope="col" className="w-[38%] px-2 py-2 font-normal">Sizes &amp; Stock Allotment</th>
                        <th scope="col" className="w-[13%] px-3 py-2 text-center font-normal">Total Stock</th>
                        <th scope="col" className="w-[10%] px-3 py-2 text-center font-normal">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4ECE7]">
                      {variants.map((variant) => (
                        <VariantRow
                          key={variant.rowId ?? variant.color.toLowerCase()}
                          variant={variant}
                          sizes={variant.sizes ?? stockSizes}
                          onChange={(change) => setVariants((rows) => rows.map((row) => row === variant ? { ...row, ...change } : row))}
                          onRemove={() => setVariants((rows) => rows.filter((row) => row !== variant))}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                type="button"
                onClick={() => setConfiguring(true)}
                aria-haspopup="dialog"
                className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[6px] border-2 border-dotted border-[#008A58] px-3 font-body text-[13px] text-[#00956D] hover:bg-[#F3FBF7]"
              >
                <span className="flex size-[18px] items-center justify-center rounded-full border border-dashed border-[#008A58]">
                  <Wrench size={11} aria-hidden="true" />
                </span>
                Configure Variants
              </button>
            </div>
          </div>
          <div hidden={hasVariants} className="max-w-3xl">
            <div className="space-y-5">
              <ListingInput id="product-stock" label="Stock" type="number" min="0" step="1" placeholder="0" defaultValue={existing ? existing.identity.base?.stock ?? 0 : undefined} required={!hasVariants} disabled={hasVariants} rowClassName={salesRowClass} className={salesInputClass} />
              <ListingInput id="product-price" label="Price" type="number" min="0" step="0.01" placeholder="0.00" defaultValue={existing?.identity.base?.price ?? existing?.price} required={!hasVariants} disabled={hasVariants} currency rowClassName={salesRowClass} className={salesInputClass} />
            </div>
          </div>
          {hasVariants && (
            <div className="max-w-3xl pt-4">
              <ListingInput id="product-total-stock" label="Stock" value={totalStock} readOnly rowClassName={salesRowClass} className={`${salesInputClass} read-only:bg-[#F0F0F0] read-only:font-bold read-only:italic read-only:text-[#595959]`} />
            </div>
          )}
          <div className="max-w-[720px] space-y-4 sm:ml-9">
            <PreOrderSwitch initialStart={existing?.preorder_start_date} initialEnd={existing?.preorder_end_date} />
            <ListingSwitch id="org-exclusive" label="Org-Exclusive" defaultChecked={existing?.is_for_members_only}>
              Make the product available to organization members only.
            </ListingSwitch>
          </div>
        </div>
        {configuring && (
          <VariantConfigurationDialog
            sizes={hasVariants ? sizes : []}
            colors={[...new Set(variants.filter((row) => !row.label).map(({ color }) => color).filter(Boolean))]}
            onComplete={applyConfiguration}
            onClose={() => setConfiguring(false)}
          />
        )}
      </section>
      <section id="pickup-information" aria-labelledby="pickup-information-heading" className={productCardClass}>
        <h2 id="pickup-information-heading" className={productHeadingClass}>Pickup Information</h2>
        <div className="mt-4 space-y-5">
          {pickupFields.map(({ id, ...field }) => (
            <ListingInput key={id} id={id} {...field} required={!existing && field.required} defaultValue={
              id === "contact-person" ? existing?.pickup_contact_person ?? "" :
              id === "contact-email" ? existing?.pickup_contact_email ?? "" :
              id === "contact-number" ? existing?.pickup_contact_number ?? "" : existing?.pickup_social_url ?? ""
            } />
          ))}
        </div>
      </section>
    </>
  );
}

function ListingInput({ id, label, required, disabled, currency, rowClassName = pickupFieldRowClass, className = productInputClass, ...input }: ComponentPropsWithoutRef<"input"> & { id: string; label: string; currency?: boolean; rowClassName?: string }) {
  return (
    <div className={rowClassName}>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
        {required && <span aria-hidden="true" className="text-[#C52A35]">*</span>}
      </label>
      <div className="flex">
        {currency && <span aria-hidden="true" className={`flex w-9 shrink-0 items-center justify-center rounded-l-[6px] border border-r-0 border-[#C9D6CE] font-body text-[13px] text-[#626963] ${disabled ? "bg-[#F0F0F0]" : ""}`}>₱</span>}
        <input {...input} id={id} name={id} required={required} disabled={disabled} className={`${className} max-w-full disabled:bg-[#F0F0F0] disabled:text-[#626963] ${currency ? "rounded-l-none" : ""}`} />
      </div>
    </div>
  );
}

function PreOrderSwitch({ initialStart, initialEnd }: { initialStart?: string | null; initialEnd?: string | null }) {
  const [startDate, setStartDate] = useState(initialStart ?? "");
  const [endDate, setEndDate] = useState(initialEnd ?? "");

  return (
    <ListingSwitch
      id="pre-order"
      label="Pre-Order"
      defaultChecked={Boolean(initialStart && initialEnd)}
      details={
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <PreOrderDateField label="Starts from" name="pre-order-start" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
          <PreOrderDateField label="until" name="pre-order-end" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      }
    >
      Secure pre-orders ahead of release. The product will automatically switch to regular ordering after the pre-order period.
    </ListingSwitch>
  );
}

function PreOrderDateField({ label, ...input }: ComponentPropsWithoutRef<"input"> & { label: string }) {
  return (
    <label className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-[#404040]">
      <span>{label}</span>
      <span className="relative min-w-0 flex-1">
        <input
          {...input}
          type="date"
          required
          className={`${productInputStyle} relative block w-full pl-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-2.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
        />
        <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#404040]" />
      </span>
    </label>
  );
}

function ListingSwitch({ id, label, children, details, defaultChecked = false }: { id: string; label: string; children: ReactNode; details?: ReactNode; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  const detailsId = details && checked ? `${id}-details` : undefined;

  return (
    <div className="rounded-[10px] border border-[#008A58] font-body has-[:checked]:border-[#00B775] has-[:checked]:bg-[#EFFAF6]">
      <label className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        <span>
          <span id={`${id}-label`} className="block text-[14px] font-bold text-[#263B31]">{label}</span>
          <span id={`${id}-description`} className="mt-1 block text-[12px] text-[#626963]">{children}</span>
        </span>
        <span className="relative block shrink-0">
          <input
            name={id}
            type="checkbox"
            role="switch"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-description`}
            aria-controls={detailsId}
            className="peer sr-only"
          />
          <span aria-hidden="true" className="block h-6 w-11 rounded-full border-2 border-[#8B8B8B] bg-white after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-[#8B8B8B] motion-safe:after:transition-transform peer-checked:border-[#004D31] peer-checked:bg-[#004D31] peer-checked:after:translate-x-5 peer-checked:after:bg-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#008A58]" />
        </span>
      </label>
      {detailsId && (
        <div id={detailsId} className="mx-3 border-t border-[#D9E8DF] py-3 sm:mx-4 sm:py-4">
          {details}
        </div>
      )}
    </div>
  );
}

function VariantRow({ variant, sizes, onChange, onRemove }: {
  variant: VariantFields;
  sizes: string[];
  onChange: (change: Partial<VariantFields>) => void;
  onRemove: () => void;
}) {
  const { color, image, price, stock } = variant;
  const colorLabel = variant.label || getVariantColorLabel(color);
  const variantLabel = colorLabel ? `${colorLabel} variant` : "Variant";
  return (
    <tr>
      <td className="px-3 py-3">
        <UploadSlot
          kind="image"
          caption={`${variantLabel} image`}
          compact
          file={image}
          savedUrl={variant.savedImage?.url}
          hasSavedFile={Boolean(variant.savedImage)}
          onPick={(file) => {
            if (file.type.startsWith("image/")) onChange({ image: file });
          }}
          onRemove={() => onChange({ image: null, savedImage: null })}
        />
      </td>
      <th scope="row" className="break-words px-3 py-3 text-left font-bold text-[#005B46]">{colorLabel || "No color"}</th>
      <td className="px-3 py-3">
        <div className="relative max-w-[144px]">
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#626963]">₱</span>
          <input aria-label={`${variantLabel} price in pesos`} name="variantPrice" type="number" min="0" step="0.01" value={price} onChange={(event) => onChange({ price: event.target.value })} required placeholder="0.00" className={`${variantInputClass} pl-7`} />
        </div>
      </td>
      <td className="px-2 py-3">
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => {
            const sizeKey = size.toLowerCase();
            return (
              <label key={sizeKey} className="inline-flex h-9 max-w-full items-center gap-1 rounded-[5px] border border-[#C9D6CE] px-1">
                {size && <span title={size} className="min-w-0 truncate rounded-[4px] bg-[#B8D6CE] px-1 py-0.5 font-bold text-[#084C3E]">{getVariantSizeLabel(size)}</span>}
                <input
                  aria-label={size ? `${colorLabel || "Variant"} size ${size} stock` : `${colorLabel || "Variant"} stock`}
                  name="variantStock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="0"
                  value={stock.get(sizeKey) ?? ""}
                  onChange={(event) => onChange({ stock: new Map(stock).set(sizeKey, event.target.value) })}
                  className="h-5 w-10 shrink-0 rounded-[4px] border border-[#C9D6CE] bg-white px-1 text-center text-[#1E3A2C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008A58] [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                />
                <span aria-hidden="true" className="text-[10px] text-[#677182]">pcs</span>
              </label>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-3 text-center tabular-nums text-[#005B46]">{countStock(variant, sizes)}</td>
      <td className="px-3 py-3 text-center">
        <button type="button" aria-label={colorLabel ? `Remove ${variantLabel}` : "Remove variant"} onClick={onRemove} className="inline-flex size-9 items-center justify-center rounded text-[#737973] hover:bg-[#F4F7F8] hover:text-[#B42318] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008A58]">
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}
