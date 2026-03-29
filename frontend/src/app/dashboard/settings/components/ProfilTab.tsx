"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle, Lock, Smartphone } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useUpdateProfile } from "@/hooks/useUserMutations";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ROLE_LABELS, ROLE_BADGE } from "./constants";
import type { UserRole } from "@/types/api";

export function ProfilTab() {
  const user = useAuthStore((s) => s.user);
  const { mutateAsync, isPending } = useUpdateProfile();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword) {
      if (!currentPassword) {
        setError("Yeni şifrə daxil etmisinizsə, cari şifrəni də daxil edin.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Yeni şifrə ən azı 8 simvol olmalıdır.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Yeni şifrə ilə təsdiq şifrəsi uyğun gəlmir.");
        return;
      }
    }

    try {
      const payload: {
        full_name?: string;
        email?: string;
        current_password?: string;
        new_password?: string;
      } = {};

      if (fullName.trim() !== user?.full_name) payload.full_name = fullName.trim();
      if (email.trim() !== user?.email) payload.email = email.trim();
      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      await mutateAsync(payload);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  const userRole = user?.role as UserRole | undefined;
  const roleBadge = userRole ? ROLE_BADGE[userRole] : null;

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">Profilim</h2>
        <p className="text-muted-foreground font-medium mt-1">
          Şəxsi məlumatlarınızı və şifrənizi idarə edin.
        </p>
      </div>

      <Card glass>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ad Soyad
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                E-poçt
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@nümunə.com"
              />
            </div>

            {userRole && roleBadge && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Rol
                </label>
                <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-border/40 bg-secondary/20">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge
                    variant={roleBadge.variant}
                    className={roleBadge.className}
                  >
                    {ROLE_LABELS[userRole]}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-1">
                    (dəyişdirilə bilməz)
                  </span>
                </div>
              </div>
            )}

            <div className="border-t border-border/40 pt-2">
              <p className="text-sm font-semibold text-foreground mb-4">Şifrəni Dəyiş</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Cari şifrə
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Şifrəni dəyişmək üçün daxil edin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Yeni şifrə
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ən azı 8 simvol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Şifrəni təsdiqlə
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifrəni təkrar daxil edin"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-lg px-3 py-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Profil yeniləndi
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saxlanılır..." : "Yadda saxla"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2FA Mock-up Section */}
      <Card glass className="bg-gradient-to-br from-blue-500/5 to-purple-500/5">
        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">İki-Mərhələli Doğrulama (2FA)</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Hesabınızın təhlükəsizliyini artırmaq üçün giriş zamanı kod tələb olunmasını aktivləşdirin.
                </p>
              </div>
            </div>
            {/* Mock switch */}
            <div className="flex flex-col items-end gap-2 shrink-0">
               <button
                type="button"
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-secondary/50 transition-colors focus:outline-none cursor-not-allowed border border-border/50"
              >
                <Lock className="absolute left-1 h-3 w-3 text-muted-foreground" />
                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" />
              </button>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground border-border/50">
                Tezliklə
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
