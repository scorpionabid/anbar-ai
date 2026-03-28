"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Users,
  Building2,
  Bot,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Plus,
  Pencil,
  UserX,
  Lock,
  Shield,
  Trash2,
  Bell,
  Webhook,
  Activity,
  Package,
  ShoppingCart,
  Truck,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useUsers } from "@/hooks/useUsers";
import {
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useUpdateProfile,
} from "@/hooks/useUserMutations";
import { useSettings, useSettingsMutation } from "@/hooks/useSettings";
import { useAIKeys, useAIKeyMutation, useAIKeyDelete } from "@/hooks/useAIKeys";
import { useNotifications, useNotificationsMutation } from "@/hooks/useNotifications";
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook } from "@/hooks/useWebhooks";
import { useActivity } from "@/hooks/useActivity";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import type {
  UserRole,
  UserRead,
  TenantSettings,
  AIProvider,
  AIKeyRead,
  NotificationSettings,
  WebhookRead,
  WebhookCreate,
  WebhookEvent,
  ActivityItem,
  ActivityType,
} from "@/types/api";

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "profil",     label: "Profilim" },
  { id: "users",      label: "İstifadəçilər" },
  { id: "sirket",     label: "Şirkət" },
  { id: "ai",         label: "AI & İnteqrasiyalar" },
  { id: "bildirish",  label: "Bildirişlər" },
  { id: "aktivlik",   label: "Aktivlik" },
  { id: "webhooks",   label: "Webhooks" },
];

// ── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  warehouse_manager: "Anbar Meneceri",
  sales_manager: "Satış Meneceri",
  operator: "Operator",
  vendor: "Vendor",
};

type RoleBadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const ROLE_BADGE: Record<UserRole, { variant: RoleBadgeVariant; className: string }> = {
  super_admin: { variant: "destructive", className: "" },
  org_admin: { variant: "default", className: "bg-purple-500/15 text-purple-600 border-transparent" },
  warehouse_manager: { variant: "default", className: "bg-blue-500/15 text-blue-600 border-transparent" },
  sales_manager: { variant: "success", className: "" },
  operator: { variant: "secondary", className: "" },
  vendor: { variant: "warning", className: "" },
};

const ALL_ROLES: UserRole[] = [
  "super_admin",
  "org_admin",
  "warehouse_manager",
  "sales_manager",
  "operator",
  "vendor",
];

// ── AI provider definitions ───────────────────────────────────────────────────

interface AIProviderDef {
  id: AIProvider;
  name: string;
  description: string;
  models: string[];
  color: string;
  badge: string;
}

const AI_PROVIDERS: AIProviderDef[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4 Turbo",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    color: "from-green-500/10 to-emerald-500/10",
    badge: "bg-green-500/10 text-green-600",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude Opus 4.6, Sonnet 4.6",
    models: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    color: "from-orange-500/10 to-amber-500/10",
    badge: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 1.5 Pro, Flash",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
    color: "from-blue-500/10 to-cyan-500/10",
    badge: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Mistral Large, Small",
    models: ["mistral-large-latest", "mistral-small-latest"],
    color: "from-purple-500/10 to-violet-500/10",
    badge: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "azure_openai",
    name: "Azure OpenAI",
    description: "Enterprise GPT deployment",
    models: [],
    color: "from-sky-500/10 to-blue-500/10",
    badge: "bg-sky-500/10 text-sky-600",
  },
];

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/50">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonField() {
  return <div className="h-11 bg-secondary/60 rounded-xl animate-pulse" />;
}

// ── Tab 1: Profilim ───────────────────────────────────────────────────────────

