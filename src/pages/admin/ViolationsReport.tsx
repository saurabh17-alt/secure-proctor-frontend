/**
 * Violations Report Page
 *
 * Displays violation images in horizontal scrollable row
 * Shows logs in table below
 * Hover on image highlights corresponding log
 *
 * URL Parameters:
 * - ?candidateId=xxx - Filter by specific candidate
 * - ?examId=xxx - Filter by specific exam
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "../../services/api.service";
import { API_ENDPOINTS } from "../../config/api.config";

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
  const [searchParams] = useSearchParams();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<string>("all");
  const [hoveredViolationId, setHoveredViolationId] = useState<number | null>(
    null,
  );

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlCandidateId = searchParams.get("candidateId");
    const urlExamId = searchParams.get("examId");

    if (urlCandidateId) {
      setSelectedCandidate(urlCandidateId);
      console.log(`🔍 Filtering by candidate: ${urlCandidateId}`);
    }

    if (urlExamId) {
      setSelectedExam(urlExamId);
      console.log(`🔍 Filtering by exam: ${urlExamId}`);
    }
  }, [searchParams]);

  // Fetch violations
  useEffect(() => {
    const fetchViolations = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get(API_ENDPOINTS.violations.listAll);
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

          {/* URL Filter Indicator */}
          {(searchParams.get("candidateId") || searchParams.get("examId")) && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {searchParams.get("candidateId") && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Candidate: {searchParams.get("candidateId")}
                </span>
              )}
              {searchParams.get("examId") && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Exam: {searchParams.get("examId")}
                </span>
              )}
              <button
                onClick={() => (window.location.href = "/admin/violations")}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Clear Filters
              </button>
            </div>
          )}
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

        {/* Images Section - Horizontal Scrollable */}
        {filteredViolations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No violations found</p>
          </div>
        ) : (
          <>
            {/* Images Row */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📸 Captured Images (
                {filteredViolations.filter((v) => v.image_url).length})
              </h2>
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4">
                  {filteredViolations.map((violation) => (
                    <div
                      key={violation.id}
                      className={`flex-shrink-0 w-64 rounded-lg overflow-hidden border-4 transition-all cursor-pointer ${
                        hoveredViolationId === violation.id
                          ? "border-blue-500 shadow-xl scale-105"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onMouseEnter={() => setHoveredViolationId(violation.id)}
                      onMouseLeave={() => setHoveredViolationId(null)}
                    >
                      {violation.image_url ? (
                        <div className="relative">
                          <img
                            src={API_ENDPOINTS.violations.image(
                              violation.image_url || "",
                            )}
                            alt={violation.violation_type}
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            #{violation.id}
                          </div>
                          <div
                            className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${getViolationColor(violation.violation_type)}`}
                          >
                            {violation.violation_type
                              .replace("_", " ")
                              .toUpperCase()}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      <div className="bg-gray-50 p-2 text-xs text-center text-gray-600">
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  📋 Violation Logs ({filteredViolations.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredViolations.map((violation) => (
                      <tr
                        key={violation.id}
                        className={`transition-colors ${
                          hoveredViolationId === violation.id
                            ? "bg-blue-50 shadow-inner"
                            : "hover:bg-gray-50"
                        }`}
                        onMouseEnter={() => setHoveredViolationId(violation.id)}
                        onMouseLeave={() => setHoveredViolationId(null)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-bold text-gray-900">
                            #{violation.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getViolationColor(violation.violation_type)}`}
                          >
                            {violation.violation_type
                              .replace("_", " ")
                              .toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {violation.message}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-600">
                            {violation.exam_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-600">
                            {violation.candidate_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(violation.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {violation.image_url ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-gray-400">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              No
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
