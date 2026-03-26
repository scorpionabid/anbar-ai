export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">ANBAR</h1>
        <p className="mt-2 text-gray-500">Inventory & Sales Core Platform</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Dashboard
        </a>
      </div>
    </main>
  );
}
