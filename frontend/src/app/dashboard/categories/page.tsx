"use client";

import { useState } from "react";
import { Plus, Search, Filter, Download, Tag } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategoryMutations";
import type { Category } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

// Extracted Components
import { CategoryStats } from "./components/CategoryStats";
import { CategoryRow } from "./components/CategoryRow";
import { CategoryModal } from "./components/CategoryModal";
import { DeleteCategoryModal } from "./components/DeleteCategoryModal";
import { type CategoryForm, emptyForm } from "./components/types";
import { SkeletonRow } from "@/components/ui/SkeletonRow";

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
        await updateCategory.mutateAsync({ id: editTarget.id, payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  function getParentName(id: string | null): string {
    if (!id) return "—";
    const found = categories.find((c) => c.id === id);
    return found ? found.name : "Yoxdur";
  }

  function exportToCSV() {
    if (!categories.length) return;
    const headers = ["ID", "Ad", "Ana Kateqoriya", "Açıqlama", "Status", "Tarix"];
    const rows = categories.map((c) => [
      c.id, c.name, getParentName(c.parent_id), c.description || "",
      c.is_active ? "Aktiv" : "Deaktiv", new Date(c.created_at).toLocaleDateString("az-AZ")
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `kateqoriyalar.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
             Kateqoriyalar
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1 tracking-tight">
            {isLoading ? "Yüklənir..." : `${totalCount} kateqoriya qeydə alınıb`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-11 px-6 rounded-2xl border-border/40" onClick={exportToCSV} disabled={!categories.length}>
            <Download className="h-4 w-4" />
            Eksport
          </Button>
          <Button onClick={openCreate} className="gap-2 shadow-lg shadow-primary/20 rounded-2xl h-11 px-8 font-black">
            <Plus className="h-4 w-4" />
            Yeni Kateqoriya
          </Button>
        </div>
      </div>

      {/* KPI Stats Section */}
      {!isLoading && !isError && categories && (
        <CategoryStats categories={categories} totalCount={totalCount} />
      )}

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-secondary/20 p-4 rounded-3xl border border-border/30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ad və ya açıqlama ilə axtarış..."
            className="pl-10 h-11 rounded-2xl bg-background border-border/40 transition-all focus:ring-2 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-background rounded-2xl border border-border/20 shadow-inner">
           {[
             { id: "all", label: "Hamısı" },
             { id: "active", label: "Aktiv" },
             { id: "inactive", label: "Deaktiv" }
           ].map((f) => (
             <button
               key={f.id}
               onClick={() => setStatusFilter(f.id)}
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
                  {["Ad / İyerarxiya", "Ana Kateqoriya", "Açıqlama", "Status", "Əməllər"].map((h) => (
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
                    <td colSpan={5} className="px-6 py-20 text-center text-sm text-destructive font-bold">
                       Məlumatlar yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && categories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                       <Tag className="h-16 w-16 mx-auto mb-4 opacity-5" />
                       <p className="text-sm font-bold text-muted-foreground">Kateqoriya tapılmadı.</p>
                       <p className="text-xs text-muted-foreground mt-1 opacity-70 italic tracking-tight">Axtarış meyarlarını dəyişməyə cəhd edin.</p>
                    </td>
                  </tr>
                )}
                {categories.map((c) => (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    getParentName={getParentName}
                    onEdit={openEdit}
                    onDelete={(target) => { setTargetToDelete(target); setDeleteModalOpen(true); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        target={editTarget}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        isPending={updateCategory.isPending || createCategory.isPending}
        error={formError}
        categories={categories}
      />

      <DeleteCategoryModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        target={targetToDelete}
        onConfirm={async () => {
          if (targetToDelete) {
             await deleteCategory.mutateAsync(targetToDelete.id);
             setDeleteModalOpen(false);
          }
        }}
        isPending={deleteCategory.isPending}
      />
    </div>
  );
}
