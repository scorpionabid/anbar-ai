"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, Download, Box, ShoppingCart } from "lucide-react";
import { downloadExport } from "@/lib/exportUtils";
import { useProducts } from "@/hooks/useProducts";
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
import { Input } from "@/components/ui/Input";

// Extracted Components
import { ProductRow } from "./components/ProductRow";
import { ProductStats } from "./components/ProductStats";
import { ProductModal } from "./components/ProductModal";
import { VariantModal } from "./components/VariantModal";
import { 
  type ProductForm, 
  type VariantForm, 
  emptyProductForm, 
  emptyVariantForm 
} from "./components/types";

import { SkeletonRow } from "@/components/ui/SkeletonRow";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useProducts(page, 20);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  // Product Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productTarget, setProductTarget] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [productError, setProductError] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Variant Modals
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantProductTarget, setVariantProductTarget] = useState<Product | null>(null);
  const [variantTarget, setVariantTarget] = useState<ProductVariant | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(emptyVariantForm);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);

  // ── Product Handlers ───────────────────────────────────────────────────────

  function openCreateProduct() {
    setProductTarget(null);
    setProductForm(emptyProductForm);
    setProductError(null);
    setProductModalOpen(true);
  }

  function openEditProduct(p: Product) {
    setProductTarget(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      description: p.description || "",
      category_id: p.category_id || "",
      unit_of_measure: "",
      is_active: p.is_active,
    });
    setProductError(null);
    setProductModalOpen(true);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProductError(null);
    try {
      if (productTarget) {
        await updateProduct.mutateAsync({ id: productTarget.id, payload: productForm });
      } else {
        await createProduct.mutateAsync(productForm);
      }
      setProductModalOpen(false);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  // ── Variant Handlers ───────────────────────────────────────────────────────

  function openAddVariant(p: Product) {
    setVariantProductTarget(p);
    setVariantTarget(null);
    setVariantForm(emptyVariantForm);
    setVariantError(null);
    setVariantModalOpen(true);
  }

  function openEditVariant(p: Product, v: ProductVariant) {
    setVariantProductTarget(p);
    setVariantTarget(v);
    setVariantForm({
      name: v.name,
      sku: v.sku,
      barcode: v.barcode || "",
      price: String(v.price),
      cost_price: "",
      is_active: true,
    });
    setVariantError(null);
    setVariantModalOpen(true);
  }

  async function handleVariantSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!variantProductTarget) return;
    setVariantError(null);
    try {
      const payload = {
        ...variantForm,
        price: parseFloat(variantForm.price) || 0,
        cost_price: parseFloat(variantForm.cost_price) || 0,
      };

      if (variantTarget) {
        await updateVariant.mutateAsync({
          productId: variantProductTarget.id,
          variantId: variantTarget.id,
          payload,
        });
      } else {
        await createVariant.mutateAsync({
          productId: variantProductTarget.id,
          payload,
        });
      }
      setVariantModalOpen(false);
    } catch (err) {
      setVariantError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
             Məhsul Kataloqu
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Yüklənir..." : `${data?.total ?? 0} məhsul qeydiyyatdadır`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => downloadExport("/api/v1/export/products", "products.csv").catch(console.error)}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={openCreateProduct} className="gap-2 shadow-lg shadow-primary/10">
            <Plus className="h-4 w-4" />
            Yeni Məhsul
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      {!isLoading && !isError && data && (
        <ProductStats products={data.data} totalCount={data.total} />
      )}

      {/* Main Table Card */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/10">
                <tr className="border-b border-border/50 text-left">
                  {[
                    "Məhsul",
                    "Kateqoriya",
                    "Vahid",
                    "Status",
                    "Variantlar",
                    "Əməllər",
                  ].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}
                {isError && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-sm text-destructive">
                       Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-sm text-muted-foreground">
                       <Box className="h-12 w-12 mx-auto mb-4 opacity-10" />
                       Hələ heç bir məhsul əlavə edilməyib.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={openEditProduct}
                    onDelete={(id) => deleteProduct.mutate(id)}
                    deletingProductId={deletingProductId}
                    setDeletingProductId={setDeletingProductId}
                    deleteProductPending={deleteProduct.isPending}
                    // Variant handlers
                    onAddVariant={openAddVariant}
                    onEditVariant={openEditVariant}
                    onDeleteVariant={(pId, vId) => deleteVariant.mutate({ productId: pId, variantId: vId })}
                    deletingVariantId={deletingVariantId}
                    setDeletingVariantId={setDeletingVariantId}
                    deleteVariantPending={deleteVariant.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-5 border-t border-border/50 bg-secondary/5">
              <p className="text-sm font-medium text-muted-foreground">
                Səhifə <span className="text-foreground">{page}</span> / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>Əvvəlki</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Növbəti</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ProductModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        target={productTarget}
        form={productForm}
        setForm={setProductForm}
        onSubmit={handleProductSubmit}
        isPending={createProduct.isPending || updateProduct.isPending}
        error={productError}
      />

      <VariantModal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        productTarget={variantProductTarget}
        variantTarget={variantTarget}
        form={variantForm}
        setForm={setVariantForm}
        onSubmit={handleVariantSubmit}
        isPending={createVariant.isPending || updateVariant.isPending}
        error={variantError}
      />
    </div>
  );
}
