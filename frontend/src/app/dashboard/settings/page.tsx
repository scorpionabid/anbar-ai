"use client";

import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Tabs } from "@/components/ui/Tabs";
import type { Permission } from "@/types/api";

// Extracted Tab Components
import { ProfilTab } from "./components/ProfilTab";
import { UsersTab } from "./components/UsersTab";
import { SirketTab } from "./components/SirketTab";
import { AITab } from "./components/AITab";
import { BildirishTab } from "./components/BildirishTab";
import { AktivlikTab } from "./components/AktivlikTab";
import { WebhooksTab } from "./components/WebhooksTab";

const ALL_TABS: { id: string; label: string; permission?: Permission }[] = [
  { id: "profil",     label: "Profilim" },
  { id: "users",      label: "İstifadəçilər", permission: "users:manage" },
  { id: "sirket",     label: "Şirkət",        permission: "settings:manage" },
  { id: "ai",         label: "AI & İnteqrasiyalar", permission: "ai:manage" },
  { id: "bildirish",  label: "Bildirişlər",   permission: "settings:manage" },
  { id: "aktivlik",   label: "Aktivlik",      permission: "reports:view" },
  { id: "webhooks",   label: "Webhooks",      permission: "settings:manage" },
];

export default function SettingsPage() {
  const { can } = usePermissions();
  const visibleTabs = ALL_TABS.filter((t) => !t.permission || can(t.permission));
  const [activeTab, setActiveTab] = useState("profil");

  // If active tab is not visible, switch to first available
  useEffect(() => {
    if (!visibleTabs.find((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? "profil");
    }
  }, [visibleTabs, activeTab]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky tab bar */}
      <div className="px-8 pt-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <Tabs tabs={visibleTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content wrapper with simple fade-in effect */}
      <div className="flex-1 animate-in fade-in duration-500">
        {activeTab === "profil"    && <ProfilTab />}
        {activeTab === "users"     && <UsersTab />}
        {activeTab === "sirket"    && <SirketTab />}
        {activeTab === "ai"        && <AITab />}
        {activeTab === "bildirish" && <BildirishTab />}
        {activeTab === "aktivlik"  && <AktivlikTab />}
        {activeTab === "webhooks"  && <WebhooksTab />}
      </div>
    </div>
  );
}
