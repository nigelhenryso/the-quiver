"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/src/lib/supabase/client";
import { PRODUCT_TABLE } from "@/src/lib/supabase/tables";
import ConfirmModal, { type ModalMode } from "./ConfirmModal";
import FilterBar, { defaultFilters, type Filters } from "./FilterBar";
import PageNav from "./PageNav";
import ProductTable, { type StockSort } from "./ProductTable";
import {
  getProductCategories,
  getStockStatus,
  PAGE_SIZE,
  type Product,
  type StockStatus,
} from "../../../../app/(organization)/inventory/data";

type Tab = "all" | "live" | "unpublished";

// this holds all the interactive state of the page
export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [tab, setTab] = useState<Tab>("all");
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      for (const category of getProductCategories(product)) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return new Map([...counts].sort(([a], [b]) => a.localeCompare(b)));
  }, [products]);
  const initialFilters = { ...defaultFilters, categories: [...categoryCounts.keys()] };
  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);
  const [stockSort, setStockSort] = useState<StockSort>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ mode: ModalMode; ids: string[] } | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);

  // ---------- counts (always based on all products, like the design) ----------
  const liveCount = products.filter((p) => p.isActive).length;
  const tabCounts: Record<Tab, number> = {
    all: products.length,
    live: liveCount,
    unpublished: products.length - liveCount,
  };
  const stockCounts: Record<StockStatus, number> = { in: 0, out: 0 };
  products.forEach((p) => stockCounts[getStockStatus(p.stock)]++);

  // ---------- filter + sort + paginate ----------
  const filtered = useMemo(() => {
    const q = applied.search.trim().toLowerCase();
    const rows = products.filter((p) => {
      if (tab === "live" && !p.isActive) return false;
      if (tab === "unpublished" && p.isActive) return false;
      if (!getProductCategories(p).some((category) => applied.categories.includes(category))) return false;
      if (!applied.stock.includes(getStockStatus(p.stock))) return false;
      if (q) {
        const haystack = [p.name, p.productId, ...p.variants.flatMap((v) => v.options.map(({ label }) => label))]
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
      rows.sort((a, b) => (applied.performance === "sales-asc" ? a.sales - b.sales : b.sales - a.sales));
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
  const selectedLive = selectedProducts.filter((p) => p.isActive);
  const selectedUnpublished = selectedProducts.filter((p) => !p.isActive);

  // ---------- actions ----------
  const openModal = (mode: ModalMode, items: Product[]) => {
    if (savingRef.current || items.length === 0) return;
    setSaveError("");
    setModal({ mode, ids: items.map((p) => p.productId) });
  };

  const closeModal = useCallback(() => {
    if (!savingRef.current) setModal(null);
  }, []);

  const confirmModal = async () => {
    if (!modal || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    setToast("");

    try {
      if (modal.mode === "delete") {
        const [productId] = modal.ids;
        const { data, error } = await supabase
          .from(PRODUCT_TABLE)
          .delete()
          .eq("product_id", productId)
          .select("product_id")
          .maybeSingle();
        if (error?.code === "23503") {
          setSaveError("This product has orders or preorders. You can unpublish it instead.");
          return;
        }
        if (error) throw error;
        if (!data) {
          setSaveError("The product could not be found or you no longer have access. Refresh your inventory and try again.");
          return;
        }
        setProducts((previous) => previous.filter((product) => product.productId !== productId));
        const removedId = products.find((product) => product.productId === productId)?.id;
        setSelected((previous) => new Set([...previous].filter((id) => id !== removedId)));
        setToast("Product deleted.");
        setModal(null);
        return;
      }

      const publish = modal.mode === "publish";
      const { data, error } = await supabase
        .from(PRODUCT_TABLE)
        .update({ is_active: publish })
        .in("product_id", modal.ids)
        .select("product_id, is_active")
        .overrideTypes<{ product_id: string; is_active: boolean }[], { merge: false }>();
      if (error) throw error;

      const updated = new Map(data.map((row) => [row.product_id, row.is_active]));
      if (updated.size > 0) {
        setProducts((previous) => previous.map((product) => {
          const isActive = updated.get(product.productId);
          return isActive === undefined ? product : { ...product, isActive };
        }));
      }

      if (updated.size !== modal.ids.length) {
        const remainingIds = modal.ids.filter((id) => !updated.has(id));
        setModal({ ...modal, ids: remainingIds });
        setSaveError(updated.size === 0
          ? "No listings were updated. Check that you still have access and try again."
          : `Updated ${updated.size} of ${modal.ids.length} listings. Try again for the remaining listings.`);
        return;
      }

      setSelected(new Set());
      setToast(`${updated.size} listing${updated.size === 1 ? "" : "s"} ${publish ? "published" : "unpublished"}.`);
      setModal(null);
    } catch (error) {
      console.error("Inventory action failed", error);
      setSaveError(modal.mode === "delete" ? "Couldn’t delete the product. Please try again." : "Couldn’t update listing status. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
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
    setDraft(initialFilters);
    setApplied(initialFilters);
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

  const modalItems = modal ? products.filter((p) => modal.ids.includes(p.productId)) : [];

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
              className={`font-body rounded-full px-5 py-2 text-[15px] font-bold transition-all duration-200 ease-in-out hover:scale-105 active:scale-100 ${
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
          className={`font-body fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-[10px] bg-[#004D31] px-5 py-3 text-[13px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]`}
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
          <p className={`font-body px-6 py-16 text-center text-[14px] text-[#7C8A82]`}>
            {products.length === 0 ? "Your organization has no products yet." : "No products match your filters."}
          </p>
        ) : (
          <ProductTable
            products={pageRows}
            selected={selected}
            onToggle={toggleOne}
            onToggleAll={toggleAllOnPage}
            stockSort={stockSort}
            onSortStock={cycleStockSort}
            onTogglePublish={(p) => openModal(p.isActive ? "unpublish" : "publish", [p])}
            onDelete={(p) => openModal("delete", [p])}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C9D6CE] px-6 py-4">
          <p className={`font-body text-[14px] text-[#3F4B54]`}>
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
          saving={saving}
          error={saveError}
        />
      )}

      {/* small message after publish / unpublish */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-50">
        {toast && (
          <p
            className={`font-body rounded-[8px] bg-[#004D31] px-4 py-2.5 text-[13px] font-bold text-white shadow-lg`}
          >
            {toast}
          </p>
        )}
      </div>
    </>
  );
}
