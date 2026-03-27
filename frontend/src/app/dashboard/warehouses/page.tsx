"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehouses";
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from "@/hooks/useWarehouseMutations";
import type { Warehouse } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

// ─── form state ──────────────────────────────────────────────────────────────

interface WarehouseForm {
  name: string;
  address: string;
  is_active: boolean;
}

const emptyForm: WarehouseForm = { name: "", address: "", is_active: true };

// ─── skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function WarehousesPage() {
  const { data: warehouses, isLoading, isError } = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<WarehouseForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(w: Warehouse) {
    setEditTarget(w);
    setForm({ name: w.name, address: w.address ?? "", is_active: w.is_active });
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
      setFormError("Anbar adı mütləqdir.");
      return;
    }

    try {
      if (editTarget) {
        await updateWarehouse.mutateAsync({
          id: editTarget.id,
          payload: {
            name: form.name.trim(),
            address: form.address.trim() || undefined,
            is_active: form.is_active,
          },
        });
      } else {
        await createWarehouse.mutateAsync({
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          is_active: form.is_active,
        });
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWarehouse.mutateAsync(id);
      setDeletingId(null);
    } catch {
      // silently fail — could show inline error
    }
  }

  const isPending = createWarehouse.isPending || updateWarehouse.isPending;

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Anbarlar
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading
              ? "Yüklənir..."
              : `${warehouses?.length ?? 0} anbar mövcuddur`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Anbar
        </Button>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["Ad", "Ünvan", "Status", "Yaradılma tarixi", "Əməliyyatlar"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
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
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-destructive"
                    >
                      Anbarlar yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && warehouses?.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <WarehouseIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Hələ heç bir anbar əlavə edilməyib.
                    </td>
                  </tr>
                )}
                {(warehouses ?? []).map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {w.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {w.address ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={w.is_active ? "success" : "secondary"}>
                        {w.is_active ? "Aktiv" : "Deaktiv"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString("az-AZ")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {deletingId === w.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Əminsiniz?
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(w.id)}
                            disabled={deleteWarehouse.isPending}
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
                            onClick={() => openEdit(w)}
                            aria-label="Düzəlt"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingId(w.id)}
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
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Anbarı Düzəlt" : "Yeni Anbar"}
        description={
          editTarget
            ? "Anbar məlumatlarını yeniləyin."
            : "Yeni anbar yaratmaq üçün məlumatları doldurun."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Anbar adı <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="məs. Mərkəzi Anbar"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ünvan
            </label>
            <Input
              placeholder="məs. Bakı, Nizami küçəsi 10"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="wh-is-active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <label
              htmlFor="wh-is-active"
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
