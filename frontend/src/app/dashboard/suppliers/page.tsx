"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
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
  contact_person: string;
  address: string;
  payment_terms_days: number;
  notes: string;
  is_active: boolean;
}

const emptyForm: SupplierForm = {
  name: "",
  email: "",
  phone: "",
  contact_person: "",
  address: "",
  payment_terms_days: 30,
  notes: "",
  is_active: true,
};

// ─── skeleton row ─────────────────────────────────────────────────────────────

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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useSuppliers(page, 20);
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
      email: s.email ?? "",
      phone: s.phone ?? "",
      contact_person: s.contact_person ?? "",
      address: s.address ?? "",
      payment_terms_days: s.payment_terms_days,
      notes: s.notes ?? "",
      is_active: s.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Təchizatçı adı mütləqdir.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      contact_person: form.contact_person.trim() || undefined,
      address: form.address.trim() || undefined,
      payment_terms_days: form.payment_terms_days,
      notes: form.notes.trim() || undefined,
      is_active: form.is_active,
    };

    try {
      if (editTarget) {
        await updateSupplier.mutateAsync({ id: editTarget.id, payload });
      } else {
        await createSupplier.mutateAsync(payload);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSupplier.mutateAsync(id);
      setDeletingId(null);
    } catch {
      // silently fail
    }
  }

  const isPending = createSupplier.isPending || updateSupplier.isPending;
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Təchizatçılar
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading
              ? "Yüklənir..."
              : `${data?.total ?? 0} təchizatçı mövcuddur`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Təchizatçı
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
                    "Ad",
                    "Email",
                    "Telefon",
                    "Əlaqə şəxsi",
                    "Ödəniş müddəti (gün)",
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
                      Təchizatçılar yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Hələ heç bir təchizatçı əlavə edilməyib.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {s.email ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {s.phone ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {s.contact_person ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">
                      {s.payment_terms_days}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={s.is_active ? "success" : "secondary"}>
                        {s.is_active ? "Aktiv" : "Deaktiv"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {deletingId === s.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Əminsiniz?
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(s.id)}
                            disabled={deleteSupplier.isPending}
                          >
                            Bəli
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(null)}
                          >
                            Xeyr
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(s)}
                            aria-label="Düzəlt"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingId(s.id)}
                            aria-label="Sil"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Səhifə {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Əvvəlki
                </Button>
                <Button
                  size="sm"
                  variant="outline"
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
        title={editTarget ? "Təchizatçını Düzəlt" : "Yeni Təchizatçı"}
        description={
          editTarget
            ? "Təchizatçı məlumatlarını yeniləyin."
            : "Yeni təchizatçı yaratmaq üçün məlumatları doldurun."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ad <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Təchizatçı adı"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Telefon
              </label>
              <Input
                type="tel"
                placeholder="+994 50 000 00 00"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Əlaqə şəxsi
              </label>
              <Input
                placeholder="Ad Soyad"
                value={form.contact_person}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_person: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ünvan
            </label>
            <Textarea
              placeholder="Şəhər, küçə..."
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Qeydlər
            </label>
            <Textarea
              placeholder="Əlavə qeydlər..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="sup-is-active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <label
              htmlFor="sup-is-active"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Aktiv
            </label>
          </div>

          {formError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saxlanılır..." : editTarget ? "Yenilə" : "Yarat"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
