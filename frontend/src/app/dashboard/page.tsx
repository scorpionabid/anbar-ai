"use client";

import { useInventory } from "@/hooks/useInventory";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  color: string;
}

function StatCard({ title, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const inventory = useInventory();
  const products = useProducts(1, 1);
  const warehouses = useWarehouses();

  const totalAvailable = inventory.data?.reduce((sum, i) => sum + i.available, 0) ?? 0;
  const totalReserved = inventory.data?.reduce((sum, i) => sum + i.reserved_quantity, 0) ?? 0;
  const activeWarehouses = warehouses.data?.filter((w) => w.is_active).length ?? 0;
  const totalProducts = products.data?.total ?? 0;
  const inventoryPositions = inventory.data?.length ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of your inventory &amp; sales platform</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Inventory Positions"
          value={inventoryPositions}
          sub="warehouse × variant rows"
          color="text-blue-600"
        />
        <StatCard
          title="Available Stock"
          value={totalAvailable.toLocaleString()}
          sub="units available for sale"
          color="text-green-600"
        />
        <StatCard
          title="Reserved Stock"
          value={totalReserved.toLocaleString()}
          sub="units held for orders"
          color="text-orange-500"
        />
        <StatCard
          title="Products"
          value={totalProducts}
          sub={`across ${activeWarehouses} active warehouse${activeWarehouses !== 1 ? "s" : ""}`}
          color="text-purple-600"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Low Stock Alert</h2>
          {inventory.isLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-2">
              {(inventory.data ?? [])
                .filter((i) => i.available < 10)
                .slice(0, 5)
                .map((i) => (
                  <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{i.variant.name}</p>
                      <p className="text-xs text-gray-400">{i.warehouse.name} · {i.variant.sku}</p>
                    </div>
                    <span className={`text-sm font-semibold ${i.available === 0 ? "text-red-600" : "text-orange-500"}`}>
                      {i.available} left
                    </span>
                  </div>
                ))}
              {(inventory.data ?? []).filter((i) => i.available < 10).length === 0 && (
                <p className="text-sm text-gray-400">All items have sufficient stock.</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Warehouses</h2>
          {warehouses.isLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-2">
              {(warehouses.data ?? []).map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{w.name}</p>
                    {w.address && <p className="text-xs text-gray-400">{w.address}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    w.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {w.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
