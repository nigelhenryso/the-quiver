"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";

const freeSize = "Free Size/One Size";
const sizePresets = [
  { label: "S", value: "Small" },
  { label: "M", value: "Medium" },
  { label: "L", value: "Large" },
  { label: "XL", value: "Extra Large" },
  { label: "2XL", value: "Extra Extra Large" },
  { label: freeSize, value: freeSize },
];

const colorPresets = ["White", "Black", "Blue", "Red", "Green", "Yellow"].map((label) => ({
  label,
  value: label.toLowerCase(),
}));

export function getVariantSizeLabel(size: string) {
  return sizePresets.find(({ value }) => value === size)?.label ?? size;
}

export function getVariantColorLabel(color: string) {
  return colorPresets.find(({ value }) => value === color)?.label ?? color;
}

type Props = {
  sizes: string[];
  colors: string[];
  onComplete: (sizes: string[], colors: string[]) => void;
  onClose: () => void;
};

const focusClass = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004D31]";
const optionClass = `min-h-11 min-w-0 break-words rounded-[10px] border border-white/40 bg-white/10 px-2 py-2 text-center text-[15px] text-white disabled:cursor-not-allowed disabled:opacity-45 aria-pressed:border-white/80 aria-pressed:bg-[#00784F] sm:min-h-12 sm:text-[16px] ${focusClass}`;

