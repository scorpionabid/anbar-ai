"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Package, Box, Filter, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types/api";

// ── Variant Table ────────────────────────────────────────────────────────────

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
    <div className="bg-secondary/20 border-t border-border/30 px-8 py-5 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
           <Layers className="h-4 w-4" /> Variantlar
           <Badge variant="outline" className="font-mono">{product.variants.length}</Badge>
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddVariant(product)}
          className="h-8 gap-1.5 border-dashed"
        >
          <Plus className="h-3.5 w-3.5" />
          Variant Əlavə Et
        </Button>
      </div>

      {product.variants.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-6 text-center bg-background/50 rounded-2xl border border-dashed border-border/40">
          Bu məhsul üçün hələ heç bir variant yoxdur.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-background/50 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-secondary/20">
              <tr className="border-b border-border/40">
                {["Ad / SKU", "Barkod", "Qiymət", "Atributlar", "Əməllər"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {product.variants.map((v) => (
                <tr key={v.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-foreground flex items-center gap-2">
                       {v.name}
                       <span className="text-[10px] font-mono bg-secondary px-1 rounded text-muted-foreground uppercase">{v.sku}</span>
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {v.barcode || "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {v.price.toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground italic">
                    {v.attributes || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {deletingVariantId === v.id ? (
                      <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in duration-200">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeleteVariant(product.id, v.id)}
                          disabled={deleteVariantPending}
                          className="h-7 px-3 text-[11px]"
                        >
                          Bəli
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingVariantId(null)}
                          className="h-7 px-3 text-[11px]"
                        >
                          Xeyr
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEditVariant(product, v)}
                          aria-label="Düzəlt"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingVariantId(v.id)}
                          aria-label="Sil"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
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

// ── Product Row ──────────────────────────────────────────────────────────────

interface ProductRowProps {
  product: Product;
  onEdit: (u: Product) => void;
  onDelete: (id: string) => void;
  deletingProductId: string | null;
  setDeletingProductId: (id: string | null) => void;
  deleteProductPending: boolean;
  // Variant props
  onAddVariant: (product: Product) => void;
  onEditVariant: (product: Product, variant: ProductVariant) => void;
  onDeleteVariant: (productId: string, variantId: string) => void;
  deletingVariantId: string | null;
  setDeletingVariantId: (id: string | null) => void;
  deleteVariantPending: boolean;
}

import { Layers } from "lucide-react";

export function ProductRow({
  product,
  onEdit,
  onDelete,
  deletingProductId,
  setDeletingProductId,
  deleteProductPending,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
  deletingVariantId,
  setDeletingVariantId,
  deleteVariantPending,
}: ProductRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className={cn(
        "border-b border-border/30 hover:bg-secondary/30 transition-all",
        isExpanded && "bg-secondary/20 shadow-inner"
      )}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
               <Box className="h-5 w-5 text-primary" />
             </div>
             <div>
               <p className="text-sm font-bold text-foreground leading-tight">{product.name}</p>
               <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5">{product.sku}</p>
             </div>
          </div>
        </td>
        <td className="px-6 py-4">
            <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold border-border/50">
              {product.category_id ? "Kateqoriyalı" : "K-sız"}
            </Badge>
        </td>
        <td className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {product.description ? product.description.slice(0, 30) : "—"}
        </td>
        <td className="px-6 py-4">
          <Badge variant={product.is_active ? "success" : "secondary"}>
            {product.is_active ? "Aktiv" : "Deaktiv"}
          </Badge>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50 border border-border/40 hover:bg-secondary transition-all group"
          >
            <Layers className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground">{product.variants.length}</span>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </td>
        <td className="px-6 py-4 text-right">
          {deletingProductId === product.id ? (
            <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-1">
              <span className="text-[10px] font-bold text-destructive uppercase">Məhsul silinsin?</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(product.id)}
                disabled={deleteProductPending}
                className="h-7 px-3 text-[11px]"
              >
                Bəli
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeletingProductId(null)}
                className="h-7 px-3 text-[11px]"
              >
                Xeyr
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(product)}
                aria-label="Məhsulu Düzəlt"
                className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeletingProductId(product.id)}
                aria-label="Məhsulu Sil"
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="p-0 border-b border-border/30">
            <VariantTable
              product={product}
              onAddVariant={onAddVariant}
              onEditVariant={onEditVariant}
              onDeleteVariant={onDeleteVariant}
              deletingVariantId={deletingVariantId}
              setDeletingVariantId={setDeletingVariantId}
              deleteVariantPending={deleteVariantPending}
            />
          </td>
        </tr>
      )}
    </>
  );
}
