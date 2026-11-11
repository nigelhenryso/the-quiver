"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { lato } from "../../../../../../../../../Downloads/the-quiver-dashboard-updates-new/the-quiver-dashboard-updates-new/the-quiver-feat-dashboard/src/lib/fonts";
import ConfirmModal, { type ModalMode } from "./ConfirmModal";
import FilterBar, { defaultFilters, type Filters } from "./FilterBar";
import PageNav from "./PageNav";
import ProductTable, { type StockSort } from "./ProductTable";
import {
  categories,
  getStockStatus,
  PAGE_SIZE,
  type Category,
  type Product,
  type StockStatus,
} from "./data";

type Tab = "all" | "live" | "unpublished";

// this holds all the interactive state of the page
export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  // NOTE: with a real backend, publish/unpublish should call the API and then refresh this
  const [products, setProducts] = useState(initialProducts);
  const [tab, setTab] = useState<Tab>("all");
  const [draft, setDraft] = useState<Filters>(defaultFilters); // what the inputs show
  const [applied, setApplied] = useState<Filters>(defaultFilters); // what is actually filtering
  const [stockSort, setStockSort] = useState<StockSort>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ mode: ModalMode; ids: string[] } | null>(null);
  const [toast, setToast] = useState("");

  // ---------- counts (always based on all products, like the design) ----------
  const liveCount = products.filter((p) => p.published).length;
  const tabCounts: Record<Tab, number> = {
    all: products.length,
    live: liveCount,
    unpublished: products.length - liveCount,
  };
  const categoryCounts = Object.fromEntries(
    categories.map((c) => [c, products.filter((p) => p.category === c).length]),
  ) as Record<Category, number>;
  const stockCounts: Record<StockStatus, number> = { in: 0, low: 0, out: 0 };
  products.forEach((p) => stockCounts[getStockStatus(p.stock, p.salesL30D)]++);

  // ---------- filter + sort + paginate ----------
  const filtered = useMemo(() => {
    const q = applied.search.trim().toLowerCase();
    const rows = products.filter((p) => {
      if (tab === "live" && !p.published) return false;
      if (tab === "unpublished" && p.published) return false;
      if (!applied.categories.includes(p.category)) return false;
      if (!applied.stock.includes(getStockStatus(p.stock, p.salesL30D))) return false;
      if (q) {
        const haystack = [p.name, p.productId, ...p.variants.map((v) => v.name)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // clicking the Stock header wins over the Sales Performance dropdown
    if (stockSort) {
      rows.sort((a, b) => (stockSort === "asc" ? a.stock - b.stock : b.stock - a.stock));
    } else if (applied.performance !== "default") {
      // ex: "l30d-desc" = highest to lowest L30D sales
      const [key, dir] = applied.performance.split("-") as ["sales" | "l30d", "asc" | "desc"];
      const value = (p: Product) => (key === "sales" ? p.sales : p.salesL30D);
      rows.sort((a, b) => (dir === "asc" ? value(a) - value(b) : value(b) - value(a)));
    }
    return rows;
  }, [products, tab, applied, stockSort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  // ---------- selection ----------
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const toggleAllOnPage = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((p) => (checked ? next.add(p.id) : next.delete(p.id)));
      return next;
    });

  const selectedProducts = products.filter((p) => selected.has(p.id));
  const selectedLive = selectedProducts.filter((p) => p.published);
  const selectedUnpublished = selectedProducts.filter((p) => !p.published);

  // ---------- actions ----------
  const openModal = (mode: ModalMode, items: Product[]) =>
    items.length > 0 && setModal({ mode, ids: items.map((p) => p.id) });

  const closeModal = useCallback(() => setModal(null), []);

  const confirmModal = () => {
    if (!modal) return;
    const ids = new Set(modal.ids);
    const publish = modal.mode === "publish";
    setProducts((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, published: publish } : p)));
    setSelected(new Set());
    setToast(`${ids.size} listing${ids.size === 1 ? "" : "s"} ${publish ? "published" : "unpublished"}.`);
    setModal(null);
  };

  // hide the toast after a few seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const applyFilters = () => {
    setApplied(draft);
    setPage(1);
  };
  const resetFilters = () => {
    setDraft(defaultFilters);
    setApplied(defaultFilters);
    setStockSort(null);
    setPage(1);
  };
  const cycleStockSort = () => {
    setStockSort((s) => (s === null ? "asc" : s === "asc" ? "desc" : null));
    setPage(1);
  };
  const changeTab = (t: Tab) => {
    setTab(t);
    setPage(1);
  };

  const modalItems = modal ? products.filter((p) => modal.ids.includes(p.id)) : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "unpublished", label: "Unpublished" },
  ];

  return (
    <>
      {/* tabs */}
      <div className="mt-6 border-t border-[#DDE5E0] pt-5">
        <div role="tablist" aria-label="Listing status" className="flex flex-wrap gap-3">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => changeTab(key)}
              className={`${lato.className} rounded-full px-5 py-2 text-[15px] font-bold transition-all duration-200 ease-in-out hover:scale-105 active:scale-100 ${
                tab === key
                  ? "bg-[#004D31] text-white"
                  : "text-[#1E3A2C] hover:bg-[#E3F5EA] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
              }`}
            >
              {label} ({tabCounts[key]})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <FilterBar
          value={draft}
          onChange={setDraft}
          onApply={applyFilters}
          onReset={resetFilters}
          categoryCounts={categoryCounts}
          stockCounts={stockCounts}
          total={products.length}
        />
      </div>

      {/* bulk actions: floating bar at the bottom, only shows when something is checked */}
      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className={`${lato.className} fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-[10px] bg-[#004D31] px-5 py-3 text-[13px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]`}
        >
          <span>
            {selected.size} {selected.size === 1 ? "Product" : "Products"} Selected
          </span>
          <button type="button" onClick={() => setSelected(new Set())} className="underline transition-opacity hover:opacity-80">
            Deselect All
          </button>
          {selectedUnpublished.length > 0 && (
            <button
              type="button"
              onClick={() => openModal("publish", selectedUnpublished)}
              className="rounded-full border border-white/30 bg-white/15 px-4 py-1 text-[12px] font-bold transition-all duration-200 hover:scale-105 hover:bg-white/25"
            >
              Publish{selectedLive.length > 0 ? ` (${selectedUnpublished.length})` : ""}
            </button>
          )}
          {selectedLive.length > 0 && (
            <button
              type="button"
              onClick={() => openModal("unpublish", selectedLive)}
              className="rounded-full border border-white/30 bg-white/15 px-4 py-1 text-[12px] font-bold transition-all duration-200 hover:scale-105 hover:bg-white/25"
            >
              Unpublish{selectedUnpublished.length > 0 ? ` (${selectedLive.length})` : ""}
            </button>
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelected(new Set())}
            className="flex rounded p-0.5 hover:bg-white/15"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* table card */}
      <section className="mt-5 overflow-hidden rounded-[10px] border border-[#C9D6CE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
        {pageRows.length === 0 ? (
          <p className={`${lato.className} px-6 py-16 text-center text-[14px] text-[#7C8A82]`}>
            No products match your filters.
          </p>
        ) : (
          <ProductTable
            products={pageRows}
            selected={selected}
            onToggle={toggleOne}
            onToggleAll={toggleAllOnPage}
            stockSort={stockSort}
            onSortStock={cycleStockSort}
            onTogglePublish={(p) => openModal(p.published ? "unpublish" : "publish", [p])}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C9D6CE] px-6 py-4">
          <p className={`${lato.className} text-[14px] text-[#3F4B54]`}>
            {filtered.length === 0 ? (
              "Showing 0 products"
            ) : (
              <>
                Showing <b>{start + 1}</b> to <b>{start + pageRows.length}</b> of{" "}
                <b>{filtered.length}</b> products
              </>
            )}
          </p>
          <PageNav page={currentPage} pageCount={pageCount} onChange={setPage} />
        </div>
      </section>

      {modal && (
        <ConfirmModal
          mode={modal.mode}
          items={modalItems}
          onConfirm={confirmModal}
          onCancel={closeModal}
        />
      )}

      {/* small message after publish / unpublish */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-50">
        {toast && (
          <p
            className={`${lato.className} rounded-[8px] bg-[#004D31] px-4 py-2.5 text-[13px] font-bold text-white shadow-lg`}
          >
            {toast}
          </p>
        )}
      </div>
    </>
  );
}