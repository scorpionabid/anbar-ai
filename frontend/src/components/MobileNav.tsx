"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Boxes, 
  Package, 
  Warehouse,
  FolderTree,
  Truck,
  History,
  ClipboardList,
  Users,
  CreditCard,
  Share2,
  Factory,
  Settings,
  LogOut
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

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

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s: any) => s.logout);
  const user = useAuthStore((s: any) => s.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLogout() {
    logout();
    setIsOpen(false);
    router.push("/login");
  }

  if (!mounted) return null;

  return (
    <div className="lg:hidden">
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Content */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-[280px] bg-background border-r z-50 transform transition-all duration-500 ease-in-out flex flex-col shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b shrink-0 bg-primary/5">
          <div className="flex flex-col">
            <span className="text-xl font-black bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">ANBAR</span>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-black">Mobile Core</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <h3 className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-70">
                {group.title}
              </h3>
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
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon size={18} className={cn(isActive && "text-primary-foreground")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t space-y-3 shrink-0 bg-secondary/10">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">{user.email[0].toUpperCase()}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">{user.full_name}</span>
                <span className="text-[10px] text-muted-foreground truncate font-medium">{user.email}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
          >
            <LogOut size={18} />
            Çıxış yap
          </button>
        </div>
      </aside>
    </div>
  );
}
