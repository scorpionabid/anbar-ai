"use client";

import { useState } from "react";
import { Webhook, Plus, Globe, Pencil, XCircle, CheckCircle, Trash2 } from "lucide-react";
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook } from "@/hooks/useWebhooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { WebhookRead, WebhookCreate, WebhookEvent } from "@/types/api";

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: "order.created",          label: "Sifariş yaradıldı" },
  { value: "order.status_changed",   label: "Sifariş statusu dəyişdi" },
  { value: "inventory.low_stock",    label: "Aşağı stok" },
  { value: "payment.received",       label: "Ödəniş alındı" },
  { value: "purchase_order.created", label: "Alış sifarişi yaradıldı" },
];

const emptyWebhookForm: WebhookCreate = { url: "", events: [], secret: "", description: "" };

export function WebhooksTab() {
  const webhooks = useWebhooks();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<WebhookRead | null>(null);
  const [form, setForm] = useState<WebhookCreate>(emptyWebhookForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function openCreate() {
    setEditItem(null);
    setForm(emptyWebhookForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(wh: WebhookRead) {
    setEditItem(wh);
    setForm({ url: wh.url, events: wh.events as WebhookEvent[], secret: "", description: wh.description ?? "" });
    setFormError(null);
    setModalOpen(true);
  }

  function toggleEvent(ev: WebhookEvent) {
    setForm(f => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.url.startsWith("https://")) {
      setFormError("URL mütləq https:// ilə başlamalıdır");
      return;
    }
    if (form.events.length === 0) {
      setFormError("Ən azı 1 hadisə seçilməlidir");
      return;
    }
    try {
      if (editItem) {
        await updateWebhook.mutateAsync({ id: editItem.id, payload: { url: form.url, events: form.events, description: form.description || undefined } });
      } else {
        await createWebhook.mutateAsync(form);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi");
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Webhook className="h-7 w-7 text-primary" /> Webhooks
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {webhooks.isLoading ? "Yüklənir..." : `${webhooks.data?.length ?? 0} webhook`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni Webhook
        </Button>
      </div>

      {webhooks.isLoading && (
        <div className="grid gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-secondary/60 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!webhooks.isLoading && !webhooks.isError && webhooks.data?.length === 0 && (
        <Card glass>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Webhook konfiqurasiya edilməyib
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {(webhooks.data ?? []).map((wh: WebhookRead) => (
          <Card key={wh.id} glass>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-mono text-foreground truncate">{wh.url}</p>
                    <Badge variant={wh.is_active ? "success" : "secondary"}>
                      {wh.is_active ? "Aktiv" : "Deaktiv"}
                    </Badge>
                  </div>
                  {wh.description && <p className="text-xs text-muted-foreground mb-2">{wh.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {wh.events.map(ev => (
                      <span key={ev} className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5 font-medium">{ev}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(wh)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateWebhook.mutate({ id: wh.id, payload: { is_active: !wh.is_active } })}>
                    {wh.is_active ? <XCircle className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                  </Button>
                  {confirmDelete === wh.id ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { deleteWebhook.mutate(wh.id); setConfirmDelete(null); }}>Bəli</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Xeyr</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(wh.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Webhook Redaktəsi" : "Yeni Webhook"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">URL <span className="text-destructive">*</span></label>
            <Input placeholder="https://example.com/webhook" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Açıqlama</label>
            <Input placeholder="İxtiyari açıqlama" value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Hadisələr <span className="text-destructive">*</span></label>
            <div className="space-y-2">
              {WEBHOOK_EVENTS.map(ev => (
                <label key={ev.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.events.includes(ev.value)}
                    onChange={() => toggleEvent(ev.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">{ev.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">({ev.value})</span>
                </label>
              ))}
            </div>
          </div>
          {!editItem && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">HMAC Sirri (ixtiyari)</label>
              <Input type="password" placeholder="Webhook yükünü imzalamaq üçün" value={form.secret ?? ""} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} />
            </div>
          )}
          {formError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Ləğv et</Button>
            <Button type="submit" disabled={createWebhook.isPending || updateWebhook.isPending}>
              {createWebhook.isPending || updateWebhook.isPending ? "Saxlanılır..." : "Saxla"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
