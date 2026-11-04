/**
 * Base fetch mutator used by Orval-generated hooks.
 * Reads the API base URL from VITE_API_BASE_URL (defaults to '' for same-origin).
 */
const BASE_URL =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL
    ? (import.meta as any).env.VITE_API_BASE_URL
    : '';

export interface ApiClientOptions extends RequestInit {
  url: string;
  method: string;
  params?: Record<string, string | number | boolean | undefined>;
  data?: unknown;
  headers?: Record<string, string>;
}

export async function apiClient<T = unknown>(options: ApiClientOptions): Promise<T> {
  const { url, method, params, data, headers: extraHeaders, ...rest } = options;

  // Build query string
  let fullUrl = `${BASE_URL}${url}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) fullUrl += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    ...rest,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      errorMessage = body?.error ?? body?.message ?? errorMessage;
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}
