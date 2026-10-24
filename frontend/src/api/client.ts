import { ApiErrorResponse, ApiResponse, PaginatedResponse } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

let currentAuthToken: string | null = null;

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown[];

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR', details?: unknown[]) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function setAuthToken(token: string | null): void {
  currentAuthToken = token;
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
  rawEnvelope?: boolean;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  let url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  if (options?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiClientError(message, 0, 'NETWORK_ERROR');
  }

  let jsonPayload: unknown;
  try {
    jsonPayload = await response.json();
  } catch {
    jsonPayload = null;
  }

  if (!response.ok) {
    const errorPayload = jsonPayload as ApiErrorResponse | null;
    const code = errorPayload?.error?.code || 'HTTP_ERROR';
    const message = errorPayload?.error?.message || response.statusText || 'Request failed';
    const details = errorPayload?.error?.details;
    throw new ApiClientError(message, response.status, code, details);
  }

  if (options?.rawEnvelope) {
    return jsonPayload as T;
  }

  const successPayload = jsonPayload as ApiResponse<T>;
  if (successPayload && typeof successPayload === 'object' && 'data' in successPayload) {
    return successPayload.data as T;
  }

  return jsonPayload as T;
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', endpoint, undefined, options);
  },
  async getPaginated<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<{ data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const envelope = await request<PaginatedResponse<T>>('GET', endpoint, undefined, {
      ...options,
      rawEnvelope: true,
    });
    return {
      data: envelope.data || [],
      pagination: envelope.pagination,
    };
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', endpoint, body, options);
  },
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', endpoint, body, options);
  },
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', endpoint, undefined, options);
  },
};
