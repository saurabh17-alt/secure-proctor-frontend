import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Secure Proctor - Admin</h1>
          <nav className="space-x-4">
            <Link to="/admin" className="hover:text-blue-200">
              Dashboard
            </Link>
            <Link to="/admin/exams" className="hover:text-blue-200">
              Exams
            </Link>
            <Link to="/admin/candidates" className="hover:text-blue-200">
              Candidates
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
