"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Package, ChevronDown, ChevronUp } from "lucide-react";
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
  price: string;
  cost_price: string;
  is_active: boolean;
}

const emptyVariantForm: VariantForm = {
  name: "",
  sku: "",
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
    <div className="bg-secondary/20 border-t border-border/30 px-8 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Variantlar</p>
        <Button size="sm" variant="outline" onClick={() => onAddVariant(product)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Variant əlavə et
        </Button>
      </div>

      {product.variants.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Hələ variant yoxdur.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-background/50">
                {["SKU", "Ad", "Qiymət", "Status", "Əməliyyatlar"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
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
                  className="border-b border-border/20 last:border-0 hover:bg-secondary/20"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {v.sku}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{v.name}</td>
                  <td className="px-4 py-2.5 text-foreground">
                    {v.price.toLocaleString("az-AZ", {
                      style: "currency",
                      currency: "AZN",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="success">Aktiv</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {deletingVariantId === v.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Əminsiniz?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeleteVariant(product.id, v.id)}
                          disabled={deleteVariantPending}
                        >
                          Bəli
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingVariantId(null)}
                        >
                          Xeyr
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
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
                          className="text-destructive hover:text-destructive"
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
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useProducts(page, 20);
  const { data: categories } = useCategories();

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
    setEditProduct(null);
    setProductForm(emptyProductForm);
    setProductFormError(null);
    setProductModalOpen(true);
  }

  function openEditProduct(p: Product) {
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
    setProductModalOpen(false);
    setEditProduct(null);
    setProductForm(emptyProductForm);
    setProductFormError(null);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        await updateProduct.mutateAsync({ id: editProduct.id, payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      closeProductModal();
    } catch (err) {
      setProductFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDeleteProduct(id: string) {
    try {
      await deleteProduct.mutateAsync(id);
      setDeletingProductId(null);
    } catch {
      // silently fail
    }
  }

  // Variant modal handlers
  function openAddVariant(product: Product) {
    setVariantContext({ product, variant: null });
    setVariantForm(emptyVariantForm);
    setVariantFormError(null);
    setVariantModalOpen(true);
  }

  function openEditVariant(product: Product, variant: ProductVariant) {
    setVariantContext({ product, variant });
    setVariantForm({
      name: variant.name,
      sku: variant.sku,
      price: String(variant.price),
      cost_price: "",
      is_active: true,
    });
    setVariantFormError(null);
    setVariantModalOpen(true);
  }

  function closeVariantModal() {
    setVariantModalOpen(false);
    setVariantContext(null);
    setVariantForm(emptyVariantForm);
    setVariantFormError(null);
  }

  async function handleVariantSubmit(e: React.FormEvent) {
    e.preventDefault();
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
            price: priceNum,
            cost_price: costNum,
            is_active: variantForm.is_active,
          },
        });
      }
      closeVariantModal();
    } catch (err) {
      setVariantFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDeleteVariant(productId: string, variantId: string) {
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

  const isProductPending = createProduct.isPending || updateProduct.isPending;
  const isVariantPending = createVariant.isPending || updateVariant.isPending;
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Məhsullar
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Yüklənir..." : `${data?.total ?? 0} məhsul mövcuddur`}
          </p>
        </div>
        <Button onClick={openCreateProduct} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Məhsul
        </Button>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    "SKU",
                    "Ad",
                    "Kateqoriya",
                    "Variantlar",
                    "Qiymət aralığı",
                    "Status",
                    "Əməliyyatlar",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
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
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-destructive"
                    >
                      Məhsullar yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Hələ heç bir məhsul əlavə edilməyib.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((p) => {
                  const isExpanded = expandedRows.has(p.id);
                  const catName =
                    categories?.data?.find((c) => c.id === p.category_id)?.name ?? "—";

                  return (
                    <>
                      <tr
                        key={p.id}
                        className={cn(
                          "border-b border-border/30 hover:bg-secondary/30 transition-colors",
                          isExpanded && "bg-secondary/20"
                        )}
                      >
                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                          {p.sku}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          {p.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {catName}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <button
                            onClick={() => toggleRow(p.id)}
                            className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                          >
                            {p.variants.length} variant
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {getPriceRange(p.variants)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={p.is_active ? "success" : "secondary"}>
                            {p.is_active ? "Aktiv" : "Deaktiv"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {deletingProductId === p.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Əminsiniz?
                              </span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteProduct(p.id)}
                                disabled={deleteProduct.isPending}
                              >
                                Bəli
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeletingProductId(null)}
                              >
                                Xeyr
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditProduct(p)}
                                aria-label="Düzəlt"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeletingProductId(p.id)}
                                aria-label="Sil"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${p.id}-expanded`}
                          className="border-b border-border/30"
                        >
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
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Səhifə {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Əvvəlki
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Növbəti
                </Button>
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
        description={
          editProduct
            ? "Məhsul məlumatlarını yeniləyin."
            : "Yeni məhsul yaratmaq üçün məlumatları doldurun."
        }
        size="lg"
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ad <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Məhsulun adı"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                SKU <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="PROD-001"
                value={productForm.sku}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, sku: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Təsvir
            </label>
            <Textarea
              placeholder="Məhsul haqqında ətraflı məlumat..."
              value={productForm.description}
              onChange={(e) =>
                setProductForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Kateqoriya
              </label>
              <Select
                value={productForm.category_id}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, category_id: e.target.value }))
                }
              >
                <option value="">Kateqoriya seçin</option>
                {(categories?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ölçü vahidi
              </label>
              <Input
                placeholder="ədəd"
                value={productForm.unit_of_measure}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, unit_of_measure: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="prod-is-active"
              checked={productForm.is_active}
              onChange={(e) =>
                setProductForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <label
              htmlFor="prod-is-active"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Aktiv
            </label>
          </div>

          {productFormError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {productFormError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeProductModal}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={isProductPending}>
              {isProductPending ? "Saxlanılır..." : editProduct ? "Yenilə" : "Yarat"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Variant Create/Edit Modal */}
      <Modal
        open={variantModalOpen}
        onClose={closeVariantModal}
        title={
          variantContext?.variant
            ? "Variantı Düzəlt"
            : `Variant əlavə et — ${variantContext?.product.name ?? ""}`
        }
        size="md"
      >
        <form onSubmit={handleVariantSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ad <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Variant adı"
                value={variantForm.name}
                onChange={(e) =>
                  setVariantForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                SKU <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VAR-001"
                value={variantForm.sku}
                onChange={(e) =>
                  setVariantForm((f) => ({ ...f, sku: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Qiymət (AZN) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={variantForm.price}
                onChange={(e) =>
                  setVariantForm((f) => ({ ...f, price: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Maya dəyəri (AZN)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={variantForm.cost_price}
                onChange={(e) =>
                  setVariantForm((f) => ({ ...f, cost_price: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="var-is-active"
              checked={variantForm.is_active}
              onChange={(e) =>
                setVariantForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <label
              htmlFor="var-is-active"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Aktiv
            </label>
          </div>

          {variantFormError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {variantFormError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeVariantModal}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={isVariantPending}>
              {isVariantPending
                ? "Saxlanılır..."
                : variantContext?.variant
                ? "Yenilə"
                : "Əlavə et"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
