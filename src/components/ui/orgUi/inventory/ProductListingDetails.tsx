"use client";

import { useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import UploadSlot from "./UploadSlot";
import { pickupFieldRowClass, productCardClass } from "./productFormLayout";

export const productHeadingClass = "border-b border-[#DDE5E0] pb-2 font-body font-bold text-[22px] text-[#6D8C78]";
export const productInputStyle = "h-9 rounded-[6px] border border-[#C9D6CE] bg-white px-3 font-body text-[13px] text-[#1E3A2C] placeholder:text-[#6B7770] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008A58]";
const productInputClass = `${productInputStyle} w-[700px]`;
const salesInputClass = `${productInputStyle} min-w-0 flex-1`;
const variantInputClass = `${productInputStyle} w-full min-w-0`;

const fieldLabelClass = "font-body text-[14px] text-[#626963] sm:text-right";
const salesRowClass = "grid items-center gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-4";
const pickupFields = [
  { id: "contact-person", label: "Contact Person", placeholder: "Enter Name of Contact Person", type: "text", autoComplete: "name", required: true },
  { id: "contact-email", label: "Contact Email", placeholder: "Enter Email of Contact Person", type: "email", autoComplete: "email", required: true },
  { id: "contact-number", label: "Contact Number", placeholder: "Enter Contact Number of Contact Person", type: "tel", autoComplete: "tel", required: true },
  { id: "contact-social-url", label: "Contact Social URL", placeholder: "Enter Social Media Link of Contact Person", type: "url", autoComplete: "url", required: false },
] as const;

export default function ProductListingDetails() {
  const [variants, setVariants] = useState<number[]>([]);
  const nextVariantId = useRef(0);
  const hasVariants = variants.length > 0;

  return (
    <>
      <section id="sales-information" aria-labelledby="sales-information-heading" className={productCardClass}>
        <h2 id="sales-information-heading" className={productHeadingClass}>Sales Information</h2>
        <div className="mt-4 max-w-3xl space-y-5">
          <div className={salesRowClass}>
            <span className={`${fieldLabelClass} ${hasVariants ? "sm:self-start sm:pt-2" : ""}`}>Variants</span>
            <div className="min-w-0 space-y-4">
              {hasVariants && (
                <div className="overflow-x-auto rounded-[5px] border border-[#DDE5E0]" tabIndex={0} role="region" aria-label="Product variants">
                  <table className="w-full min-w-[460px] table-fixed font-body text-[13px]">
                    <thead className="border-b border-[#CAE8D9] bg-[#F4FAF7] text-left text-[#004D31]">
                      <tr>
                        <th scope="col" className="w-[13%] px-3 py-2 font-normal">Image</th>
                        <th scope="col" className="w-[28%] px-3 py-2 font-normal">Variant Name</th>
                        <th scope="col" className="w-[27%] px-3 py-2 font-normal">Variant Price</th>
                        <th scope="col" className="w-[17%] px-3 py-2 font-normal">Stock</th>
                        <th scope="col" className="w-[15%] px-3 py-2 text-center font-normal">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4ECE7]">
                      {variants.map((id, index) => (
                        <VariantRow key={id} number={index + 1} onRemove={() => setVariants((rows) => rows.filter((row) => row !== id))} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const id = nextVariantId.current++;
                  setVariants((rows) => [...rows, id]);
                }}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-[6px] border-2 border-dotted border-[#00956D] px-3 font-body text-[13px] text-[#007C57] hover:bg-[#F3FBF7]"
              >
                <Plus size={14} aria-hidden="true" />
                {hasVariants ? "Add Another Variant" : "Add Variants (Size, Color)"}
              </button>
            </div>
          </div>
          <ListingInput id="product-stock" label="Stock" type="number" min="0" step="1" placeholder="0" required={!hasVariants} disabled={hasVariants} rowClassName={salesRowClass} className={salesInputClass} />
          <ListingInput id="product-price" label="Price" type="number" min="0" step="0.01" placeholder="0.00" required={!hasVariants} disabled={hasVariants} currency rowClassName={salesRowClass} className={salesInputClass} />
          <div className="space-y-3 sm:ml-9">
            <PreOrderSwitch />
            <ListingSwitch id="org-exclusive" label="Org-Exclusive">
              Make the product available to organization members only.
            </ListingSwitch>
          </div>
        </div>
      </section>
      <section id="pickup-information" aria-labelledby="pickup-information-heading" className={productCardClass}>
        <h2 id="pickup-information-heading" className={productHeadingClass}>Pickup Information</h2>
        <div className="mt-4 space-y-5">
          {pickupFields.map(({ id, ...field }) => (
            <ListingInput key={id} id={id} {...field} />
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

function PreOrderSwitch() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <ListingSwitch
      id="pre-order"
      label="Pre-Order"
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

function ListingSwitch({ id, label, children, details }: { id: string; label: string; children: ReactNode; details?: ReactNode }) {
  const [checked, setChecked] = useState(false);
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

function VariantRow({ number, onRemove }: { number: number; onRemove: () => void }) {
  const [image, setImage] = useState<File | null>(null);

  return (
    <tr>
      <td className="px-3 py-3">
        <UploadSlot
          kind="image"
          caption={`variant ${number} image`}
          compact
          file={image}
          onPick={(file) => {
            if (file.type.startsWith("image/")) setImage(file);
          }}
          onRemove={() => setImage(null)}
        />
      </td>
      <td className="px-3 py-3">
        <input aria-label={`Variant ${number} name`} name="variantName" required pattern={".*\\S.*"} placeholder="Enter Variant Name" className={variantInputClass} />
      </td>
      <td className="px-3 py-3">
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#626963]">₱</span>
          <input aria-label={`Variant ${number} price in pesos`} name="variantPrice" type="number" min="0" step="0.01" required placeholder="0.00" className={`${variantInputClass} pl-7`} />
        </div>
      </td>
      <td className="px-3 py-3">
        <input aria-label={`Variant ${number} stock`} name="variantStock" type="number" min="0" step="1" required placeholder="0" className={variantInputClass} />
      </td>
      <td className="px-3 py-3 text-center">
        <button type="button" aria-label={`Remove variant ${number}`} onClick={onRemove} className="inline-flex size-9 items-center justify-center rounded text-[#626963] hover:bg-[#F4F7F8] hover:text-[#B42318] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008A58]">
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}
