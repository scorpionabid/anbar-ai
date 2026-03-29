"use client";

import { useState } from "react";
import { Plus, Trash2, Search, Package } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useCreateOrder } from "@/hooks/useOrderMutations";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { emptyLineItem, type LineItem } from "./constants";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateOrderModal({ open, onClose }: CreateOrderModalProps) {
  const [warehouseId, setWarehouseId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [error, setError] = useState<string | null>(null);

  const { data: warehousesData } = useWarehouses();
  const { data: customersData } = useCustomers(1, 100);
  const { data: productsData } = useProducts(1, 1000); // 1000 is enough for selection
  
  const createOrder = useCreateOrder();

  const warehouses = warehousesData ?? [];
  const customers = customersData?.data ?? [];
  
  // All variants from all products
  const allVariants = (productsData?.data ?? []).flatMap(p => 
    p.variants.map(v => ({
      id: v.id,
      name: `${p.name} - ${v.name} (${v.sku})`,
      sku: v.sku
    }))
  );

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function lineTotal(item: LineItem): number {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const disc = parseFloat(item.discount_amount) || 0;
    return qty * price - disc;
  }

  function grandTotal(): number {
    return lineItems.reduce((sum, item) => sum + lineTotal(item), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!warehouseId) {
      setError("Anbar mütləqdir.");
      return;
    }
    if (lineItems.length === 0) {
      setError("Ən azı bir məhsul sətri əlavə edin.");
      return;
    }
    for (const item of lineItems) {
      if (!item.variant_id.trim()) {
        setError("Bütün sətirlərdə məhsul seçilməlidir.");
        return;
      }
    }

    const payload = {
      warehouse_id: warehouseId,
      customer_id: customerId || undefined,
      notes: notes.trim() || undefined,
      shipping_address: shippingAddress.trim() || undefined,
      items: lineItems.map((item) => ({
        variant_id: item.variant_id.trim(),
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        discount_amount: parseFloat(item.discount_amount) || 0,
      })),
    };

    try {
      await createOrder.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni Sifariş"
      description="Sifariş məlumatlarını və məhsul sətirləri əlavə edin."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
               Anbar <span className="text-destructive">*</span>
            </label>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">Anbar seçin</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
              Müştəri
            </label>
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Pərakəndə / Guest</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Çatdırılma ünvanı
            </label>
            <Textarea
              placeholder="Şəhər, küçə, ev nömrəsi..."
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Qeydlər
            </label>
            <Textarea
              placeholder="Əlavə qeydlər..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-4 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
               <Package className="h-4 w-4 text-primary" /> Məhsul Sətirləri
               <Badge variant="outline">{lineItems.length}</Badge>
            </h4>
            <Button type="button" size="sm" variant="outline" onClick={addLineItem} className="h-8 gap-1.5 border-dashed">
              <Plus className="h-3.5 w-3.5" />
              Sətir əlavə et
            </Button>
          </div>

          <div className="space-y-3">
            {/* Header for items */}
            <div className="grid grid-cols-12 gap-3 px-1">
              <p className="col-span-5 text-[10px] font-bold text-muted-foreground uppercase opacity-70">Məhsul / Variant</p>
              <p className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase opacity-70">Miqdar</p>
              <p className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase opacity-70">Qiymət</p>
              <p className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase opacity-70">Cəmi</p>
              <p className="col-span-1" />
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center group animate-in slide-in-from-right-1">
                <div className="col-span-5">
                  <Select
                    value={item.variant_id}
                    onChange={(e) => updateLineItem(index, "variant_id", e.target.value)}
                  >
                    <option value="">Seçin...</option>
                    {allVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(index, "unit_price", e.target.value)}
                  />
                </div>
                <div className="col-span-2 text-sm font-bold text-foreground text-right pr-2">
                  {lineTotal(item).toFixed(2)}
                </div>
                <div className="col-span-1 text-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center p-4 rounded-2xl bg-secondary/10 border border-border/40 mt-4">
             <div className="text-xs text-muted-foreground">
                Məhsul sətirlərindəki ümumi məbləğ hesablanır.
             </div>
             <div className="text-lg font-black text-foreground">
                {grandTotal().toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
             </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 animate-in shake-in-1">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose}>
            Ləğv et
          </Button>
          <Button type="submit" disabled={createOrder.isPending} className="px-8">
            {createOrder.isPending ? "Yaradılır..." : "Təsdiqlə və Yarad"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
