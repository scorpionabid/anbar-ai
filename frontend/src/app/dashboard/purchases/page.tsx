"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import PurchaseOrdersPage from "@/app/dashboard/purchase-orders/page";
import SuppliersPage from "@/app/dashboard/suppliers/page";

const TABS = [
  { id: "orders",    label: "Satınalmalar" },
  { id: "suppliers", label: "Təchizatçılar" },
];

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 pt-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === "orders"    && <PurchaseOrdersPage />}
      {activeTab === "suppliers" && <SuppliersPage />}
    </div>
  );
}
