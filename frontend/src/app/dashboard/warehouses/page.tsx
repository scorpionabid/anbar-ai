"use client";

import { useWarehouses } from "@/hooks/useWarehouses";

export default function WarehousesPage() {
  const { data, isLoading, isError } = useWarehouses();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.length} warehouse${data.length !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Address</th>
              <th className="px-5 py-3 text-center font-medium text-gray-500">Status</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                  Loading warehouses...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-red-500">
                  Failed to load warehouses.
                </td>
              </tr>
            )}
            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                  No warehouses found.
                </td>
              </tr>
            )}
            {(data ?? []).map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-800">{w.name}</td>
                <td className="px-5 py-3 text-gray-500">{w.address ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    w.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {w.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-xs text-gray-400">
                  {new Date(w.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
