"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import OrdersPage from "@/app/dashboard/orders/page";
import CustomersPage from "@/app/dashboard/customers/page";
import PaymentsPage from "@/app/dashboard/payments/page";
import ChannelsPage from "@/app/dashboard/channels/page";

const TABS = [
  { id: "orders",    label: "Sifarişlər" },
  { id: "customers", label: "Müştərilər" },
  { id: "payments",  label: "Ödənişlər" },
  { id: "channels",  label: "Kanallar" },
];

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 pt-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === "orders"    && <OrdersPage />}
      {activeTab === "customers" && <CustomersPage />}
      {activeTab === "payments"  && <PaymentsPage />}
      {activeTab === "channels"  && <ChannelsPage />}
    </div>
  );
}
