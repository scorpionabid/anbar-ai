"use client";

import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useWarehouses } from "@/hooks/useWarehouses";

export default function InventoryPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const inventory = useInventory(warehouseFilter || undefined);
  const warehouses = useWarehouses();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {inventory.data ? `${inventory.data.length} positions` : "Loading..."}
          </p>
        </div>
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Warehouses</option>
          {(warehouses.data ?? []).map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left font-medium text-gray-500">SKU</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Variant</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Warehouse</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">On Hand</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Reserved</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Available</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Incoming</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inventory.isLoading && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                  Loading inventory...
                </td>
              </tr>
            )}
            {inventory.isError && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-red-500">
                  Failed to load inventory.
                </td>
              </tr>
            )}
            {!inventory.isLoading && inventory.data?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                  No inventory records found.
                </td>
              </tr>
            )}
            {(inventory.data ?? []).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{item.variant.sku}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{item.variant.name}</td>
                <td className="px-5 py-3 text-gray-600">{item.warehouse.name}</td>
                <td className="px-5 py-3 text-right text-gray-700">{item.quantity.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-orange-600">{item.reserved_quantity.toLocaleString()}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`font-semibold ${item.available === 0 ? "text-red-600" : item.available < 10 ? "text-orange-500" : "text-green-600"}`}>
                    {item.available.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-blue-600">{item.incoming_quantity.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-xs text-gray-400">
                  {new Date(item.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
