"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/types/api";
import {
  LayoutDashboard,
  Boxes,
  Package,
  Truck,
  ShoppingCart,
  Users,
  Radio,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems: {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: Permission;
}[] = [
  { href: "/dashboard",              label: "Lövhə",      icon: LayoutDashboard },
  { href: "/dashboard/catalog",      label: "Kataloq",    icon: Package,      permission: "inventory:read" },
  { href: "/dashboard/inventory",    label: "Anbar",      icon: Boxes,        permission: "inventory:read" },
  { href: "/dashboard/purchases",    label: "Alışlar",    icon: Truck,        permission: "orders:read" },
  { href: "/dashboard/sales",        label: "Satış",      icon: ShoppingCart, permission: "orders:read" },
  { href: "/dashboard/customers",    label: "Müştərilər", icon: Users,        permission: "customers:read" },
  { href: "/dashboard/channels",     label: "Kanallar",   icon: Radio,        permission: "channels:manage" },
  { href: "/dashboard/settings",     label: "Ayarlar",    icon: Settings,     permission: "settings:manage" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { can } = usePermissions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!mounted) {
    return <aside className="w-64 bg-background border-r" />;
  }

  return (
    <aside 
      className={cn(
        "bg-background text-foreground flex flex-col shrink-0 transition-all duration-500 ease-in-out border-r h-full overflow-hidden relative z-40",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-full bg-primary/5 pointer-events-none" />

      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b shrink-0 relative z-10">
        {!isSidebarCollapsed && (
          <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              ANBAR
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
              Inventory Core
            </span>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="w-full flex justify-center animate-in fade-in zoom-in duration-300">
            <span className="text-2xl font-black text-primary">A</span>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent hover:border-border"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
        {navItems
          .filter((item) => !item.permission || can(item.permission))
          .map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isSidebarCollapsed ? item.label : ""}
                className={cn(
                  "group flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon size={18} className={cn("shrink-0 transition-transform duration-300 group-hover:scale-110", isActive && "text-primary-foreground")} />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!isActive && (
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </Link>
            );
          })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t space-y-3 shrink-0 relative z-10">
        {user && (
          <div className={cn(
            "flex items-center gap-3 p-2.5 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700",
            isSidebarCollapsed ? "justify-center" : "bg-secondary/30 border border-border/5 pr-4"
          )}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-sm font-bold text-white shadow-sm">{user.email[0].toUpperCase()}</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">{user.full_name || "User"}</span>
                <span className="text-[10px] text-muted-foreground truncate font-medium">{user.email}</span>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all duration-300",
            isSidebarCollapsed && "justify-center"
          )}
          title={isSidebarCollapsed ? "Sign out" : ""}
        >
          <LogOut size={16} className="shrink-0" />
          {!isSidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}



