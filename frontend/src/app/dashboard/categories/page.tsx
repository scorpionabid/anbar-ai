"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategoryMutations";
import type { Category } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

// ─── form state ───────────────────────────────────────────────────────────────

interface CategoryForm {
  name: string;
  description: string;
  parent_id: string;
  is_active: boolean;
}

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  parent_id: "",
  is_active: true,
};

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

export default function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditTarget(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      parent_id: c.parent_id ?? "",
      is_active: c.is_active,
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
      setFormError("Kateqoriya adı mütləqdir.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      parent_id: form.parent_id || undefined,
      is_active: form.is_active,
    };

    try {
      if (editTarget) {
        await updateCategory.mutateAsync({ id: editTarget.id, payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory.mutateAsync(id);
      setDeletingId(null);
    } catch {
      // silently fail
    }
  }

  const isPending = createCategory.isPending || updateCategory.isPending;

  // parent lookup helper
  function getParentName(parentId: string | null): string {
    if (!parentId) return "—";
    return categories?.find((c) => c.id === parentId)?.name ?? "—";
  }

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Kateqoriyalar
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading
              ? "Yüklənir..."
              : `${categories?.length ?? 0} kateqoriya mövcuddur`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Kateqoriya
        </Button>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["Ad", "Ana Kateqoriya", "Açıqlama", "Status", "Əməliyyatlar"].map(
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
                      Kateqoriyalar yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && categories?.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Hələ heç bir kateqoriya əlavə edilməyib.
                    </td>
                  </tr>
                )}
                {(categories ?? []).map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getParentName(c.parent_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                      {c.description ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={c.is_active ? "success" : "secondary"}>
                        {c.is_active ? "Aktiv" : "Deaktiv"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {deletingId === c.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Əminsiniz?
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(c.id)}
                            disabled={deleteCategory.isPending}
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
                            onClick={() => openEdit(c)}
                            aria-label="Düzəlt"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingId(c.id)}
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
        title={editTarget ? "Kateqoriyanı Düzəlt" : "Yeni Kateqoriya"}
        description={
          editTarget
            ? "Kateqoriya məlumatlarını yeniləyin."
            : "Yeni kateqoriya yaratmaq üçün məlumatları doldurun."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ad <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="məs. Elektronika"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ana Kateqoriya
            </label>
            <Select
              value={form.parent_id}
              onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
            >
              <option value="">Yoxdur</option>
              {(categories ?? [])
                .filter((c) => c.id !== editTarget?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Açıqlama
            </label>
            <Textarea
              placeholder="Kateqoriya haqqında qısa məlumat..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="cat-is-active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <label
              htmlFor="cat-is-active"
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
