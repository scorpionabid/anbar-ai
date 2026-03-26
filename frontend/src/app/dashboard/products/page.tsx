"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const perPage = 20;
  const { data, isLoading, isError } = useProducts(page, perPage);

  const totalPages = data ? Math.ceil(data.total / perPage) : 1;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.total} total products` : "Loading..."}
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left font-medium text-gray-500">SKU</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Variants</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Price range</th>
              <th className="px-5 py-3 text-center font-medium text-gray-500">Status</th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                  Loading products...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-red-500">
                  Failed to load products.
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                  No products found.
                </td>
              </tr>
            )}
            {(data?.data ?? []).map((product) => {
              const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
              const minPrice = prices.length > 0 ? Math.min(...prices) : null;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
              const priceLabel =
                minPrice === null
                  ? "—"
                  : minPrice === maxPrice
                  ? `$${minPrice.toFixed(2)}`
                  : `$${minPrice.toFixed(2)} – $${maxPrice!.toFixed(2)}`;

              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{product.sku}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{product.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {product.variants.length}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{priceLabel}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      product.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-gray-400">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
