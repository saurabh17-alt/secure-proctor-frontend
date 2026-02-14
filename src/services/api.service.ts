/**
 * API Service
 *
 * Centralized API client with:
 * - Automatic token injection
 * - Error handling
 * - Request/response interceptors
 * - Timeout management
 */

import {
  API_BASE_URL,
  DEFAULT_HEADERS,
  REQUEST_TIMEOUT,
  getAuthHeader,
} from "../config/api.config";

interface RequestOptions extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  const { timeout = REQUEST_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * API Client
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Build headers with auth token
   */
  private buildHeaders(options: RequestOptions = {}): HeadersInit {
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if not skipped
    if (!options.skipAuth) {
      Object.assign(headers, getAuthHeader());
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // Parse JSON response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    // Return text for non-JSON responses
    return response.text() as any;
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    console.log(`🌐 GET ${url}`);

    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: this.buildHeaders(options),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    console.log(`🌐 POST ${url}`, data);

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: this.buildHeaders(options),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    console.log(`🌐 PUT ${url}`, data);

    const response = await fetchWithTimeout(url, {
      method: "PUT",
      headers: this.buildHeaders(options),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    console.log(`🌐 DELETE ${url}`);

    const response = await fetchWithTimeout(url, {
      method: "DELETE",
      headers: this.buildHeaders(options),
      ...options,
    });

    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
