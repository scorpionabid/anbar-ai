"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Info, Shield } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ── Read-only field ────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground bg-secondary/40 rounded-xl px-4 py-2.5 border border-border/40">
        {value || "—"}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Tənzimləmələr
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          Profil və sistem məlumatları
        </p>
      </div>

      {/* Profile section */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profil Məlumatları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoField label="Ad Soyad" value={user?.full_name ?? ""} />
          <InfoField label="Email" value={user?.email ?? ""} />
          <InfoField
            label="Rol"
            value={
              user?.role === "admin"
                ? "Administrator"
                : user?.role === "manager"
                ? "Menecer"
                : user?.role ?? ""
            }
          />
          <InfoField label="Tenant ID" value={user?.tenant_id ?? ""} />
        </CardContent>
      </Card>

      {/* System info section */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Sistem Məlumatları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoField label="Versiya" value="0.1.0" />
          <InfoField label="Mühit" value="Production" />
          <InfoField label="Platform" value="ANBAR Inventory & Sales Core" />
        </CardContent>
      </Card>

      {/* Account section */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Hesab
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Sistemdən çıxış</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hesabınızdan çıxış edib giriş səhifəsinə yönləndiriləcəksiniz.
              </p>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="gap-2 shrink-0">
              <LogOut className="h-4 w-4" />
              Çıxış
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
