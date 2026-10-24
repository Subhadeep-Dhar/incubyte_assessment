import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient, setAuthToken, ApiClientError } from '../../src/api/client';

describe('ApiClient (Unit & Contract Test)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setAuthToken(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('performs a GET request to the configured base URL with proper headers', async () => {
    const mockData = { success: true, data: { id: '123', name: 'Test' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as unknown as Response);

    const result = await apiClient.get<{ id: string; name: string }>('/test');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/test');
    expect(options.method).toBe('GET');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(result).toEqual({ id: '123', name: 'Test' });
  });

  it('attaches Authorization Bearer token when set', async () => {
    setAuthToken('mock-jwt-token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { status: 'ok' } }),
    } as unknown as Response);

    await apiClient.get('/auth-test');

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer mock-jwt-token');
  });

  it('clears Authorization header when token is set to null', async () => {
    setAuthToken('temporary-token');
    setAuthToken(null);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} }),
    } as unknown as Response);

    await apiClient.get('/public-test');

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('serializes request body on POST request', async () => {
    const payload = { make: 'Toyota', model: 'Supra' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: payload }),
    } as unknown as Response);

    const result = await apiClient.post('/vehicles', payload);

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify(payload));
    expect(result).toEqual(payload);
  });

  it('throws structured ApiClientError on HTTP 400 Bad Request with error code and details', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'price', message: 'Price must be positive' }],
        },
      }),
    } as unknown as Response);

    await expect(apiClient.post('/vehicles', { price: -5 })).rejects.toThrow(ApiClientError);

    try {
      await apiClient.post('/vehicles', { price: -5 });
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe('VALIDATION_ERROR');
      expect(apiErr.message).toBe('Validation failed');
      expect(apiErr.details).toEqual([{ field: 'price', message: 'Price must be positive' }]);
    }
  });

  it('throws structured ApiClientError on HTTP 409 Conflict for out-of-stock purchases', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Vehicle is out of stock',
        },
      }),
    } as unknown as Response);

    try {
      await apiClient.post('/vehicles/123/purchase');
      expect.fail('Should have thrown an error');
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr.status).toBe(409);
      expect(apiErr.code).toBe('INSUFFICIENT_STOCK');
      expect(apiErr.message).toBe('Vehicle is out of stock');
    }
  });

  it('handles paginated response envelope and returns both data and pagination metadata', async () => {
    const mockPaginated = {
      success: true,
      data: [{ id: '1', make: 'Ford', model: 'Mustang' }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPaginated,
    } as unknown as Response);

    const result = await apiClient.getPaginated<{ id: string; make: string; model: string }>(
      '/vehicles',
      { params: { page: 1, limit: 10 } },
    );

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('handles network failure and wraps it in an ApiClientError with NETWORK_ERROR code', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    try {
      await apiClient.get('/network-fail');
      expect.fail('Should have thrown an error');
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.code).toBe('NETWORK_ERROR');
      expect(apiErr.message).toContain('Failed to fetch');
    }
  });
});
