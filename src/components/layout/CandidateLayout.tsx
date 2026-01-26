import { Outlet } from "react-router-dom";

export default function CandidateLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Secure Proctor</h1>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-600">
          <p>&copy; 2026 Secure Proctor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
