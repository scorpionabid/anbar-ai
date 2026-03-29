"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import PurchaseOrdersPage from "@/app/dashboard/purchase-orders/page";
import SuppliersPage from "@/app/dashboard/suppliers/page";

const TABS = [
  { id: "orders",    label: "Satınalmalar" },
  { id: "suppliers", label: "Təchizatçılar" },
];

export default function PurchasesPageWrapper() {
  return (
    <ProtectedRoute permission="inventory:read">
      <PurchasesPageContent />
    </ProtectedRoute>
  );
}

function PurchasesPageContent() {
  const [activeTab, setActiveTab] = useState("orders");

  const handleTabChange = (tab: string) => {
    console.log("[PurchasesPage] Switching tab to:", tab);
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 pt-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      {activeTab === "orders"    && <PurchaseOrdersPage />}
      {activeTab === "suppliers" && <SuppliersPage />}
    </div>
  );
}
