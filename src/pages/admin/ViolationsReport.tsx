/**
 * Violations Report Page
 *
 * Displays all violations with images
 * Hover on image to see violation details
 */

import { useEffect, useState } from "react";

interface Violation {
  id: number;
  exam_id: string;
  candidate_id: string;
  violation_type: string;
  message: string;
  timestamp: number;
  created_at: string;
  image_path: string | null;
  image_url: string | null;
}

export default function ViolationsReport() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<string>("all");

  // Fetch violations
  useEffect(() => {
    const fetchViolations = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:8000/api/violations/list-all",
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setViolations(data.violations || []);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load violations",
        );
        console.error("Error loading violations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchViolations();
  }, []);

  // Get unique exams and candidates for filtering
  const exams = Array.from(new Set(violations.map((v) => v.exam_id)));
  const candidates = Array.from(new Set(violations.map((v) => v.candidate_id)));

  // Filter violations
  const filteredViolations = violations.filter((v) => {
    if (selectedExam !== "all" && v.exam_id !== selectedExam) return false;
    if (selectedCandidate !== "all" && v.candidate_id !== selectedCandidate)
      return false;
    return true;
  });

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get violation type badge color
  const getViolationColor = (type: string) => {
    switch (type) {
      case "no_face":
        return "bg-red-100 text-red-800 border-red-300";
      case "multiple_faces":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading violations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">
              Error Loading Violations
            </h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Violations Report
          </h1>
          <p className="text-gray-600">
            View all captured violations with images and details
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Exams ({exams.length})</option>
                {exams.map((exam) => (
                  <option key={exam} value={exam}>
                    {exam}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Candidate
              </label>
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">
                  All Candidates ({candidates.length})
                </option>
                {candidates.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {candidate}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Violations
              </label>
              <div className="text-3xl font-bold text-blue-600">
                {filteredViolations.length}
              </div>
            </div>
          </div>
        </div>

        {/* Violations Grid */}
        {filteredViolations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No violations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredViolations.map((violation) => (
              <div
                key={violation.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
              >
                {/* Image */}
                <div className="relative aspect-video bg-gray-200">
                  {violation.image_url ? (
                    <>
                      <img
                        src={`http://localhost:8000${violation.image_url}`}
                        alt={violation.violation_type}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay with details */}
                      <div className="absolute inset-0 bg-black bg-opacity-90 opacity-0 group-hover:opacity-100 transition-opacity p-4 overflow-y-auto">
                        <div className="text-white text-sm space-y-2">
                          <div>
                            <span className="font-semibold">Type:</span>{" "}
                            {violation.violation_type
                              .replace("_", " ")
                              .toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold">Message:</span>{" "}
                            {violation.message}
                          </div>
                          <div>
                            <span className="font-semibold">Exam:</span>{" "}
                            {violation.exam_id}
                          </div>
                          <div>
                            <span className="font-semibold">Candidate:</span>{" "}
                            {violation.candidate_id}
                          </div>
                          <div>
                            <span className="font-semibold">Time:</span>{" "}
                            {formatDate(violation.timestamp)}
                          </div>
                          <div>
                            <span className="font-semibold">Logged:</span>{" "}
                            {new Date(violation.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${getViolationColor(violation.violation_type)}`}
                  >
                    {violation.violation_type.replace("_", " ").toUpperCase()}
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono text-xs">#{violation.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exam:</span>
                      <span className="font-mono text-xs truncate max-w-[150px]">
                        {violation.exam_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="text-xs">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
