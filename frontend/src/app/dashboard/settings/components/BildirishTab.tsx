"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { useNotifications, useNotificationsMutation } from "@/hooks/useNotifications";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { NotificationSettings } from "@/types/api";

function Toggle({ 
  checked, 
  onChange, 
  label, 
  description 
}: { 
  checked: boolean; 
  onChange: (v: boolean) => void; 
  label: string; 
  description: string 
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/30 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-primary" : "bg-secondary"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export function BildirishTab() {
  const notifications = useNotifications();
  const mutation = useNotificationsMutation();
  const [form, setForm] = useState<NotificationSettings>({
    email_low_stock: true,
    email_new_order: true,
    email_payment: false,
    low_stock_email: null,
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (notifications.data) setForm(notifications.data);
  }, [notifications.data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    await mutation.mutateAsync(form);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (notifications.isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary/60 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" /> Bildiriş Parametrləri
        </h1>
        <p className="text-muted-foreground font-medium mt-1">E-poçt bildirişlərini idarə edin</p>
      </div>

      <Card glass>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Toggle
              checked={form.email_low_stock}
              onChange={v => setForm(f => ({ ...f, email_low_stock: v }))}
              label="Aşağı stok xəbərdarlığı"
              description="Stok minimum həddə çatdıqda e-poçt göndər"
            />
            <Toggle
              checked={form.email_new_order}
              onChange={v => setForm(f => ({ ...f, email_new_order: v }))}
              label="Yeni sifariş bildirişi"
              description="Yeni sifariş yaradıldıqda e-poçt göndər"
            />
            <Toggle
              checked={form.email_payment}
              onChange={v => setForm(f => ({ ...f, email_payment: v }))}
              label="Ödəniş alındı bildirişi"
              description="Ödəniş qeydə alındıqda e-poçt göndər"
            />

            <div className="pt-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Bildiriş e-poçtu
              </label>
              <Input
                type="email"
                placeholder="notifications@example.com"
                value={form.low_stock_email ?? ""}
                onChange={e => setForm(f => ({ ...f, low_stock_email: e.target.value || null }))}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Boş buraxılsa, admin hesabının e-poçtuna göndəriləcək.
              </p>
            </div>

            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1.5 pt-2">
                <CheckCircle className="h-4 w-4" /> Parametrlər yadda saxlandı
              </p>
            )}
            
            {mutation.isError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-2">
                {mutation.error instanceof Error ? mutation.error.message : "Xəta baş verdi"}
              </p>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saxlanılır..." : "Yadda saxla"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
