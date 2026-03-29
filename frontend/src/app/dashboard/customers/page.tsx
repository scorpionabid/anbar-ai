"use client";

import { useState } from "react";
import { Plus, Search, Filter, Download, Users, SearchX } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import {
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/useCustomerMutations";
import type { Customer } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Extracted Components
import { CustomerStats } from "./components/CustomerStats";
import { CustomerRow } from "./components/CustomerRow";
import { CustomerModal } from "./components/CustomerModal";
import { type CustomerForm, emptyForm } from "./components/types";

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-6 py-5">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "individual" | "company">("all");

  const { data, isLoading, isError } = useCustomers(page, 20);

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditTarget(c);
    setForm({
      customer_type: c.customer_type,
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      tax_number: c.tax_number ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
      is_active: c.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError("Müştəri adı mütləqdir.");
      return;
    }
    const payload = { ...form, name: form.name.trim() };
    try {
      if (editTarget) {
        await updateCustomer.mutateAsync({ id: editTarget.id, payload });
      } else {
        await createCustomer.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  // Filter local data (backend filtering preferred, but hooks might not support type filter yet)
  const filteredData = (data?.data ?? []).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = typeFilter === "all" || c.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
             Müştərilər (CRM)
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1 tracking-tight">
            {isLoading ? "Yüklənir..." : `${data?.total ?? 0} müştəri qeydə alınıb`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openCreate} className="gap-2 shadow-lg shadow-primary/20 rounded-2xl h-11 px-8 font-black">
            <Plus className="h-4 w-4" />
            Yeni Müştəri
          </Button>
        </div>
      </div>

      {/* KPI Stats Section */}
      {!isLoading && !isError && data && (
        <CustomerStats customers={data.data} totalCount={data.total} />
      )}

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-secondary/20 p-4 rounded-3xl border border-border/30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ad və ya email üzrə axtarış..."
            className="pl-10 h-11 rounded-2xl bg-background border-border/40 transition-all focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-background rounded-2xl border border-border/20 shadow-inner">
           {[
             { id: "all", label: "Hamısı" },
             { id: "company", label: "Şirkət" },
             { id: "individual", label: "Fərdi" }
           ].map((f) => (
             <button
               key={f.id}
               onClick={() => setTypeFilter(f.id as any)}
               className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${typeFilter === f.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary"}`}
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
                <tr className="border-b border-border/50 text-left uppercase tracking-widest border-t-0">
                  {["Müştəri", "Tip", "VÖEN / Vergi", "Ünvan", "Status", "Əməllər"].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-muted-foreground tracking-widest truncate">
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
                    <td colSpan={6} className="px-6 py-20 text-center text-sm text-destructive font-black">
                       Məlumatlar yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                       <SearchX className="h-16 w-16 mx-auto mb-4 opacity-5 text-primary" />
                       <p className="text-sm font-bold text-muted-foreground">Müştəri tapılmadı.</p>
                       <p className="text-[10px] text-muted-foreground mt-1 opacity-70 italic tracking-tight">Kriteriyaları dəyişərək yenidən yoxlayın.</p>
                    </td>
                  </tr>
                )}
                {filteredData.map((c) => (
                  <CustomerRow
                    key={c.id}
                    customer={c}
                    onEdit={openEdit}
                    onDelete={(id) => deleteCustomer.mutate(id)}
                    deletingId={deletingId}
                    setDeletingId={setDeletingId}
                    deletePending={deleteCustomer.isPending}
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
      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        target={editTarget}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        isPending={createCustomer.isPending || updateCustomer.isPending}
        error={formError}
      />
    </div>
  );
}
