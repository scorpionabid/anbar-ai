"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { 
  LayoutDashboard, 
  Boxes, 
  Package, 
  Warehouse, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    href: "/dashboard/products",
    label: "Products",
    icon: Package,
  },
  {
    href: "/dashboard/warehouses",
    label: "Warehouses",
    icon: Warehouse,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  function handleLogout() {
    logout();
    localStorage.removeItem("access_token");
    router.push("/login");
  }

  return (
    <aside 
      className={cn(
        "bg-gray-900 text-white flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-gray-800",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!isSidebarCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-lg font-bold tracking-tight text-blue-500 truncate">ANBAR</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold truncate">Inventory Core</span>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="w-full flex justify-center">
            <span className="text-xl font-bold text-blue-500">A</span>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
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
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-blue-600/10 text-blue-500"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
              )}
            >
              <Icon size={20} className={cn("shrink-0", isActive && "text-blue-500")} />
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        {user && (
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-gray-800/30",
            isSidebarCollapsed ? "justify-center" : "px-3"
          )}>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">{user.email[0].toUpperCase()}</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-gray-200 truncate">{user.full_name || "User"}</span>
                <span className="text-[10px] text-gray-500 truncate">{user.email}</span>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all",
            isSidebarCollapsed && "justify-center"
          )}
          title={isSidebarCollapsed ? "Sign out" : ""}
        >
          <LogOut size={20} className="shrink-0" />
          {!isSidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

