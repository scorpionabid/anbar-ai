"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Package, ChevronDown, ChevronUp, Search, Filter, Download, CheckCircle2, XCircle, Box, Bot } from "lucide-react";
import { downloadExport } from "@/lib/exportUtils";
import { useGenerateDescription } from "@/hooks/useAI";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from "@/hooks/useProductMutations";
import type { Product, ProductVariant } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Form types ────────────────────────────────────────────────────────────────

interface ProductForm {
  name: string;
  sku: string;
  description: string;
  category_id: string;
  unit_of_measure: string;
  is_active: boolean;
}

const emptyProductForm: ProductForm = {
  name: "",
  sku: "",
  description: "",
  category_id: "",
  unit_of_measure: "",
  is_active: true,
};

interface VariantForm {
  name: string;
  sku: string;
  barcode: string;
  price: string;
  cost_price: string;
  is_active: boolean;
}

const emptyVariantForm: VariantForm = {
  name: "",
  sku: "",
  barcode: "",
  price: "",
  cost_price: "",
  is_active: true,
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ── Variant sub-table ─────────────────────────────────────────────────────────

interface VariantTableProps {
  product: Product;
  onAddVariant: (product: Product) => void;
  onEditVariant: (product: Product, variant: ProductVariant) => void;
  onDeleteVariant: (productId: string, variantId: string) => void;
  deletingVariantId: string | null;
  setDeletingVariantId: (id: string | null) => void;
  deleteVariantPending: boolean;
}

function VariantTable({
  product,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
  deletingVariantId,
  setDeletingVariantId,
  deleteVariantPending,
}: VariantTableProps) {
  return (
    <div className="bg-secondary/10 border-t border-border/30 px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Məhsul Variantları</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => onAddVariant(product)} className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Variant əlavə et
        </Button>
      </div>

      {product.variants.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 italic">Hələ heç bir variant əlavə edilməyib.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/30">
                {["SKU", "Barkod", "Ad", "Qiymət", "Status", "Əməliyyatlar"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-border/20 last:border-0 hover:bg-secondary/40 transition-colors group/vrow"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {v.sku}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {v.barcode || "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{v.name}</td>
                  <td className="px-4 py-3 text-foreground font-medium">
                    {v.price.toLocaleString("az-AZ", {
                      style: "currency",
                      currency: "AZN",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">Aktiv</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {deletingVariantId === v.id ? (
                      <div className="flex items-center gap-2 scale-90 origin-left">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Silmək?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2"
                          onClick={() => onDeleteVariant(product.id, v.id)}
                          disabled={deleteVariantPending}
                        >
                          Bəli
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => setDeletingVariantId(null)}
                        >
                          Xeyr
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover/vrow:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onEditVariant(product, v)}
                          aria-label="Düzəlt"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingVariantId(v.id)}
                          aria-label="Sil"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const generateDescription = useGenerateDescription();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data, isLoading, isError } = useProducts(
    page,
    20,
    search || undefined,
    categoryFilter === "all" ? undefined : categoryFilter,
    statusFilter === "all" ? undefined : statusFilter === "active"
  );
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data ?? [];

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Variant modal state
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantContext, setVariantContext] = useState<{
    product: Product;
    variant: ProductVariant | null;
  } | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(emptyVariantForm);
  const [variantFormError, setVariantFormError] = useState<string | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Product modal handlers
  function openCreateProduct() {
    console.log("[ProductsPage] Opening Create Product modal");
    setEditProduct(null);
    setProductForm(emptyProductForm);
    setProductFormError(null);
    setProductModalOpen(true);
  }

  function openEditProduct(p: Product) {
    console.log("[ProductsPage] Opening Edit Product modal for product:", p);
    setEditProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      description: p.description ?? "",
      category_id: p.category_id ?? "",
      unit_of_measure: "",
      is_active: p.is_active,
    });
    setProductFormError(null);
    setProductModalOpen(true);
  }

  function closeProductModal() {
    console.log("[ProductsPage] Closing Product modal");
    setProductModalOpen(false);
    setEditProduct(null);
    setProductForm(emptyProductForm);
    setProductFormError(null);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[ProductsPage] Handling Product form submission. Data:", productForm);
    setProductFormError(null);

    if (!productForm.name.trim()) {
      setProductFormError("Məhsul adı mütləqdir.");
      return;
    }
    if (!productForm.sku.trim()) {
      setProductFormError("SKU mütləqdir.");
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      sku: productForm.sku.trim(),
      description: productForm.description.trim() || undefined,
      category_id: productForm.category_id || undefined,
      unit_of_measure: productForm.unit_of_measure.trim() || undefined,
      is_active: productForm.is_active,
    };

    try {
      if (editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, payload: productForm });
      } else {
        await createProduct.mutateAsync(productForm);
      }
      closeProductModal();
    } catch (err) {
      console.error("[ProductsPage] Error in handleProductSubmit:", err);
      setProductFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDeleteProduct(id: string) {
    console.log(`[ProductsPage] Triggering delete for product ${id}`);
    try {
      await deleteProduct.mutateAsync(id);
      setDeletingProductId(null);
    } catch (err) {
      console.error("[ProductsPage] Error deleting product:", err);
    }
  }

  // Variant modal handlers
  function openAddVariant(product: Product) {
    console.log("[ProductsPage] Opening Add Variant modal for product:", product.name);
    setVariantContext({ product, variant: null });
    setVariantForm(emptyVariantForm);
    setVariantFormError(null);
    setVariantModalOpen(true);
  }

  function openEditVariant(product: Product, variant: ProductVariant) {
    console.log("[ProductsPage] Opening Edit Variant modal for variant:", variant);
    setVariantContext({ product, variant });
    setVariantForm({
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode ?? "",
      price: String(variant.price),
      cost_price: "",
      is_active: true,
    });
    setVariantFormError(null);
    setVariantModalOpen(true);
  }

  function closeVariantModal() {
    console.log("[ProductsPage] Closing Variant modal");
    setVariantModalOpen(false);
    setVariantContext(null);
    setVariantForm(emptyVariantForm);
    setVariantFormError(null);
  }

  async function handleVariantSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[ProductsPage] Handling Variant form submission. Data:", variantForm);
    if (!variantContext) return;
    setVariantFormError(null);

    if (!variantForm.name.trim()) {
      setVariantFormError("Variant adı mütləqdir.");
      return;
    }
    if (!variantForm.sku.trim()) {
      setVariantFormError("SKU mütləqdir.");
      return;
    }
    if (!variantForm.price || isNaN(parseFloat(variantForm.price))) {
      setVariantFormError("Düzgün qiymət daxil edin.");
      return;
    }

    const priceNum = parseFloat(variantForm.price);
    const costNum = variantForm.cost_price
      ? parseFloat(variantForm.cost_price)
      : undefined;

    try {
      if (variantContext.variant) {
        await updateVariant.mutateAsync({
          productId: variantContext.product.id,
          variantId: variantContext.variant.id,
          payload: {
            name: variantForm.name.trim(),
            sku: variantForm.sku.trim(),
            barcode: variantForm.barcode.trim() || undefined,
            price: priceNum,
            cost_price: costNum,
            is_active: variantForm.is_active,
          },
        });
      } else {
        await createVariant.mutateAsync({
          productId: variantContext.product.id,
          payload: {
            name: variantForm.name.trim(),
            sku: variantForm.sku.trim(),
            barcode: variantForm.barcode.trim() || undefined,
            price: priceNum,
            cost_price: costNum,
            is_active: variantForm.is_active,
          },
        });
      }
      closeVariantModal();
    } catch (err) {
      console.error("[ProductsPage] Error in handleVariantSubmit:", err);
      setVariantFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDeleteVariant(productId: string, variantId: string) {
    console.log(`[ProductsPage] Triggering delete for variant ${variantId} of product ${productId}`);
    try {
      await deleteVariant.mutateAsync({ productId, variantId });
      setDeletingVariantId(null);
    } catch {
      // silently fail
    }
  }

  function getPriceRange(variants: ProductVariant[]): string {
    if (variants.length === 0) return "—";
    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const fmt = (n: number) =>
      n.toLocaleString("az-AZ", { style: "currency", currency: "AZN" });
    return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  }

  function exportToCSV() {
    downloadExport("/api/v1/export/products", "products.csv").catch(console.error);
  }

  const isProductPending = createProduct.isPending || updateProduct.isPending;
  const isVariantPending = createVariant.isPending || updateVariant.isPending;
  const totalPages = data ? Math.ceil(data.total / 20) : 1;
  const products = data?.data ?? [];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* ── Statistics ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ümumi Məhsul</p>
                <h3 className="text-2xl font-bold mt-1">{data?.total ?? 0}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Package size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card glass className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktiv</p>
                <h3 className="text-2xl font-bold mt-1">
                  {products.filter(p => p.is_active).length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card glass className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deaktiv</p>
                <h3 className="text-2xl font-bold mt-1">
                  {products.filter(p => !p.is_active).length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <XCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Məhsullar</h1>
          <p className="text-muted-foreground font-medium mt-1">Anbarınızdakı məhsulları idarə edin</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={exportToCSV} disabled={!products.length}>
            <Download className="h-4 w-4" />
            Eksport
          </Button>
          <Button onClick={openCreateProduct} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            Yeni Məhsul
          </Button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <Card glass className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-[2] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Ad, SKU və ya təsvir ilə axtarış..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
            <Select
              className="pl-10"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Bütün Kateqoriyalar</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex-1 relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
            <Select
              className="pl-10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Bütün Statuslar</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Deaktiv</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/20">
                  {["SKU", "Ad", "Kateqoriya", "Variantlar", "Qiymət Aralığı", "Status", "Əməliyyatlar"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}
                {isError && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-destructive">Məhsullar yüklənərkən xəta baş verdi.</td>
                  </tr>
                )}
                {!isLoading && !isError && products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Məhsul tapılmadı.
                    </td>
                  </tr>
                )}
                {products.map((p) => {
                  const isExpanded = expandedRows.has(p.id);
                  const catName = categories.find((c) => c.id === p.category_id)?.name ?? "—";
                  return (
                    <React.Fragment key={p.id}>
                      <tr className={cn("border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0 group/row", isExpanded && "bg-secondary/20")}>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p.sku}</td>
                        <td className="px-6 py-4 font-bold text-foreground">{p.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{catName}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => toggleRow(p.id)} className="flex items-center gap-1.5 text-primary hover:underline font-bold transition-all hover:gap-2">
                            {p.variants.length} variant
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">{getPriceRange(p.variants)}</td>
                        <td className="px-6 py-4">
                          <Badge variant={p.is_active ? "success" : "secondary"}>
                            {p.is_active ? "Aktiv" : "Deaktiv"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {deletingProductId === p.id ? (
                            <div className="flex items-center gap-2 scale-90 origin-left">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">Silmək?</span>
                              <Button size="sm" variant="destructive" className="h-8" onClick={() => handleDeleteProduct(p.id)} disabled={deleteProduct.isPending}>Bəli</Button>
                              <Button size="sm" variant="outline" className="h-8" onClick={() => setDeletingProductId(null)}>Xeyr</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" onClick={() => openEditProduct(p)} aria-label="Düzəlt"><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => setDeletingProductId(p.id)} aria-label="Sil" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-secondary/5 border-b border-border/20 shadow-inner">
                          <td colSpan={7} className="p-0">
                            <VariantTable
                              product={p}
                              onAddVariant={openAddVariant}
                              onEditVariant={openEditVariant}
                              onDeleteVariant={handleDeleteVariant}
                              deletingVariantId={deletingVariantId}
                              setDeletingVariantId={setDeletingVariantId}
                              deleteVariantPending={deleteVariant.isPending}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-secondary/10 backdrop-blur-sm rounded-b-xl">
              <p className="text-sm font-medium text-muted-foreground">Səhifə <span className="text-foreground font-bold">{page}</span> / <span className="text-foreground">{totalPages}</span></p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8">Əvvəlki</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8">Növbəti</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Create/Edit Modal */}
      <Modal
        open={productModalOpen}
        onClose={closeProductModal}
        title={editProduct ? "Məhsulu Düzəlt" : "Yeni Məhsul"}
        description={editProduct ? "Məhsul məlumatlarını yeniləyin." : "Yeni məhsul yaratmaq üçün məlumatları doldurun."}
        size="lg"
      >
        <form onSubmit={handleProductSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Ad <span className="text-destructive">*</span></label>
              <Input placeholder="Məhsulun adı" value={productForm.name} onChange={(e) => setProductForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">SKU <span className="text-destructive">*</span></label>
              <Input placeholder="PROD-001" value={productForm.sku} onChange={(e) => setProductForm(f => ({ ...f, sku: e.target.value }))} required />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground">Təsvir</label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs h-7"
                disabled={!productForm.name || generateDescription.isPending}
                onClick={async () => {
                  const desc = await generateDescription.mutateAsync({ product_name: productForm.name }).catch(() => null);
                  if (desc) setProductForm(f => ({ ...f, description: desc }));
                }}
              >
                <Bot className="h-3.5 w-3.5" />
                {generateDescription.isPending ? "Yaradılır..." : "AI ilə yaz"}
              </Button>
            </div>
            <Textarea placeholder="Məhsul haqqında ətraflı məlumat..." className="min-h-[100px]" value={productForm.description} onChange={(e) => setProductForm(f => ({ ...f, description: e.target.value }))} />
            {generateDescription.isError && (
              <p className="text-xs text-destructive">AI açarı konfiqurasiya edilməyib — Parametrlər → AI & İnteqrasiyalar</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Kateqoriya</label>
              <Select value={productForm.category_id} onChange={(e) => setProductForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Kateqoriya seçin</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Ölçü vahidi</label>
              <Input placeholder="ədəd" value={productForm.unit_of_measure} onChange={(e) => setProductForm(f => ({ ...f, unit_of_measure: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center gap-3 border border-border/50 p-4 rounded-xl bg-secondary/5">
            <input type="checkbox" id="prod-is-active" checked={productForm.is_active} onChange={(e) => setProductForm(f => ({ ...f, is_active: e.target.checked }))} className="h-5 w-5 rounded border-input accent-primary cursor-pointer" />
            <label htmlFor="prod-is-active" className="text-sm font-bold text-foreground cursor-pointer">Aktiv Məhsul</label>
          </div>

          {productFormError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2 border border-destructive/20 font-medium">{productFormError}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={closeProductModal} className="px-6">Ləğv et</Button>
            <Button type="submit" disabled={isProductPending} className="px-8 shadow-lg shadow-primary/20">{isProductPending ? "Saxlanılır..." : editProduct ? "Yenilə" : "Yarat"}</Button>
          </div>
        </form>
      </Modal>

      {/* Variant Create/Edit Modal */}
      <Modal
        open={variantModalOpen}
        onClose={closeVariantModal}
        title={variantContext?.variant ? "Variantı Düzəlt" : `Variant əlavə et — ${variantContext?.product.name ?? ""}`}
        size="md"
      >
        <form onSubmit={handleVariantSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Ad <span className="text-destructive">*</span></label>
              <Input placeholder="Variant adı" value={variantForm.name} onChange={(e) => setVariantForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">SKU <span className="text-destructive">*</span></label>
              <Input placeholder="VAR-001" value={variantForm.sku} onChange={(e) => setVariantForm(f => ({ ...f, sku: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Qiymət (AZN) <span className="text-destructive">*</span></label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={variantForm.price} onChange={(e) => setVariantForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Barkod</label>
              <Input placeholder="EAN / UPC / Internal" value={variantForm.barcode} onChange={(e) => setVariantForm(f => ({ ...f, barcode: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Maya dəyəri (AZN)</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={variantForm.cost_price} onChange={(e) => setVariantForm(f => ({ ...f, cost_price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              {/* Spacer or additional field can go here */}
            </div>
          </div>

          <div className="flex items-center gap-3 border border-border/50 p-4 rounded-xl bg-secondary/5">
            <input type="checkbox" id="var-is-active" checked={variantForm.is_active} onChange={(e) => setVariantForm(f => ({ ...f, is_active: e.target.checked }))} className="h-5 w-5 rounded border-input accent-primary cursor-pointer" />
            <label htmlFor="var-is-active" className="text-sm font-bold text-foreground cursor-pointer">Aktiv Variant</label>
          </div>

          {variantFormError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2 border border-destructive/20 font-medium">{variantFormError}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={closeVariantModal} className="px-6">Ləğv et</Button>
            <Button type="submit" disabled={isVariantPending} className="px-8 shadow-lg shadow-primary/20">{isVariantPending ? "Saxlanılır..." : variantContext?.variant ? "Yenilə" : "Əlavə et"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
