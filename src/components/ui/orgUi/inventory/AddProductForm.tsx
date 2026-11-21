"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { calSans, lato } from "@/src/styles/fonts";
import type { Tag } from "@/src/types/Tag";
import UploadSlot from "./UploadSlot";
import ProductListingDetails, { productHeadingClass, productInputStyle } from "./ProductListingDetails";
import { basicInformationFieldWidth, basicInformationRowClass, productCardClass, productFormGridClass, productFormProgressClass, productFormSectionsClass } from "./productFormLayout";

const IMAGE_CAPTIONS = ["Cover Photo", "Image 1", "Image 2", "Image 3", "Image 4", "Image 5"];
const NAME_MAX = 100;
const DESCRIPTION_MAX = 250;
const sections = [
  { id: "basic-information", label: "Basic Information" },
  { id: "sales-information", label: "Sales Information" },
  { id: "pickup-information", label: "Pickup Information" },
] as const;


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

export default function AddProductForm({ tags, showListingDetails = false }: { tags: Tag[]; showListingDetails?: boolean }) {
  const [images, setImages] = useState<(File | null)[]>(Array(IMAGE_CAPTIONS.length).fill(null));
  const [video, setVideo] = useState<File | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [tagId, setTagId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const [coverError, setCoverError] = useState(false);
  const [notice, setNotice] = useState("");
  const coverGroup = useRef<HTMLDivElement>(null);
  const categoryTrigger = useRef<HTMLButtonElement>(null);
  const actionBar = useRef<HTMLDivElement>(null);
  const videoRequest = useRef(0);
  const [checkingVideo, setCheckingVideo] = useState(false);
  const inputClass = showListingDetails ? `${productInputStyle} w-full` : fieldClass;
  const fieldWidth = showListingDetails ? basicInformationFieldWidth : "";
  const selectedTag = tags.find((tag) => tag.tag_id === tagId);

  useEffect(() => {
    const bar = actionBar.current;
    const page = bar?.closest<HTMLElement>("[data-add-product-page]");
    if (!bar || !page) return;

    const reserveBarHeight = () => {
      page.style.setProperty("--product-action-bar-height", `${bar.offsetHeight}px`);
    };
    const observer = new ResizeObserver(reserveBarHeight);
    reserveBarHeight();
    observer.observe(bar);

    return () => {
      observer.disconnect();
      page.style.removeProperty("--product-action-bar-height");
    };
  }, [showListingDetails]);

  useEffect(() => {
    if (!showListingDetails) return;
    const updateProgress = () => {
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActiveSection(sections[2].id);
        return;
      }
      const current = [...sections].reverse().find(({ id }) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= 160;
      });
      setActiveSection(current?.id ?? sections[0].id);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [showListingDetails]);

  const setImage = (index: number, file: File | null) =>
    setImages((prev) => prev.map((f, i) => (i === index ? file : f)));

  const pickImage = (index: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      setMediaError("Product images must be image files.");
      return;
    }
    setMediaError("");
    if (index === 0) setCoverError(false);
    setImage(index, file);
  };

  const pickVideo = async (file: File) => {
    const request = ++videoRequest.current;
    setCheckingVideo(true);
    const error = await checkVideo(file);
    if (request !== videoRequest.current) return;
    setCheckingVideo(false);
    setMediaError(error ?? "");
    if (!error) setVideo(file);
  };

  const removeVideo = () => {
    videoRequest.current++;
    setCheckingVideo(false);
    setMediaError("");
    setVideo(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (checkingVideo) return;
    if (!images[0]) {
      setCoverError(true);
      coverGroup.current?.querySelector("button")?.focus();
      return;
    }
    if (!selectedTag) {
      setNotice("A product category is required before continuing.");
      categoryTrigger.current?.focus();
      return;
    }
    if (!description.trim()) {
      setNotice("Enter a product description before continuing.");
      event.currentTarget.querySelector<HTMLTextAreaElement>("#product-description")?.focus();
      return;
    }
    setNotice("Publish preview ready. This form is in preview mode.");
  };

  const basicInformation = (
    <section id={showListingDetails ? sections[0].id : undefined} aria-labelledby="basic-information-heading" className={
      showListingDetails ? productCardClass : "mt-8 max-w-[880px] rounded-[14px] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:px-7"
    }>
      <h2
        id="basic-information-heading"
        className={showListingDetails ? productHeadingClass : `font-body border-b border-[#C9D6CE] pb-2 text-[22px] text-[#4F7A63]`}
      >
        Basic Information
      </h2>

      <div className={`flex flex-col ${showListingDetails ? "mt-4 gap-5" : "mt-6 gap-6"}`}>
        <Row label="Product Images" required={false}>
          <div ref={coverGroup} className={`flex flex-wrap ${showListingDetails ? "gap-6 xl:gap-[50px]" : "justify-between gap-3"}`}>
            {(showListingDetails ? IMAGE_CAPTIONS.slice(0, 5) : IMAGE_CAPTIONS).map((caption, i) => (
              <UploadSlot
                key={caption}
                kind="image"
                caption={caption}
                required={i === 0}
                inlineCaption={showListingDetails}
                file={images[i]}
                onPick={(f) => pickImage(i, f)}
                onRemove={() => setImage(i, null)}
              />
            ))}
          </div>
          {coverError && <p role="alert" className="mt-2 font-body text-sm text-[#B42318]">Add a cover photo to continue.</p>}
        </Row>

        <Row label="Product Video" required={false}>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <UploadSlot
              kind="video"
              caption="Cover Video"
              inlineCaption={showListingDetails}
              file={video}
              onPick={pickVideo}
              onRemove={removeVideo}
            />
            <div className={`${lato.className} pt-3 text-[12px] leading-relaxed text-[#6B7770] ${showListingDetails ? "sm:self-center sm:pt-0" : ""}`}>
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

        <Row label={showListingDetails ? "Product Category" : "*Product Category"} htmlFor="product-category" required={showListingDetails} center>
          <div className={fieldWidth}>
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger
                id="product-category"
                ref={categoryTrigger}
                disabled={tags.length === 0}
                aria-describedby="product-category-value"
                className={`${inputClass} ${showListingDetails ? "" : "h-[40px]"} flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed`}
              >
                <span id="product-category-value" className={`truncate ${selectedTag ? "" : "text-[#6B7770]"}`}>
                  {selectedTag?.name ?? (tags.length ? "Select Category" : "No categories available")}
                </span>
                <ChevronDown size={16} aria-hidden className="shrink-0 text-[#5C8F78]" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  sideOffset={4}
                  className="z-[60] max-h-[min(6.75rem,var(--radix-dropdown-menu-content-available-height))] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto overscroll-contain rounded-[6px] bg-white font-body text-[13px] text-[#1E3A2C] shadow-md ring-1 ring-[#C9D6CE]"
                >
                  <DropdownMenu.RadioGroup
                    value={tagId}
                    onValueChange={(value) => {
                      setTagId(value);
                      setNotice("");
                    }}
                  >
                    {tags.map((tag) => (
                      <DropdownMenu.RadioItem
                        key={tag.tag_id}
                        value={tag.tag_id}
                        textValue={tag.name}
                        className="flex h-9 cursor-pointer items-center justify-between gap-2 px-3 outline-none data-[highlighted]:bg-[#E9FBF2]"
                      >
                        <span className="truncate">{tag.name}</span>
                        <DropdownMenu.ItemIndicator className="shrink-0 text-[#008A58]">
                          <Check size={14} aria-hidden />
                        </DropdownMenu.ItemIndicator>
                      </DropdownMenu.RadioItem>
                    ))}
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </Row>

        <Row label={showListingDetails ? "Product Name" : "*Product Name"} htmlFor="product-name" required={showListingDetails} center>
          <div className={`flex ${fieldWidth}`}>
            <input
              id="product-name"
              type="text"
              value={name}
              maxLength={NAME_MAX}
              required={showListingDetails}
              pattern={showListingDetails ? ".*\\S.*" : undefined}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Product Name"
              className={`${inputClass} ${showListingDetails ? "min-w-0 flex-1" : "h-[40px]"} rounded-r-none`}
            />
            <span
              className={`${lato.className} flex w-[72px] shrink-0 items-center justify-center rounded-r-[4px] border border-l-0 border-[#C9D6CE] bg-[#F7F9F8] text-[13px] text-[#6B7770]`}
            >
              {name.length}/{NAME_MAX}
            </span>
          </div>
        </Row>

        <Row label={showListingDetails ? "Product Description" : "*Product Description"} htmlFor="product-description" required={showListingDetails}>
          <div className={`relative ${fieldWidth}`}>
            <textarea
              id="product-description"
              value={description}
              maxLength={DESCRIPTION_MAX}
              required={showListingDetails}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Product Description"
              className={`${inputClass} ${showListingDetails ? "min-h-[160px]" : "h-[220px]"} resize-none py-2.5 pb-8`}
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

  if (!showListingDetails) return basicInformation;

  return (
    <form onSubmit={submit} onChange={() => setNotice("")} onInvalidCapture={() => setNotice("")} className={productFormGridClass}>
      <aside className={`${productCardClass} ${productFormProgressClass}`}>
        <nav aria-label="Form progress" className="font-body text-[14px]">
          <p className="border-b border-[#E3E3E3] pb-2 text-[#64748B]">Progress</p>
          <ul className="mt-2 flex flex-wrap gap-1 lg:flex-col">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={activeSection === id ? "location" : undefined}
                  className={`flex items-center justify-between gap-2 rounded-r border-l-4 px-3 py-2 ${activeSection === id ? "border-[#008A58] bg-[#E9FBF2] text-[#004D31]" : "border-transparent text-[#404040] hover:bg-[#F4F7F8]"}`}
                >
                  {label}
                  {activeSection === id && <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[#004D31]" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className={productFormSectionsClass}>
        {basicInformation}
        <ProductListingDetails />
      </div>
      <div ref={actionBar} className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D9E1EB] bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-end gap-x-2 gap-y-2 px-6 py-3 font-body sm:gap-x-3 lg:px-10">
          <p role="status" className={notice ? "w-full text-sm text-[#004D31] lg:mr-auto lg:w-auto" : "sr-only"}>{notice}</p>
          <Link href="/inventory" className="rounded-[6px] px-3 py-2 text-[13px] text-[#44536A] hover:bg-[#F4F7F8]">Cancel</Link>
          <button
            type="button"
            onClick={() => setNotice("Draft preview ready. Your changes are only kept while this page is open.")}
            className="rounded-[6px] border border-[#C9D6CE] px-3 py-2 text-[13px] font-bold text-[#1E3A2C] hover:bg-[#F4F7F8]"
          >
            Save as Unpublished
          </button>
          <button type="submit" disabled={checkingVideo} className="rounded-[6px] bg-[#008A58] px-3 py-2 text-[13px] font-bold text-white hover:bg-[#006B44] disabled:opacity-60">Save and Publish</button>
        </div>
      </div>
    </form>
  );
}

// label on the left, field on the right (stacks on small screens)
function Row({
  label,
  htmlFor,
  center,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  center?: boolean; // vertically center the label with a single-line field
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={required !== undefined ? basicInformationRowClass : "grid grid-cols-1 gap-2 sm:grid-cols-[150px_1fr] sm:gap-x-5"}>
      <label
        htmlFor={htmlFor}
        className={`${lato.className} text-[14px] text-[#6B7770] sm:text-right ${
          center ? "sm:flex sm:items-center sm:justify-end" : "sm:pt-1"
        }`}
      >
        {label}
        {required && <span aria-hidden="true" className="text-[#C52A35]">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}
