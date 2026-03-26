"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-40">
        <span className="text-lg font-bold text-blue-500">ANBAR</span>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Content */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-80 bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 shrink-0">
          <span className="text-xl font-bold text-blue-500">ANBAR</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
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
                        "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </div>
  );
}
