"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { lato } from "../../../../../../../../../../../Downloads/the-quiver-dashboard-updates-new/the-quiver-dashboard-updates-new/the-quiver-feat-dashboard/src/lib/fonts";

type UploadSlotProps = {
  kind: "image" | "video";
  caption: string; // ex: "Cover Photo", "Image 1"
  required?: boolean;
  file: File | null;
  onPick: (file: File) => void;
  onRemove: () => void;
};

// one dotted upload box, shows a preview after a file is picked
export default function UploadSlot({ kind, caption, required, file, onPick, onRemove }: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    <div className="flex w-[84px] flex-col items-center gap-1.5">
      <div className="relative h-[84px] w-[84px]">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={`Upload ${caption}`}
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-[6px] border-2 border-dotted border-[#2F8F6B] bg-white transition-colors hover:bg-[#F3FFF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008A58]"
        >
          {previewUrl ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <video src={previewUrl} muted className="h-full w-full object-cover" />
            )
          ) : (
            <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full border-2 border-dotted border-[#2F8F6B] text-[#008A58]">
              <Plus size={18} aria-hidden />
            </span>
          )}
        </button>

        {file && (
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

      <span
        className={`${lato.className} text-center text-[11px] ${
          required ? "text-[#1E3A2C]" : "text-[#7C8A82]"
        }`}
      >
        {required && "* "}
        {caption}
      </span>
    </div>
  );
}