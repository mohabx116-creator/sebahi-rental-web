import axios from 'axios';
import type { ApiResponse, PaginatedMeta } from './types';

const DEFAULT_API_BASE_URL = 'https://compound-os-api-replica.onrender.com/api/v1';

export type ApiClientErrorCode = 'HTTP_ERROR' | 'API_ERROR' | 'INVALID_RESPONSE' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';

export class ApiClientError extends Error {
  readonly status?: number;
  readonly code: ApiClientErrorCode;
  readonly details?: unknown;

  constructor(message: string, code: ApiClientErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: apiBaseUrl.replace(/\/+$/, ''),
  headers: { 'Content-Type': 'application/json' },
});

function cleanParams(params?: object) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      ['string', 'number', 'boolean'].includes(typeof value)
    )),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getEnvelopeMessage(body: unknown) {
  return isRecord(body) && typeof body.message === 'string' ? body.message : undefined;
}

export interface ApiData<T> {
  data: T;
  meta?: PaginatedMeta;
  message: string;
}

function unwrapApiData<T>(body: unknown, status: number): ApiData<T> {
  if (!isRecord(body) || typeof body.success !== 'boolean' || typeof body.message !== 'string') {
    throw new ApiClientError('Unexpected API response shape', 'INVALID_RESPONSE', status, body);
  }

  const response = body as unknown as ApiResponse<T>;
  if (!response.success) {
    throw new ApiClientError(response.message || 'Request failed', 'API_ERROR', status, response);
  }

  if (response.data === undefined) {
    throw new ApiClientError('API response did not include data', 'INVALID_RESPONSE', status, response);
  }

  return { data: response.data, meta: response.meta, message: response.message };
}

function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;

  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const status = error.response?.status;
    const body = error.response?.data;
    const message = getEnvelopeMessage(body) || error.message || 'Unable to reach Compound OS API';
    return new ApiClientError(message, status ? 'HTTP_ERROR' : 'NETWORK_ERROR', status, body);
  }

  return new ApiClientError(error instanceof Error ? error.message : 'Unexpected API client error', 'UNKNOWN_ERROR');
}

export async function getApiData<T>(path: string, params?: object): Promise<ApiData<T>> {
  try {
    const response = await apiClient.get<unknown>(path, { params: cleanParams(params) });
    return unwrapApiData<T>(response.data, response.status);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function postApiData<T>(path: string, payload?: object): Promise<ApiData<T>> {
  try {
    const response = await apiClient.post<unknown>(path, payload);
    return unwrapApiData<T>(response.data, response.status);
  } catch (error) {
    throw normalizeApiError(error);
  }
}