export default function VariantConfigurationDialog({ sizes, colors, onComplete, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const addCustom = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<"size" | "color">("size");
  const [draftSizes, setDraftSizes] = useState(sizes);
  const [draftColors, setDraftColors] = useState(colors);
  const [custom, setCustom] = useState<string | null>(null);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  useEffect(() => {
    if (heading.current) heading.current.focus();
  }, [step]);

  const isSize = step === "size";
  const presets = isSize ? sizePresets : colorPresets;
  const selection = isSize ? draftSizes : draftColors;
  const setSelection = isSize ? setDraftSizes : setDraftColors;
  const hasSpecificSize = draftSizes.some((size) => size !== freeSize);
  const freeSizeSelected = isSize && draftSizes.includes(freeSize);
  const canContinue = isSize ? freeSizeSelected || draftSizes.length >= 2 : draftColors.length > 0;
  const customValues = selection.filter((value) => !presets.some((preset) => preset.value === value));
  const singular = isSize ? "Size" : "Color";
  const plural = isSize ? "sizes" : "colors";

  function changeStep(next: "size" | "color") {
    setCustom(null);
    setStep(next);
  }

  function finish(useColors: boolean) {
    onComplete(draftSizes, useColors ? draftColors : []);
    dialog.current?.close();
  }

  function addOption(options: string[], value: string) {
    if (isSize && (options.includes(freeSize) || (value === freeSize && options.length > 0))) return options;
    return [...options, value];
  }

  function toggle(value: string) {
    if (isSize && value === freeSize) setCustom(null);
    setSelection((options) => options.includes(value) ? options.filter((option) => option !== value) : addOption(options, value));
  }

  function saveCustom() {
    const label = custom?.trim().replace(/\s+/g, " ");
    if (!label) return;
    const folded = label.toLowerCase();
    const preset = presets.find(({ value, label }) => value.toLowerCase() === folded || label.toLowerCase() === folded);
    const value = preset?.value ?? label;
    setSelection((options) => options.some((option) => option.toLowerCase() === value.toLowerCase()) ? options : addOption(options, value));
    setCustom(null);
    addCustom.current?.focus();
  }

  function handleCustomKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      saveCustom();
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="configure-variants-heading"
      aria-describedby="configure-variants-description"
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[560px] overflow-y-auto rounded-[16px] bg-[linear-gradient(180deg,#00B574_29%,#69D2AE_100%)] px-5 pb-6 pt-8 font-body text-[#DBFFF1] shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop:bg-black/30 sm:px-7 sm:pb-8 sm:pt-9"
    >
      <button type="button" aria-label="Close variant configuration" onClick={() => dialog.current?.close()} className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-[#008653] text-[#C0F2DE] hover:bg-[#006B46] sm:right-4 sm:top-4 ${focusClass}`}>
        <X size={19} aria-hidden="true" />
      </button>

      <h3 ref={heading} tabIndex={-1} id="configure-variants-heading" className="pr-5 font-heading text-[25px] leading-[1.22] tracking-tight text-[#E2FFF4] focus:outline-none sm:text-[34px]">
        What are the available {plural} for your product?
      </h3>
      <p id="configure-variants-description" className="mt-3 text-[14px] text-[#C4F1E0] sm:text-[17px]">
        {isSize ? "Select at least two sizes, or choose Free Size/One Size." : "Select all the colors that apply to your merchandise."}
      </p>

      <div role="group" aria-label={isSize ? "Available sizes" : "Available colors"} className={`mt-5 grid gap-2.5 sm:mt-6 sm:gap-x-5 sm:gap-y-4 ${isSize ? "grid-cols-4" : "grid-cols-3"}`}>
        {presets.map(({ label, value }) => {
          const selected = selection.includes(value);
          const isFreeSizeOption = isSize && value === freeSize;
          return (
            <button key={value} type="button" aria-pressed={selected} aria-label={isSize ? value : label} disabled={isFreeSizeOption ? hasSpecificSize : freeSizeSelected} onClick={() => toggle(value)} className={`${optionClass} ${selected ? "" : "enabled:hover:bg-white/20"} ${isFreeSizeOption ? "col-span-2" : ""}`}>
              {label}
            </button>
          );
        })}
        {customValues.map((value) => (
          <button key={value} type="button" aria-pressed="true" onClick={() => toggle(value)} className={optionClass}>{value}</button>
        ))}
      </div>

      <button ref={addCustom} type="button" aria-expanded={custom !== null} disabled={freeSizeSelected} onClick={() => setCustom("")} className={`mt-5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-white/55 px-3 text-[15px] text-white enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 sm:mt-6 sm:text-[16px] ${focusClass}`}>
        <Plus size={18} aria-hidden="true" /> Add Custom {singular}
      </button>
      {custom !== null && (
        <div className="mt-2 flex items-center gap-2">
          <input autoFocus aria-label={`Custom ${step}`} value={custom} maxLength={40} onChange={(event) => setCustom(event.target.value)} onKeyDown={handleCustomKey} className={`h-10 min-w-0 flex-1 rounded-[6px] bg-white px-3 text-[14px] text-[#004D31] ${focusClass}`} />
          <button type="button" onClick={saveCustom} disabled={!custom.trim()} className={`h-10 rounded-[6px] bg-[#008653] px-3 text-[14px] text-white disabled:opacity-55 ${focusClass}`}>Add {singular}</button>
        </div>
      )}

      <button type="button" onClick={() => isSize ? changeStep("color") : finish(true)} disabled={!canContinue || Boolean(custom?.trim())} className={`mt-7 min-h-[52px] w-full rounded-[10px] bg-[#008653] px-3 font-heading text-[22px] text-[#E2FFF4] enabled:hover:bg-[#006E48] disabled:cursor-not-allowed sm:mt-10 sm:min-h-[56px] ${focusClass}`}>
        {isSize ? "Next" : "Complete"}
      </button>
      <div className={`mt-3 flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#004D31] sm:mt-4 sm:text-[15px] ${isSize ? "justify-center" : "justify-between"}`}>
        {!isSize && (
          <button type="button" onClick={() => changeStep("size")} className={`inline-flex items-center gap-1 rounded p-1 hover:underline ${focusClass}`}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to Sizes
          </button>
        )}
        {(isSize || draftSizes.length > 0) && (
          <button type="button" onClick={() => {
            if (isSize) {
              setDraftSizes([]);
              changeStep("color");
            } else {
              finish(false);
            }
          }} className={`rounded p-1 hover:underline ${focusClass}`}>Skip/Not Applicable</button>
        )}
      </div>
    </dialog>
  );
}
