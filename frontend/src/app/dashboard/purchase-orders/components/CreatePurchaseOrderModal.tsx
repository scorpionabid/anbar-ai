"use client";

import { useState } from "react";
import { Plus, Trash2, Package, Archive, Truck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { useCreatePurchaseOrder } from "@/hooks/usePurchaseOrderMutations";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { emptyPOLineItem, type POLineItem } from "./constants";

interface CreatePOProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePurchaseOrderModal({ open, onClose }: CreatePOProps) {
  const [warehouseId, setWarehouseId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<POLineItem[]>([emptyPOLineItem()]);
  const [error, setError] = useState<string | null>(null);

  const { data: warehousesData } = useWarehouses();
  const { data: suppliersData } = useSuppliers(1, 100);
  const { data: productsData } = useProducts(1, 1000);

  const createPO = useCreatePurchaseOrder();

  const warehouses = warehousesData ?? [];
  const suppliers = suppliersData?.data ?? [];
  const allVariants = (productsData?.data ?? []).flatMap(p => 
    p.variants.map(v => ({
      id: v.id,
      name: `${p.name} - ${v.name} (${v.sku})`,
      sku: v.sku
    }))
  );

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyPOLineItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof POLineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function lineTotal(item: POLineItem): number {
    const qty = parseFloat(item.ordered_quantity) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    return qty * cost;
  }

  function grandTotal(): number {
    return lineItems.reduce((sum, item) => sum + lineTotal(item), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!warehouseId || !supplierId) {
      setError("Anbar və Təchizatçı mütləqdir.");
      return;
    }
    if (lineItems.length === 0) {
      setError("Ən azı bir məhsul sətri əlavə edin.");
      return;
    }
    for (const item of lineItems) {
      if (!item.variant_id) {
        setError("Bütün sətirlərdə məhsul seçilməlidir.");
        return;
      }
    }

    const payload = {
      warehouse_id: warehouseId,
      supplier_id: supplierId,
      delivery_date: deliveryDate || undefined,
      notes: notes.trim() || undefined,
      items: lineItems.map((item) => ({
        variant_id: item.variant_id,
        ordered_quantity: parseFloat(item.ordered_quantity) || 1,
        unit_cost: parseFloat(item.unit_cost) || 0,
      })),
    };

    try {
      await createPO.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni Satınalma Sifarişi"
      description="Yükləmə detallarını və məhsul sətirlərini əlavə edin."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 gap-5">
           <div>
              <label className="block text-sm font-black text-foreground mb-1.5 flex items-center gap-2 uppercase tracking-tight text-[10px]">
                 <Archive className="h-3 w-3 text-primary" /> Anbar <span className="text-destructive">*</span>
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
              <label className="block text-sm font-black text-foreground mb-1.5 flex items-center gap-2 uppercase tracking-tight text-[10px]">
                 <Truck className="h-3 w-3 text-primary" /> Təchizatçı <span className="text-destructive">*</span>
              </label>
              <Select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Təchizatçı seçin</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight">Gözlənilən Tarix</label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="bg-secondary/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-foreground mb-1.5 uppercase tracking-tight">Qeydlər</label>
            <Input
              placeholder="Sifariş barədə qeydlər..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/20"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4 pt-4 border-t border-border/40">
           <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-foreground flex items-center gap-2 uppercase tracking-widest">
                <Package className="h-4 w-4 text-primary" /> Məhsul Səthləri
                <Badge variant="outline" className="font-mono">{lineItems.length}</Badge>
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={addLineItem} className="h-8 gap-1.5 border-dashed border-primary/30 text-primary hover:bg-primary/5">
                <Plus className="h-3.5 w-3.5" />
                Sətir əlavə et
              </Button>
           </div>

           <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 px-1">
                <p className="col-span-6 text-[10px] font-black text-muted-foreground uppercase opacity-70 tracking-widest">Məhsul / Variant</p>
                <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase opacity-70 tracking-widest">Miqdar</p>
                <p className="col-span-3 text-[10px] font-black text-muted-foreground uppercase opacity-70 tracking-widest text-right pr-4">Maya Dəyəri</p>
                <p className="col-span-1" />
              </div>

              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center group animate-in slide-in-from-right-1 shadow-sm rounded-xl p-1 hover:bg-secondary/10 transition-colors">
                  <div className="col-span-6">
                    <Select
                      value={item.variant_id}
                      onChange={(e) => updateLineItem(index, "variant_id", e.target.value)}
                      className="border-border/60 bg-background"
                    >
                      <option value="">Variant seçin...</option>
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
                      value={item.ordered_quantity}
                      onChange={(e) => updateLineItem(index, "ordered_quantity", e.target.value)}
                      className="border-border/60 bg-background text-center font-bold"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_cost}
                      onChange={(e) => updateLineItem(index, "unit_cost", e.target.value)}
                      className="border-border/60 bg-background text-right font-black"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
           </div>

           <div className="flex justify-between items-center p-5 rounded-3xl bg-primary/5 border border-primary/10 mt-6 shadow-inner">
              <div className="space-y-0.5">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">Cəmi Məbləğ</p>
                 <p className="text-xs text-muted-foreground">Bütün məhsul sətirlərinin cəmi</p>
              </div>
              <p className="text-2xl font-black text-primary tracking-tighter">
                {grandTotal().toLocaleString("az-AZ", { style: "currency", currency: "AZN" })}
              </p>
           </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-2xl px-4 py-3 border border-destructive/20 animate-in shake-in-0.5">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6 rounded-xl font-bold">
            Ləğv et
          </Button>
          <Button type="submit" disabled={createPO.isPending} className="h-11 px-10 rounded-xl font-black shadow-lg shadow-primary/20">
            {createPO.isPending ? "Yaradılır..." : "Təsdiqlə və Yarad"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
