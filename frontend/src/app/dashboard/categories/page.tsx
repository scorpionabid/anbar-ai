"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
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
import { Search, Filter, Download, CheckCircle2, XCircle, Layers } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: categoryData, isLoading, isError } = useCategories({
    search: search || undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter === "active",
    page,
    per_page: 100,
  });

  const categories = categoryData?.data ?? [];
  const totalCount = categoryData?.total ?? 0;

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [targetToDelete, setTargetToDelete] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    console.log("Opening edit for category:", c);
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

  function openDelete(c: Category) {
    setTargetToDelete(c);
    setDeleteModalOpen(true);
  }

  function closeDelete() {
    setTargetToDelete(null);
    setDeleteModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
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
        console.log("Updating category:", { id: editTarget.id, payload });
        await updateCategory.mutateAsync({ id: editTarget.id, payload });
        console.log("Category updated successfully");
      } else {
        console.log("Creating new category:", payload);
        await createCategory.mutateAsync(payload);
        console.log("Category created successfully");
      }
      closeModal();
    } catch (err) {
      console.error("Error in category operation:", err);
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete() {
    if (!targetToDelete) return;
    try {
      console.log("Deleting category:", targetToDelete.id);
      await deleteCategory.mutateAsync(targetToDelete.id);
      console.log("Category deleted successfully");
      closeDelete();
    } catch (err) {
      console.error("Error deleting category:", err);
      // silently fail
    }
  }

  function exportToCSV() {
    if (!categories.length) return;
    const headers = ["ID", "Ad", "Ana Kateqoriya", "Açıqlama", "Status", "Yaradılma Tarixi"];
    const rows = categories.map((c) => [
      c.id,
      c.name,
      getParentName(c.parent_id),
      c.description || "",
      c.is_active ? "Aktiv" : "Deaktiv",
      new Date(c.created_at).toLocaleDateString("az-AZ"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kateqoriyalar_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const isPending = createCategory.isPending || updateCategory.isPending;

  // parent lookup helper
  function getParentName(id: string | null): string {
    if (!id) return "—";
    const found = categories.find((c) => c.id === id);
    if (!found && id) {
      console.warn("Parent category not found in current list for ID:", id);
    }
    return found ? found.name : "Yoxdur";
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* ── Statistics Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ümumi Kateqoriya</p>
                <h3 className="text-2xl font-bold mt-1">{totalCount}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Layers size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card glass className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktiv</p>
                <h3 className="text-2xl font-bold mt-1">
                  {categories.filter(c => c.is_active).length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card glass className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deaktiv</p>
                <h3 className="text-2xl font-bold mt-1">
                  {categories.filter(c => !c.is_active).length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <XCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Page header & Actions ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Kateqoriyalar
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Məhsul iyerarxiyasını idarə edin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={exportToCSV} disabled={!categories.length}>
            <Download className="h-4 w-4" />
            Eksport
          </Button>
          <Button onClick={openCreate} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            Yeni Kateqoriya
          </Button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <Card glass className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Ad və ya açıqlama ilə axtarış..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48 relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
            <Select
              className="pl-10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Bütün Statuslar</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Deaktiv</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/20">
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
                {!isLoading && !isError && categories.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Heç bir kateqoriya tapılmadı.
                    </td>
                  </tr>
                )}
                {(categories).map((c) => {
                  const isChild = !!c.parent_id;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0 group/row"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">
                        <div className="flex items-center gap-3">
                          {isChild && <div className="w-4 h-4 border-l-2 border-b-2 border-border/50 rounded-bl-lg ml-2" />}
                          {c.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {getParentName(c.parent_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-[300px] truncate">
                        {c.description ?? <span className="opacity-40">Açıqlama yoxdur</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={c.is_active ? "success" : "secondary"}>
                          {c.is_active ? "Aktiv" : "Deaktiv"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
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
                            onClick={() => openDelete(c)}
                            aria-label="Sil"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
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
              {(categories)
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

          <div className="flex items-center gap-3 border border-border/50 p-3 rounded-xl bg-secondary/10">
            <input
              type="checkbox"
              id="cat-is-active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-5 w-5 rounded border-input accent-primary cursor-pointer"
            />
            <label
              htmlFor="cat-is-active"
              className="text-sm font-semibold text-foreground cursor-pointer"
            >
              Aktiv Status
            </label>
          </div>

          {formError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20 font-medium">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={closeModal} className="px-6">
              Ləğv et
            </Button>
            <Button type="submit" disabled={isPending} className="px-8 shadow-lg shadow-primary/20">
              {isPending ? "Saxlanılır..." : editTarget ? "Yenilə" : "Yarat"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Modal
        open={deleteModalOpen}
        onClose={closeDelete}
        title="Kateqoriyanı Sil"
        description={`"${targetToDelete?.name}" kateqoriyasını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={closeDelete} disabled={deleteCategory.isPending}>
            Xeyr, Saxla
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleteCategory.isPending}
            className="gap-2 shadow-lg shadow-destructive/20"
          >
            {deleteCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Bəli, Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
}
