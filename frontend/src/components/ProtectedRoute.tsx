"use client";

import { type ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/types/api";
import { ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  /** Tələb olunan permission — istifadəçidə yoxdursa 403 göstərilir */
  permission?: Permission;
  /** Birdən çox permission-dan ən azı birinin olması kifayətdir */
  anyPermission?: Permission[];
  /** Bütün permission-lar olmalıdır */
  allPermissions?: Permission[];
  children: ReactNode;
}

/**
 * Route-level permission qoruyucusu.
 * Permission olmadıqda "403 Forbidden" mesajı göstərir.
 *
 * @example
 * <ProtectedRoute permission="settings:manage">
 *   <SettingsPage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({
  permission,
  anyPermission,
  allPermissions,
  children,
}: ProtectedRouteProps) {
  const { can, canAny, canAll } = usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = can(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = canAny(anyPermission);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = canAll(allPermissions);
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="text-destructive" size={40} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            İcazə Yoxdur
          </h2>
          <p className="text-muted-foreground max-w-md">
            Bu səhifəyə erişim üçün lazımi icazəniz yoxdur.
            Zəhmət olmasa administratorunuzla əlaqə saxlayın.
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-sm font-medium transition-colors"
        >
          Geri qayıt
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
