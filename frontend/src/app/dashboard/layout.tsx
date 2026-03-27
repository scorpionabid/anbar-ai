"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.push("/login");
    }
  }, [_hasHydrated, accessToken, router]);

  if (!isClient || !_hasHydrated) return null;
  if (!accessToken) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-secondary/20 p-6 md:p-8 animate-in fade-in duration-700">
          {children}
        </main>
      </div>
    </div>
  );
}
