/**
 * API Configuration
 *
 * Centralized configuration for API endpoints and settings
 * Change API_BASE_URL to switch between environments
 */

// API Base URL - Change this for different environments
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// WebSocket URL - Derived from API base URL
export const WS_BASE_URL = API_BASE_URL.replace("http", "ws");

// API Endpoints
export const API_ENDPOINTS = {
  // Violations
  violations: {
    save: `${API_BASE_URL}/api/violations/save`,
    listAll: `${API_BASE_URL}/api/violations/list-all`,
    listByCandidate: (examId: string, candidateId: string) =>
      `${API_BASE_URL}/api/violations/list/${examId}/${candidateId}`,
    image: (path: string) => `${API_BASE_URL}${path}`,
  },

  // Proctor Events
  proctorEvents: {
    list: `${API_BASE_URL}/api/events/list`,
  },

  // WebSocket
  websocket: {
    proctor: (examId: string, candidateId: string) =>
      `${WS_BASE_URL}/ws/proctor/${examId}/${candidateId}`,
    admin: (examId: string) => `${WS_BASE_URL}/ws/proctor/admin/${examId}`,
  },
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Default headers
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * Get authorization header if token exists
 */
export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
