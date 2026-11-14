"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { calSans, lato } from "@/src/styles/fonts";
import { categories, type Category } from "@/src/app/(organization)/inventory/data";
import UploadSlot from "./UploadSlot";

const IMAGE_CAPTIONS = ["Cover Photo", "Image 1", "Image 2", "Image 3", "Image 4", "Image 5"];
const NAME_MAX = 100;
const DESCRIPTION_MAX = 250;

// video rules from the design: MP4, max 30 MB, 10-60s, not bigger than 1280x1280
const VIDEO_MAX_BYTES = 30 * 1024 * 1024;
const VIDEO_MIN_SECONDS = 10;
const VIDEO_MAX_SECONDS = 60;
const VIDEO_MAX_SIZE_PX = 1280;

// returns an error message, or null if the video is fine
function checkVideo(file: File): Promise<string | null> {
  if (file.type !== "video/mp4") return Promise.resolve("Video must be an MP4 file.");
  if (file.size > VIDEO_MAX_BYTES) return Promise.resolve("Video must be 30 MB or smaller.");

  // duration and resolution can only be read by loading the video
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (error: string | null) => {
      URL.revokeObjectURL(url);
      resolve(error);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      if (video.duration < VIDEO_MIN_SECONDS || video.duration > VIDEO_MAX_SECONDS) {
        done("Video must be 10 to 60 seconds long.");
      } else if (video.videoWidth > VIDEO_MAX_SIZE_PX || video.videoHeight > VIDEO_MAX_SIZE_PX) {
        done("Video resolution should not exceed 1280x1280px.");
      } else {
        done(null);
      }
    };
    video.onerror = () => done("Could not read this video file.");
    video.src = url;
  });
}

const fieldClass = `${lato.className} w-full rounded-[4px] border border-[#C9D6CE] bg-white px-3 text-[13px] text-[#1E3A2C] outline-none placeholder:text-[#8A9690] focus:border-[#008A58] focus:ring-1 focus:ring-[#008A58]`;

export default function AddProductForm() {
  const [images, setImages] = useState<(File | null)[]>(Array(IMAGE_CAPTIONS.length).fill(null));
  const [video, setVideo] = useState<File | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const setImage = (index: number, file: File | null) =>
    setImages((prev) => prev.map((f, i) => (i === index ? file : f)));

  const pickImage = (index: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      setMediaError("Product images must be image files.");
      return;
    }
    setMediaError("");
    setImage(index, file);
  };

  const pickVideo = async (file: File) => {
    const error = await checkVideo(file);
    setMediaError(error ?? "");
    if (!error) setVideo(file);
  };

  // TODO: price, stock, variants and the save / publish buttons are not in the Figma yet
  return (
    <section className="mt-8 max-w-[880px] rounded-[14px] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:px-7">
      <h2
        className={`${calSans.className} border-b border-[#C9D6CE] pb-2 text-[22px] text-[#4F7A63]`}
      >
        Basic Information
      </h2>

      <div className="mt-5 flex flex-col gap-6">
        <Row label="Product Images">
          <div className="flex flex-wrap justify-between gap-3">
            {IMAGE_CAPTIONS.map((caption, i) => (
              <UploadSlot
                key={caption}
                kind="image"
                caption={caption}
                required={i === 0}
                file={images[i]}
                onPick={(f) => pickImage(i, f)}
                onRemove={() => setImage(i, null)}
              />
            ))}
          </div>
        </Row>

        <Row label="Product Video">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <UploadSlot
              kind="video"
              caption="Cover Video"
              file={video}
              onPick={pickVideo}
              onRemove={() => setVideo(null)}
            />
            <div className={`${lato.className} pt-3 text-[12px] leading-relaxed text-[#6B7770]`}>
              <ol className="list-inside list-decimal">
                <li>Size: Max 30 Mb, resolution should not exceed 1280x1280px</li>
                <li>Duration: 10-60s</li>
                <li>Format: MP4</li>
              </ol>
              {/* shows when the picked file breaks one of the rules above */}
              {mediaError && (
                <p role="alert" className="mt-2 font-bold text-[#D0021B]">
                  {mediaError}
                </p>
              )}
            </div>
          </div>
        </Row>

        <Row label="*Product Category" htmlFor="product-category" center>
          <div className="relative">
            <select
              id="product-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={`${fieldClass} h-[40px] cursor-pointer appearance-none pr-9 ${
                category === "" ? "text-[#8A9690]" : ""
              }`}
            >
              <option value="" disabled>
                Select Category
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5C8F78]"
            />
          </div>
        </Row>

        <Row label="*Product Name" htmlFor="product-name" center>
          <div className="flex">
            <input
              id="product-name"
              type="text"
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Product Name"
              className={`${fieldClass} h-[40px] rounded-r-none`}
            />
            <span
              className={`${lato.className} flex w-[72px] shrink-0 items-center justify-center rounded-r-[4px] border border-l-0 border-[#C9D6CE] bg-[#F7F9F8] text-[13px] text-[#6B7770]`}
            >
              {name.length}/{NAME_MAX}
            </span>
          </div>
        </Row>

        <Row label="*Product Description" htmlFor="product-description">
          <div className="relative">
            <textarea
              id="product-description"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Product Description"
              className={`${fieldClass} h-[220px] resize-none py-2.5 pb-8`}
            />
            <span
              className={`${lato.className} pointer-events-none absolute bottom-2 right-3 text-[13px] text-[#6B7770]`}
            >
              {description.length}/{DESCRIPTION_MAX}
            </span>
          </div>
        </Row>
      </div>
    </section>
  );
}

// label on the left, field on the right (stacks on small screens)
function Row({
  label,
  htmlFor,
  center,
  children,
}: {
  label: string;
  htmlFor?: string;
  center?: boolean; // vertically center the label with a single-line field
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[150px_1fr] sm:gap-x-5">
      <label
        htmlFor={htmlFor}
        className={`${lato.className} text-[14px] text-[#6B7770] sm:text-right ${
          center ? "sm:flex sm:items-center sm:justify-end" : "sm:pt-1"
        }`}
      >
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}