"use client";

import { useState } from "react";
import { Plus, Pencil, UserX, Trash2, Lock, Users, Shield, Search } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/hooks/usePermissions";
import { useUsers } from "@/hooks/useUsers";
import {
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useHardDeleteUser,
} from "@/hooks/useUserMutations";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { 
  ROLE_LABELS, 
  ROLE_BADGE, 
  ALL_ROLES, 
  PERMISSION_LABELS, 
  DEFAULT_ROLE_PERMISSIONS 
} from "./constants";
import type { 
  UserRole, 
  Permission, 
  UserRead 
} from "@/types/api";

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

// ── Types ────────────────────────────────────────────────────────────────────

interface UserCreateForm {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: Permission[];
}

interface UserEditForm {
  full_name: string;
  role: UserRole;
  permissions: Permission[];
  is_active: boolean;
}

export function UsersTab() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role as UserRole | undefined;
  const isAdmin = userRole === "org_admin" || userRole === "super_admin";

  const { data: users, isLoading, isError } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const hardDeleteUser = useHardDeleteUser();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<UserCreateForm>({
    full_name: "",
    email: "",
    password: "",
    role: "operator",
    permissions: DEFAULT_ROLE_PERMISSIONS["operator"],
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<UserRead | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm>({
    full_name: "",
    role: "operator",
    permissions: [],
    is_active: true,
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate confirmation
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);

  // Hard Delete confirmation
  const [confirmHardDeleteId, setConfirmHardDeleteId] = useState<string | null>(null);

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
    setCreateForm({ 
      full_name: "", 
      email: "", 
      password: "", 
      role: "operator",
      permissions: DEFAULT_ROLE_PERMISSIONS["operator"]
    });
    setCreateError(null);
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreateError(null);
  }

  function openEdit(u: UserRead) {
    setEditTarget(u);
    setEditForm({ 
      full_name: u.full_name, 
      role: u.role, 
      permissions: u.permissions || [],
      is_active: u.is_active 
    });
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
        permissions: createForm.permissions,
      });
      closeCreate();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  function togglePermission(form: "create" | "edit", p: Permission) {
    if (form === "create") {
      setCreateForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(p)
          ? prev.permissions.filter(x => x !== p)
          : [...prev.permissions, p]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(p)
          ? prev.permissions.filter(x => x !== p)
          : [...prev.permissions, p]
      }));
    }
  }

  function handleRoleChange(form: "create" | "edit", role: UserRole) {
    if (form === "create") {
      setCreateForm(prev => ({
        ...prev,
        role,
        permissions: DEFAULT_ROLE_PERMISSIONS[role]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        role,
        permissions: DEFAULT_ROLE_PERMISSIONS[role]
      }));
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
          permissions: editForm.permissions as Permission[],
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
      setConfirmDeactivateId(null);
    } catch {
      // silently fail
    }
  }

  async function handleHardDelete(id: string) {
    try {
      await hardDeleteUser.mutateAsync(id);
      setConfirmHardDeleteId(null);
    } catch {
      // silently fail
    }
  }

  const filteredUsers = (users ?? []).filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            İstifadəçilər
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading ? "Yüklənir..." : `${users?.length ?? 0} istifadəçi mövcuddur`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Axtar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[200px] md:w-[300px]"
            />
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Yeni İstifadəçi</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {["Ad / E-poçt", "Rol / İcazələr", "Status", "Əməliyyatlar"].map((h) => (
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
                {!isLoading && !isError && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      İstifadəçi tapılmadı
                    </td>
                  </tr>
                )}
                {filteredUsers.map((u) => {
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
                        <div className="flex flex-col gap-1.5">
                          <Badge variant={rb.variant} className={rb.className}>
                            {ROLE_LABELS[u.role]}
                          </Badge>
                          {u.permissions && u.permissions.length > 0 && (
                            <p className="text-[10px] text-muted-foreground font-medium flex flex-wrap gap-1">
                              {u.permissions.slice(0, 3).map(p => (
                                <span key={p} className="bg-secondary px-1 rounded truncate max-w-[80px]">
                                  {PERMISSION_LABELS[p]}
                                </span>
                              ))}
                              {u.permissions.length > 3 && <span>+{u.permissions.length - 3}</span>}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={u.is_active ? "success" : "destructive"}>
                          {u.is_active ? "Aktiv" : "Deaktiv"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {confirmDeactivateId === u.id || confirmHardDeleteId === u.id ? (
                          <div className="flex flex-col items-end gap-2 animate-in fade-in zoom-in duration-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                              {confirmHardDeleteId === u.id ? "Daimi silünsün?" : "Deaktiv edilsin?"}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => confirmHardDeleteId === u.id ? handleHardDelete(u.id) : handleDeactivate(u.id)}
                                disabled={deactivateUser.isPending || hardDeleteUser.isPending}
                                className="h-7 px-3 text-[11px]"
                              >
                                {hardDeleteUser.isPending || deactivateUser.isPending ? "..." : "Bəli"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setConfirmDeactivateId(null); setConfirmHardDeleteId(null); }}
                                className="h-7 px-3 text-[11px]"
                              >
                                Xeyr
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(u)}
                              aria-label="Düzəlt"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {u.is_active && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirmDeactivateId(u.id)}
                                title="Deaktiv et"
                                className="h-8 w-8 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-lg"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setConfirmHardDeleteId(u.id)}
                              title="Daimi sil"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                handleRoleChange("create", e.target.value as UserRole)
              }
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              İcazələr (Rola görə təyin edilib)
            </label>
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-border/50 bg-secondary/20">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`create-perm-${key}`}
                    checked={createForm.permissions.includes(key as Permission)}
                    onChange={() => togglePermission("create", key as Permission)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor={`create-perm-${key}`} className="text-xs font-medium cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
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

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-3 w-3" /> Fərdi İcazələr
            </label>
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-border/50 bg-secondary/20 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edit-perm-${key}`}
                    checked={editForm.permissions.includes(key as Permission)}
                    onChange={() => togglePermission("edit", key as Permission)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor={`edit-perm-${key}`} className="text-xs font-medium cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              * Rola uyğun gəlməyən xüsusi icazələr vermək mümkündür.
            </p>
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
