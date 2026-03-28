"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import ProductsPage from "@/app/dashboard/products/page";
import CategoriesPage from "@/app/dashboard/categories/page";

const TABS = [
  { id: "products",    label: "Məhsullar" },
  { id: "categories", label: "Kateqoriyalar" },
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-8 pt-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === "products"    && <ProductsPage />}
      {activeTab === "categories"  && <CategoriesPage />}
    </div>
  );
}
