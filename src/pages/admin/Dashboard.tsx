import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Exams</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">
              Active Candidates
            </h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/admin/violations"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg p-6 transition-all transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  📸 Violations Report
                </h3>
                <p className="text-blue-100">
                  View all captured violations with images
                </p>
              </div>
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">📊 Analytics</h3>
                <p className="text-purple-100">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-500">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
