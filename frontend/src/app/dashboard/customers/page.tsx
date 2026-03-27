"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import {
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/useCustomerMutations";
import type { Customer } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

// ─── form state ───────────────────────────────────────────────────────────────

interface CustomerForm {
  customer_type: "individual" | "company";
  name: string;
  email: string;
  phone: string;
  company_name: string;
  shipping_address: string;
  notes: string;
  is_active: boolean;
}

const emptyForm: CustomerForm = {
  customer_type: "individual",
  name: "",
  email: "",
  phone: "",
  company_name: "",
  shipping_address: "",
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

export default function CustomersPage() {
  const [page, setPage] = useState(1);
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
      company_name: c.company_name ?? "",
      shipping_address: c.shipping_address ?? "",
      notes: c.notes ?? "",
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
      setFormError("Müştəri adı mütləqdir.");
      return;
    }

    const payload = {
      customer_type: form.customer_type,
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      company_name:
        form.customer_type === "company"
          ? form.company_name.trim() || undefined
          : undefined,
      shipping_address: form.shipping_address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      is_active: form.is_active,
    };

    try {
      if (editTarget) {
        await updateCustomer.mutateAsync({ id: editTarget.id, payload });
      } else {
        await createCustomer.mutateAsync(payload);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCustomer.mutateAsync(id);
      setDeletingId(null);
    } catch {
      // silently fail
    }
  }

  const isPending = createCustomer.isPending || updateCustomer.isPending;
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Müştərilər
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Yüklənir..." : `${data?.total ?? 0} müştəri mövcuddur`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Müştəri
        </Button>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["Ad", "Tip", "Email", "Telefon", "Balans", "Status", "Əməliyyatlar"].map(
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
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-destructive"
                    >
                      Müştərilər yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Hələ heç bir müştəri əlavə edilməyib.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        variant={
                          c.customer_type === "company" ? "default" : "secondary"
                        }
                      >
                        {c.customer_type === "company" ? "Şirkət" : "Fərdi"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {c.email ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {c.phone ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {c.balance.toLocaleString("az-AZ", {
                        style: "currency",
                        currency: "AZN",
                      })}
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
                            disabled={deleteCustomer.isPending}
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
        title={editTarget ? "Müştərini Düzəlt" : "Yeni Müştəri"}
        description={
          editTarget
            ? "Müştəri məlumatlarını yeniləyin."
            : "Yeni müştəri yaratmaq üçün məlumatları doldurun."
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Müştəri tipi
              </label>
              <Select
                value={form.customer_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    customer_type: e.target.value as "individual" | "company",
                  }))
                }
              >
                <option value="individual">Fərdi</option>
                <option value="company">Şirkət</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ad <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Müştəri adı"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
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

          {form.customer_type === "company" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Şirkət adı
              </label>
              <Input
                placeholder="Şirkətin rəsmi adı"
                value={form.company_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, company_name: e.target.value }))
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Çatdırılma ünvanı
            </label>
            <Textarea
              placeholder="Şəhər, küçə, ev nömrəsi..."
              value={form.shipping_address}
              onChange={(e) =>
                setForm((f) => ({ ...f, shipping_address: e.target.value }))
              }
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
              id="cust-is-active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <label
              htmlFor="cust-is-active"
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
