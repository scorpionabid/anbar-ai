"use client";

import { useState } from "react";
import { Plus, Search, Filter, Download, Truck, SearchX } from "lucide-react";
import { downloadExport } from "@/lib/exportUtils";
import { useSuppliers } from "@/hooks/useSuppliers";
import {
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/useSupplierMutations";
import type { Supplier } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Extracted Components
import { SupplierStats } from "./components/SupplierStats";
import { SupplierRow } from "./components/SupplierRow";
import { SupplierModal } from "./components/SupplierModal";
import { type SupplierForm, emptyForm } from "./components/types";

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-6 py-5">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { data, isLoading, isError } = useSuppliers(
    page, 
    20, 
    searchQuery || undefined,
    statusFilter === "all" ? undefined : statusFilter === "active"
  );

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditTarget(s);
    setForm({
      name: s.name,
      email: s.email || "",
      phone: s.phone || "",
      contact_name: s.contact_name || "",
      address: s.address || "",
      tax_number: s.tax_number || "",
      payment_terms_days: s.payment_terms_days,
      notes: s.notes || "",
      is_active: s.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      if (editTarget) {
        await updateSupplier.mutateAsync({ id: editTarget.id, payload: form });
      } else {
        await createSupplier.mutateAsync(form);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
             Təchizatçılar
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1 tracking-tight">
            {isLoading ? "Yüklənir..." : `${data?.total ?? 0} aktiv təchizatçı obyekti mövcuddur`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-11 px-6 rounded-2xl border-border/40" onClick={() => downloadExport("/api/v1/export/suppliers", "suppliers.csv").catch(console.error)}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={openCreate} className="gap-2 shadow-lg shadow-primary/20 rounded-2xl h-11 px-8 font-black">
            <Plus className="h-4 w-4" />
            Yeni Təchizatçı
          </Button>
        </div>
      </div>

      {/* KPI Stats Section */}
      {!isLoading && !isError && data && (
        <SupplierStats suppliers={data.data} totalCount={data.total} />
      )}

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-secondary/20 p-4 rounded-3xl border border-border/30 backdrop-blur-sm">
         <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ad, e-poçt və ya telefon üzrə axtar..."
              className="pl-10 h-11 rounded-2xl bg-background/50 border-border/40 focus:bg-background transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2 p-1.5 bg-background/50 rounded-2xl border border-border/20 shadow-inner">
            {[
              { id: "all", label: "Hamısı" },
              { id: "active", label: "Aktiv" },
              { id: "inactive", label: "Deaktiv" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === f.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary"}`}
              >
                {f.label}
              </button>
            ))}
         </div>
      </div>

      {/* Table Section */}
      <Card glass className="overflow-hidden border-border/40 shadow-xl shadow-primary/5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/10">
                <tr className="border-b border-border/50 text-left uppercase tracking-widest">
                  {[
                    "Təchizatçı",
                    "Kontakt Şəxs",
                    "VÖEN",
                    "Status",
                    "Əməllər",
                  ].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-muted-foreground">
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
                    <td colSpan={5} className="px-6 py-20 text-center text-sm text-destructive">
                       Məlumatlar yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                       <SearchX className="h-16 w-16 mx-auto mb-4 opacity-5" />
                       <p className="text-sm font-bold text-muted-foreground">Təchizatçı tapılmadı.</p>
                       <p className="text-xs text-muted-foreground mt-1 opacity-70 italic">Axtarış meyarlarını dəyişməyə cəhd edin.</p>
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((supplier) => (
                  <SupplierRow
                    key={supplier.id}
                    supplier={supplier}
                    onEdit={openEdit}
                    onDelete={(id) => deleteSupplier.mutate(id)}
                    deletingId={deletingId}
                    setDeletingId={setDeletingId}
                    deletePending={deleteSupplier.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-5 border-t border-border/50 bg-secondary/5">
              <p className="text-xs font-bold text-muted-foreground opacity-70">
                Səhifə <span className="text-foreground">{page}</span> / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1} className="h-9 px-4 rounded-xl">Əvvəlki</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="h-9 px-4 rounded-xl">Növbəti</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <SupplierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        target={editTarget}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        isPending={createSupplier.isPending || updateSupplier.isPending}
        error={formError}
      />
    </div>
  );
}
