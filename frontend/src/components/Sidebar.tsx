"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  FolderTree,
  Truck,
  History,
  ClipboardList,
  Users,
  CreditCard,
  Share2,
  Factory,
  Settings
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navGroups = [
  {
    title: "İcmal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Kataloq",
    items: [
      { href: "/dashboard/products", label: "Məhsullar", icon: Package },
      { href: "/dashboard/categories", label: "Kateqoriyalar", icon: FolderTree },
    ],
  },
  {
    title: "Anbar & Logistika",
    items: [
      { href: "/dashboard/inventory", label: "Stok Səviyyələri", icon: Boxes },
      { href: "/dashboard/warehouses", label: "Anbarlar", icon: Warehouse },
      { href: "/dashboard/purchase-orders", label: "Alış Sifarişləri", icon: Truck },
      { href: "/dashboard/inventory/movements", label: "Stok Hərəkətləri", icon: History },
    ],
  },
  {
    title: "Satış",
    items: [
      { href: "/dashboard/orders", label: "Sifarişlər", icon: ClipboardList },
      { href: "/dashboard/customers", label: "Müştərilər", icon: Users },
      { href: "/dashboard/payments", label: "Ödənişlər", icon: CreditCard },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/dashboard/channels", label: "Satış Kanalları", icon: Share2 },
      { href: "/dashboard/suppliers", label: "Təchizatçılar", icon: Factory },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/dashboard/settings", label: "Tənzimləmələr", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s: any) => s.logout);
  const user = useAuthStore((s: any) => s.user);
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!mounted) {
    return <aside className="w-64 bg-gray-900 border-r border-gray-800" />;
  }

  return (
    <aside 
      className={cn(
        "bg-gray-900 text-white flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-gray-800 h-full overflow-hidden",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
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
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {!isSidebarCollapsed && (
              <h3 className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
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
                      "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative",
                      isActive
                        ? "bg-blue-600/10 text-blue-500"
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                    )}
                  >
                    <Icon size={18} className={cn("shrink-0", isActive && "text-blue-500")} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full" />
                    )}
                  </Link>
                );
              })}
            </div>
            {groupIdx < navGroups.length - 1 && isSidebarCollapsed && (
              <div className="mx-4 border-t border-gray-800/50 my-4" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-gray-800 space-y-2 shrink-0">
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
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all",
            isSidebarCollapsed && "justify-center"
          )}
          title={isSidebarCollapsed ? "Sign out" : ""}
        >
          <LogOut size={18} className="shrink-0" />
          {!isSidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}



