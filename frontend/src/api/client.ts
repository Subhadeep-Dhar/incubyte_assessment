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

export function setAuthToken(_token: string | null): void {
  // stub
}

export const apiClient = {
  async get<T>(_endpoint: string): Promise<T> {
    throw new Error('Not implemented');
  },
  async post<T>(_endpoint: string, _body?: unknown): Promise<T> {
    throw new Error('Not implemented');
  },
  async put<T>(_endpoint: string, _body?: unknown): Promise<T> {
    throw new Error('Not implemented');
  },
  async delete<T>(_endpoint: string): Promise<T> {
    throw new Error('Not implemented');
  },
};
