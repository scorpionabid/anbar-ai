import { useAuthStore } from "@/stores/authStore";
import type { Permission } from "@/types/api";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const isSuperAdmin = user?.role === "super_admin";

  // Tək permission yoxla — super_admin hər şeyi keçir
  function can(permission: Permission): boolean {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return (user.permissions as Permission[]).includes(permission);
  }

  // Ən azı birini yoxla
  function canAny(permissions: Permission[]): boolean {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return permissions.some((p) => (user.permissions as Permission[]).includes(p));
  }

  // Hamısını yoxla
  function canAll(permissions: Permission[]): boolean {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return permissions.every((p) => (user.permissions as Permission[]).includes(p));
  }

  // Role yoxla (birdən çox ola bilər)
  function hasRole(...roles: string[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  return { can, canAny, canAll, hasRole, isSuperAdmin };
}
