"use client";

import { useState } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Truck, 
  Search, 
  Filter, 
  Download, 
  SearchX, 
  MoreHorizontal,
  Users,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import {
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/useSupplierMutations";
import type { Supplier } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

// ─── form state ───────────────────────────────────────────────────────────────

interface SupplierForm {
  name: string;
  email: string;
  phone: string;
  contact_name: string;
  address: string;
  tax_number: string;
  payment_terms_days: number;
  notes: string;
  is_active: boolean;
}

const emptyForm: SupplierForm = {
  name: "",
  email: "",
  phone: "",
  contact_name: "",
  address: "",
  tax_number: "",
  payment_terms_days: 30,
  notes: "",
  is_active: true,
};

// ─── skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

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

  // Stats calculation
  const stats = {
    total: data?.total ?? 0,
    active: data?.data.filter(s => s.is_active).length ?? 0, // Note: This only counts current page if backend doesn't provide full stats
    inactive: (data?.total ?? 0) - (data?.data.filter(s => s.is_active).length ?? 0)
  };

  function openCreate() {
    console.log("[SuppliersPage] Opening Create Supplier modal");
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    console.log("[SuppliersPage] Opening Edit Supplier modal for:", s);
    setEditTarget(s);
    setForm({
      name: s.name,
      email: s.email ?? "",
      phone: s.phone ?? "",
      contact_name: s.contact_name ?? "",
      address: s.address ?? "",
      tax_number: s.tax_number ?? "",
      payment_terms_days: s.payment_terms_days,
      notes: s.notes ?? "",
      is_active: s.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    console.log("[SuppliersPage] Closing Supplier modal");
    setModalOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[SuppliersPage] Handling Supplier form submission. Data:", form);
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Təchizatçı adı mütləqdir.");
      return;
    }

    try {
      if (editTarget) {
        await updateSupplier.mutateAsync({ id: editTarget.id, payload: form });
      } else {
        await createSupplier.mutateAsync(form);
      }
      closeModal();
    } catch (err) {
      console.error("[SuppliersPage] Error in handleSubmit:", err);
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete(id: string) {
    console.log(`[SuppliersPage] Triggering delete for supplier ${id}`);
    try {
      await deleteSupplier.mutateAsync(id);
      setDeletingId(null);
    } catch (err) {
      console.error("[SuppliersPage] Error deleting supplier:", err);
    }
  }

  const exportToCSV = () => {
    console.log("[SuppliersPage] Exporting suppliers to CSV");
    if (!data?.data) return;

    const headers = ["Ad", "Əlaqə şəxsi", "Email", "Telefon", "VÖEN", "Ödəniş müddəti (gün)", "Status"];
    const rows = data.data.map(s => [
      s.name,
      s.contact_name || "",
      s.email || "",
      s.phone || "",
      s.tax_number || "",
      s.payment_terms_days,
      s.is_active ? "Aktiv" : "Deaktiv"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `suppliers_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPending = createSupplier.isPending || updateSupplier.isPending;
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Təchizatçılar
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Təchizatçı siyahısını idarə edin və əlaqə məlumatlarını tənzimləyin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2 border-border/50 hover:bg-secondary/50"
            onClick={exportToCSV}
            disabled={!data?.data || data.data.length === 0}
          >
            <Download className="h-4 w-4" />
            Eksport
          </Button>
          <Button onClick={openCreate} className="gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Yeni Təchizatçı
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass className="relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Ümumi</p>
                <h3 className="text-3xl font-black mt-1">{isLoading ? "..." : stats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary/50 to-transparent" />
          </CardContent>
        </Card>

        <Card glass className="relative overflow-hidden group border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-success uppercase tracking-wider">Aktiv</p>
                <h3 className="text-3xl font-black mt-1 text-success">{isLoading ? "..." : stats.active}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-success/50 to-transparent" />
          </CardContent>
        </Card>

        <Card glass className="relative overflow-hidden group border-secondary/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Deaktiv</p>
                <h3 className="text-3xl font-black mt-1">{isLoading ? "..." : stats.inactive}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform duration-300">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-border/50 to-transparent" />
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card glass className="border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Ad, Email və ya Əlaqə şəxsi üzrə axtarış..." 
                className="pl-10 bg-secondary/20 border-border/50 focus:border-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/50">
                {(["all", "active", "inactive"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                        setStatusFilter(s);
                        setPage(1);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === s 
                        ? "bg-background text-foreground shadow-sm scale-[1.02]" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s === "all" ? "Hamısı" : s === "active" ? "Aktiv" : "Deaktiv"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card glass className="border-border/30 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/10">
                  {[
                    "Ad",
                    "Əlaqə şəxsi",
                    "Email / Telefon",
                    "VÖEN",
                    "Ödəniş (gün)",
                    "Status",
                    "Əməliyyatlar",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-black text-muted-foreground uppercase tracking-wider"
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
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-destructive">
                         <XCircle className="h-10 w-10 opacity-50" />
                         <p className="font-bold">Məlumatlar yüklənərkən xəta baş verdi.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <SearchX className="h-12 w-12 opacity-20" />
                        <div>
                          <p className="text-lg font-black italic opacity-50">Təchizatçı tapılmadı</p>
                          <p className="text-sm">Axtarış meyarlarını dəyişərək yenidən yoxlayın.</p>
                        </div>
                        {searchQuery && (
                            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="mt-2">
                                Axtarışı sıfırla
                            </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/30 hover:bg-secondary/40 transition-all duration-200 group last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">ID: {s.id.slice(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                      {s.contact_name ?? <span className="opacity-40 italic">Qeyd edilməyib</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-foreground font-medium">{s.email || "—"}</span>
                        <span className="text-xs text-muted-foreground">{s.phone || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                       {s.tax_number || <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{s.payment_terms_days}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">gün</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={s.is_active ? "success" : "secondary"} className="font-bold px-3 py-0.5">
                        {s.is_active ? "Aktiv" : "Deaktiv"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {deletingId === s.id ? (
                        <div className="flex items-center gap-2 p-1 bg-destructive/10 rounded-xl animate-in zoom-in duration-200">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(s.id)}
                            disabled={deleteSupplier.isPending}
                            className="h-7 px-3 text-[10px] uppercase font-bold"
                          >
                            Bəli
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingId(null)}
                            className="h-7 px-3 text-[10px] uppercase font-bold"
                          >
                            Xeyr
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(s)}
                            className="h-8 w-8 hover:bg-background shadow-sm border border-transparent hover:border-border/50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingId(s.id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:border-destructive/20"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-6 border-t border-border/50 bg-secondary/5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Səhifə <span className="text-foreground">{page}</span> / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl px-4 border-border/50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Əvvəlki
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl px-4 border-border/50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Növbəti
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Təchizatçını Redaktə Et" : "Yeni Təchizatçı"}
        description={
          editTarget
            ? "Mövcud təchizatçının məlumatlarını yeniləyin."
            : "Sistemə yeni təchizatçı əlavə etmək üçün məlumatları doldurun."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                Təchizatçı Adı <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Məs: Global Logistics MMC"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="bg-secondary/20 border-border/50 h-11"
              />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                    VÖEN (Vergi Ödəyicisinin Eyniləşdirmə Nömrəsi)
                </label>
                <Input
                    placeholder="Məs: 1234567891"
                    value={form.tax_number}
                    onChange={(e) => setForm((f) => ({ ...f, tax_number: e.target.value }))}
                    className="bg-secondary/20 border-border/50 h-11 font-mono"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                Email Ünvanı
              </label>
              <Input
                type="email"
                placeholder="supplier@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-secondary/20 border-border/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                Telefon Nömrəsi
              </label>
              <Input
                type="tel"
                placeholder="+994 (__) ___-__-__"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="bg-secondary/20 border-border/50 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                Əlaqə şəxsi (Ad Soyad)
              </label>
              <Input
                placeholder="Məs: Elvin Məmmədov"
                value={form.contact_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_name: e.target.value }))
                }
                className="bg-secondary/20 border-border/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                Ödəniş müddəti (gün)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="30"
                value={form.payment_terms_days}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_terms_days: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="bg-secondary/20 border-border/50 h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
              Fiziki Ünvan
            </label>
            <Textarea
              placeholder="Şəhər, küçə, bina..."
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="bg-secondary/20 border-border/50 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
              Əlavə Qeydlər
            </label>
            <Textarea
              placeholder="Təchizatçı haqqında vacib qeydlər..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="bg-secondary/20 border-border/50 min-h-[80px]"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-2xl border border-border/30">
            <input
              type="checkbox"
              id="sup-is-active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-5 w-5 rounded-lg border-input accent-primary cursor-pointer transition-all"
            />
            <label
              htmlFor="sup-is-active"
              className="text-sm font-black text-foreground cursor-pointer select-none"
            >
              Aktiv Status
            </label>
          </div>

          {formError && (
            <div className="text-xs font-bold text-destructive bg-destructive/10 rounded-xl px-4 py-3 border border-destructive/20 animate-in shake duration-300">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl px-6 h-11 border-border/50">
              Ləğv et
            </Button>
            <Button type="submit" disabled={isPending} className="rounded-xl px-10 h-11 shadow-lg shadow-primary/20">
              {isPending ? "Saxlanılır..." : editTarget ? "Yenilə" : "Yarat"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