function ProfilTab() {
  const user = useAuthStore((s) => s.user);
  const { mutateAsync, isPending } = useUpdateProfile();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync when user object updates (e.g. after fetchUser)
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

    // Validation
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
            {/* Full name */}
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

            {/* Email */}
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

            {/* Role badge — read-only */}
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

            {/* Separator */}
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

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-lg px-3 py-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Profil yeniləndi
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saxlanılır..." : "Yadda saxla"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 2: İstifadəçilər ──────────────────────────────────────────────────────

interface UserCreateForm {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface UserEditForm {
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

function UsersTab() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role as UserRole | undefined;
  const isAdmin = userRole === "org_admin" || userRole === "super_admin";

  const { data: users, isLoading, isError } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<UserCreateForm>({
    full_name: "",
    email: "",
    password: "",
    role: "operator",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<UserRead | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm>({
    full_name: "",
    role: "operator",
    is_active: true,
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate confirmation
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl">
        <Card glass>
          <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
            <Lock className="h-12 w-12 text-muted-foreground opacity-40" />
            <div>
              <p className="text-lg font-bold text-foreground">Giriş Qadağandır</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bu bölməyə yalnız Org Admin və Super Admin daxil ola bilər.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function openCreate() {
    setCreateForm({ full_name: "", email: "", password: "", role: "operator" });
    setCreateError(null);
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreateError(null);
  }

  function openEdit(u: UserRead) {
    setEditTarget(u);
    setEditForm({ full_name: u.full_name, role: u.role, is_active: u.is_active });
    setEditError(null);
  }

  function closeEdit() {
    setEditTarget(null);
    setEditError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.full_name.trim()) { setCreateError("Ad Soyad mütləqdir."); return; }
    if (!createForm.email.trim()) { setCreateError("E-poçt mütləqdir."); return; }
    if (createForm.password.length < 8) { setCreateError("Şifrə ən azı 8 simvol olmalıdır."); return; }
    try {
      await createUser.mutateAsync({
        full_name: createForm.full_name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      closeCreate();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);
    if (!editForm.full_name.trim()) { setEditError("Ad Soyad mütləqdir."); return; }
    try {
      await updateUser.mutateAsync({
        id: editTarget.id,
        payload: {
          full_name: editForm.full_name.trim(),
          role: editForm.role,
          is_active: editForm.is_active,
        },
      });
      closeEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateUser.mutateAsync(id);
      setDeactivatingId(null);
    } catch {
      // silently fail
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            İstifadəçilər
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Yüklənir..." : `${users?.length ?? 0} istifadəçi mövcuddur`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni İstifadəçi
        </Button>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["Ad / E-poçt", "Rol", "Status", "Əməliyyatlar"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
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
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-destructive">
                      İstifadəçilər yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && (users?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      İstifadəçi tapılmadı
                    </td>
                  </tr>
                )}
                {(users ?? []).map((u) => {
                  const rb = ROLE_BADGE[u.role];
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0"
                    >
                      {/* Name + Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {u.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {u.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <Badge variant={rb.variant} className={rb.className}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={u.is_active ? "success" : "destructive"}>
                          {u.is_active ? "Aktiv" : "Deaktiv"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        {deactivatingId === u.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Əminsiniz?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeactivate(u.id)}
                              disabled={deactivateUser.isPending}
                            >
                              Bəli
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeactivatingId(null)}
                            >
                              Xeyr
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(u)}
                              aria-label="Düzəlt"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {u.is_active && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeactivatingId(u.id)}
                                aria-label="Deaktiv et"
                                className="text-destructive hover:text-destructive"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Yeni İstifadəçi"
        description="Yeni istifadəçi yaratmaq üçün məlumatları doldurun."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ad Soyad <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ad Soyad"
              value={createForm.full_name}
              onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              E-poçt <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              placeholder="email@nümunə.com"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Şifrə <span className="text-destructive">*</span>
            </label>
            <Input
              type="password"
              placeholder="Ən azı 8 simvol"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div>
            <Select
              label="Rol"
              value={createForm.role}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))
              }
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          {createError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeCreate}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Saxlanılır..." : "Dəvət et"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editTarget !== null}
        onClose={closeEdit}
        title="İstifadəçi Redaktəsi"
        description="İstifadəçi məlumatlarını yeniləyin."
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ad Soyad <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ad Soyad"
              value={editForm.full_name}
              onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div>
            <Select
              label="Rol"
              value={editForm.role}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, role: e.target.value as UserRole }))
              }
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              label="Status"
              value={editForm.is_active ? "active" : "inactive"}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, is_active: e.target.value === "active" }))
              }
            >
              <option value="active">Aktiv</option>
              <option value="inactive">Deaktiv</option>
            </Select>
          </div>
          {editError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeEdit}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending ? "Saxlanılır..." : "Saxla"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Tab 3: Şirkət ─────────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  { value: "Asia/Baku", label: "Bakı (UTC+4)" },
  { value: "Europe/Istanbul", label: "İstanbul (UTC+3)" },
  { value: "Europe/Moscow", label: "Moskva (UTC+3)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "New York (UTC-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
];

type WeightUnitOption = "kg" | "g" | "lb" | "oz";
type DimensionUnitOption = "cm" | "m" | "in" | "ft";
type DateFormatOption = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

interface SirketFormState {
  currency: string;
  timezone: string;
  weight_unit: WeightUnitOption;
  dimension_unit: DimensionUnitOption;
  tax_rate: string;
  low_stock_threshold: string;
  date_format: DateFormatOption;
}

function SirketTab() {
  const { data: settings, isLoading } = useSettings();
  const { mutateAsync, isPending } = useSettingsMutation();

  const [form, setForm] = useState<SirketFormState>({
    currency: "AZN",
    timezone: "Asia/Baku",
    weight_unit: "kg",
    dimension_unit: "cm",
    tax_rate: "18",
    low_stock_threshold: "5",
    date_format: "DD.MM.YYYY",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        currency: settings.currency,
        timezone: settings.timezone,
        weight_unit: settings.weight_unit as WeightUnitOption,
        dimension_unit: settings.dimension_unit as DimensionUnitOption,
        tax_rate: String(settings.tax_rate),
        low_stock_threshold: String(settings.low_stock_threshold),
        date_format: settings.date_format as DateFormatOption,
      });
    }
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const payload: Partial<TenantSettings> = {
        currency: form.currency.toUpperCase(),
        timezone: form.timezone,
        weight_unit: form.weight_unit,
        dimension_unit: form.dimension_unit,
        tax_rate: parseFloat(form.tax_rate),
        low_stock_threshold: parseInt(form.low_stock_threshold, 10),
        date_format: form.date_format,
      };
      await mutateAsync(payload);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">Şirkət</h2>
        <p className="text-muted-foreground font-medium mt-1">
          Şirkətə aid sistem parametrlərini idarə edin.
        </p>
      </div>

      <Card glass>
        <CardContent className="p-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-32 bg-secondary/60 rounded-lg animate-pulse" />
                  <SkeletonField />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Valyuta (məs. AZN, USD, EUR)
                  </label>
                  <Input
                    value={form.currency}
                    maxLength={3}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))
                    }
                    placeholder="AZN"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <Select
                    label="Vaxt Zonası"
                    value={form.timezone}
                    onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Weight unit */}
                <div>
                  <Select
                    label="Çəki Vahidi"
                    value={form.weight_unit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, weight_unit: e.target.value as WeightUnitOption }))
                    }
                  >
                    {(["kg", "g", "lb", "oz"] as WeightUnitOption[]).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Dimension unit */}
                <div>
                  <Select
                    label="Ölçü Vahidi"
                    value={form.dimension_unit}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        dimension_unit: e.target.value as DimensionUnitOption,
                      }))
                    }
                  >
                    {(["cm", "m", "in", "ft"] as DimensionUnitOption[]).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Tax rate */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    ƏDV Faizi (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.tax_rate}
                    onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))}
                    placeholder="18"
                  />
                </div>

                {/* Low stock threshold */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Minimum Stok Xəbərdarlığı
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.low_stock_threshold}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))
                    }
                    placeholder="5"
                  />
                </div>

                {/* Date format */}
                <div>
                  <Select
                    label="Tarix Formatı"
                    value={form.date_format}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        date_format: e.target.value as DateFormatOption,
                      }))
                    }
                  >
                    {(["DD.MM.YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as DateFormatOption[]).map(
                      (fmt) => (
                        <option key={fmt} value={fmt}>
                          {fmt}
                        </option>
                      )
                    )}
                  </Select>
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
                  Parametrlər yadda saxlandı
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saxlanılır..." : "Yadda saxla"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 4: AI & İnteqrasiyalar ────────────────────────────────────────────────

interface AIKeyModalState {
  open: boolean;
  provider: AIProviderDef | null;
}

function AITab() {
  const { data: aiKeys, isLoading } = useAIKeys();
  const aiKeyMutation = useAIKeyMutation();
  const aiKeyDelete = useAIKeyDelete();

  const [modal, setModal] = useState<AIKeyModalState>({ open: false, provider: null });
  const [apiKey, setApiKey] = useState("");
  const [modelOverride, setModelOverride] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<AIProvider | null>(null);

  function openModal(providerDef: AIProviderDef) {
    setModal({ open: true, provider: providerDef });
    setApiKey("");
    setModelOverride("");
    setShowKey(false);
    setModalError(null);
  }

  function closeModal() {
    setModal({ open: false, provider: null });
    setModalError(null);
  }

  function getKeyForProvider(providerId: AIProvider): AIKeyRead | undefined {
    return aiKeys?.find((k) => k.provider === providerId);
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!modal.provider) return;
    setModalError(null);
    if (!apiKey.trim()) {
      setModalError("API açarı mütləqdir.");
      return;
    }
    try {
      await aiKeyMutation.mutateAsync({
        provider: modal.provider.id,
        api_key: apiKey.trim(),
        model_override: modelOverride.trim() || null,
      });
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete(provider: AIProvider) {
    try {
      await aiKeyDelete.mutateAsync(provider);
      setConfirmDeleteId(null);
    } catch {
      // silently fail
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          AI & İnteqrasiyalar
        </h2>
        <p className="text-muted-foreground font-medium mt-1">
          AI provayder API açarlarını idarə edin.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 bg-secondary/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AI_PROVIDERS.map((provider) => {
            const connectedKey = getKeyForProvider(provider.id);
            const isConnected = !!connectedKey;

            return (
              <Card
                key={provider.id}
                glass
                className={`bg-gradient-to-br ${provider.color} transition-all duration-200`}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${provider.badge} shrink-0`}>
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">{provider.description}</p>
                      </div>
                    </div>

                    {/* Connection status badge */}
                    {isConnected ? (
                      <Badge variant="success" className="shrink-0 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Qoşulub
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        <XCircle className="h-3 w-3" />
                        Qoşulmayıb
                      </Badge>
                    )}
                  </div>

                  {/* Key preview if connected */}
                  {isConnected && connectedKey && (
                    <div className="bg-background/50 rounded-xl px-3 py-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-mono text-muted-foreground">
                          {connectedKey.key_preview}
                        </span>
                      </div>
                      {connectedKey.model_override && (
                        <div className="flex items-center gap-2">
                          <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            Model: {connectedKey.model_override}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(provider)}
                      className="gap-1.5 flex-1"
                    >
                      <Key className="h-3.5 w-3.5" />
                      {isConnected ? "Yenilə" : "Açar əlavə et"}
                    </Button>

                    {isConnected && (
                      <>
                        {confirmDeleteId === provider.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(provider.id)}
                              disabled={aiKeyDelete.isPending}
                            >
                              Bəli
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Xeyr
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(provider.id)}
                            aria-label="Sil"
                            className="text-destructive hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit API Key Modal */}
      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.provider ? `${modal.provider.name} API Açarı` : "API Açarı"}
        description="API açarınızı daxil edin. Açar şifrəli saxlanılır."
      >
        <form onSubmit={handleSaveKey} className="space-y-4">
          {/* API Key field with show/hide toggle */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              API Açarı <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? "Gizlət" : "Göstər"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Model override */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Model (ixtiyari)
            </label>
            {modal.provider && modal.provider.models.length > 0 ? (
              <Select
                value={modelOverride}
                onChange={(e) => setModelOverride(e.target.value)}
              >
                <option value="">Default model istifadə et</option>
                {modal.provider.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={modelOverride}
                onChange={(e) => setModelOverride(e.target.value)}
                placeholder="Default model istifadə et"
              />
            )}
          </div>

          {modalError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {modalError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={aiKeyMutation.isPending}>
              {aiKeyMutation.isPending ? "Saxlanılır..." : "Saxla"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Bildiriş Tab ─────────────────────────────────────────────────────────────

function BildirishtTab() {
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

  function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
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
              <p className="text-sm text-green-600 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> Parametrlər yadda saxlandı
              </p>
            )}
            {mutation.isError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {mutation.error instanceof Error ? mutation.error.message : "Xəta baş verdi"}
              </p>
            )}

            <div className="flex justify-end pt-2">
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

// ── Aktivlik Tab ──────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "indicə";
  if (mins < 60) return `${mins} dəq əvvəl`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  const days = Math.floor(hours / 24);
  return `${days} gün əvvəl`;
}

function activityIcon(type: ActivityType) {
  if (type === "stock_movement") return <Package className="h-4 w-4 text-blue-500" />;
  if (type === "order") return <ShoppingCart className="h-4 w-4 text-green-500" />;
  if (type === "purchase_order") return <Truck className="h-4 w-4 text-orange-500" />;
  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  stock_movement: "Stok",
  order: "Sifariş",
  purchase_order: "Alış",
  user: "İstifadəçi",
};

function AktivlikTab() {
  const activity = useActivity();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Activity className="h-7 w-7 text-primary" /> Son Aktivlik
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          {activity.isLoading ? "Yüklənir..." : `Son ${activity.data?.length ?? 0} fəaliyyət`}
        </p>
      </div>

      <Card glass>
        <CardContent className="p-0">
          {activity.isLoading && (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-secondary/60 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-secondary/60 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-secondary/40 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {activity.isError && (
            <div className="p-12 text-center text-sm text-destructive">Aktivlik yüklənərkən xəta baş verdi.</div>
          )}
          {!activity.isLoading && !activity.isError && activity.data?.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Hələ heç bir aktivlik yoxdur
            </div>
          )}
          {(activity.data ?? []).map((item: ActivityItem) => (
            <div key={item.id} className="flex items-start gap-4 px-6 py-4 border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors">
              <div className="mt-0.5 h-8 w-8 rounded-full bg-secondary/40 flex items-center justify-center flex-shrink-0">
                {activityIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.timestamp)}</p>
              </div>
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {ACTIVITY_TYPE_LABELS[item.type]}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Webhooks Tab ──────────────────────────────────────────────────────────────

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: "order.created",          label: "Sifariş yaradıldı" },
  { value: "order.status_changed",   label: "Sifariş statusu dəyişdi" },
  { value: "inventory.low_stock",    label: "Aşağı stok" },
  { value: "payment.received",       label: "Ödəniş alındı" },
  { value: "purchase_order.created", label: "Alış sifarişi yaradıldı" },
];

const emptyWebhookForm: WebhookCreate = { url: "", events: [], secret: "", description: "" };

function WebhooksTab() {
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

// ── Page Shell ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profil");

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky tab bar */}
      <div className="px-8 pt-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      {activeTab === "profil"    && <ProfilTab />}
      {activeTab === "users"     && <UsersTab />}
      {activeTab === "sirket"    && <SirketTab />}
      {activeTab === "ai"        && <AITab />}
      {activeTab === "bildirish" && <BildirishtTab />}
      {activeTab === "aktivlik"  && <AktivlikTab />}
      {activeTab === "webhooks"  && <WebhooksTab />}
    </div>
  );
}
