"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { lato } from "@/src/styles/fonts";

type UploadSlotProps = {
  kind: "image" | "video";
  caption: string; // ex: "Cover Photo", "Image 1"
  required?: boolean;
  inlineCaption?: boolean;
  compact?: boolean;
  file: File | null;
  savedUrl?: string | null;
  hasSavedFile?: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
};

// one dotted upload box, shows a preview after a file is picked
export default function UploadSlot({ kind, caption, required, inlineCaption, compact, file, savedUrl, hasSavedFile, onPick, onRemove }: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const displayUrl = previewUrl ?? savedUrl;
  const hasFile = Boolean(file || hasSavedFile);

  // make a preview url for the picked file and clean it up afterwards
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className={`flex flex-col items-center gap-1.5 ${compact ? "w-10" : inlineCaption ? "w-24 xl:w-[108px]" : "w-[84px]"}`}>
      <div className="relative aspect-square w-full">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={`Upload ${caption}${required && inlineCaption ? " (required)" : ""}`}
          className={`flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[6px] border-2 border-dotted transition-colors hover:bg-[#F3FFF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008A58] ${
            compact ? "border-[#25C494] bg-[#F3FBF6] text-[#008A58]" : inlineCaption ? (required ? "border-[#25C494] bg-[#F3FBF6]" : "border-[#CFDDEA] bg-[#F5F8FA]") : "border-[#2F8F6B] bg-white"
          }`}
        >
          {displayUrl ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <video src={displayUrl} muted className="h-full w-full object-cover" />
            )
          ) : compact ? (
            <Plus size={16} aria-hidden />
          ) : (
            <>
              <span className={`flex items-center justify-center rounded-full ${
                inlineCaption
                  ? `size-11 ${required ? "bg-[#CEF6E7] text-[#007C57]" : "border border-[#EDF1F5] bg-white text-[#64748B]"}`
                  : "size-9 border-2 border-dotted border-[#2F8F6B] text-[#008A58]"
              }`}>
                <Plus size={inlineCaption ? 20 : 18} aria-hidden />
              </span>
              {inlineCaption && <span className={`${lato.className} mt-1 text-[11px] font-bold ${required ? "text-[#004D31]" : "text-[#64748B]"}`}>
                {caption}{required && <span className="text-[#C52A35]">*</span>}
              </span>}
            </>
          )}
        </button>

        {hasFile && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${caption}`}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#004D31] text-white hover:bg-[#003622]"
          >
            <X size={12} />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          hidden
          accept={kind === "image" ? "image/*" : "video/mp4"}
          onChange={(e) => {
            const picked = e.target.files?.[0];
            e.target.value = ""; // so picking the same file again still works
            if (picked) onPick(picked);
          }}
        />
      </div>

      {!compact && (!inlineCaption || hasFile) && <span
        className={`${lato.className} text-center text-[11px] ${
          required ? "text-[#1E3A2C]" : "text-[#7C8A82]"
        }`}
      >
        {required && "* "}
        {caption}
      </span>}
    </div>
  );
}
