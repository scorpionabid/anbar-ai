"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const accessToken = useAuthStore((s: any) => s.accessToken);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router, mounted]);

  if (!mounted) return null;
  if (!accessToken) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Navigation */}
        <MobileNav />
        
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
