import type {
  AuthResponse,
  DeviceResponse,
  PairingResponse,
  MediaResponse,
  ScheduleResponse,
  ScheduleRequest,
} from '../types';

const BASE = '/api';

function token() {
  return localStorage.getItem('token');
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const t = token();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string) =>
    req<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    req<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// ── Devices ───────────────────────────────────────────────────────────────────
export const devicesApi = {
  pair: () => req<PairingResponse>('/devices/pair', { method: 'POST' }),
  list: () => req<DeviceResponse[]>('/devices'),
  get: (id: string) => req<DeviceResponse>(`/devices/${id}`),
  update: (id: string, name: string) =>
    req<DeviceResponse>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) => req<void>(`/devices/${id}`, { method: 'DELETE' }),
};

// ── Media ─────────────────────────────────────────────────────────────────────
export const mediaApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return req<MediaResponse>('/media/upload', { method: 'POST', body: form });
  },
  list: () => req<MediaResponse[]>('/media'),
  get: (id: string) => req<MediaResponse>(`/media/${id}`),
  rename: (id: string, fileName: string) =>
    req<MediaResponse>(`/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ fileName }),
    }),
  delete: (id: string) => req<void>(`/media/${id}`, { method: 'DELETE' }),
};

/**
 * Rewrites Azurite blob URLs to go through the Vite dev-server proxy,
 * avoiding CORS issues in local development.
 * Azure Blob Storage URLs (production) are returned unchanged.
 */
export function toBrowserUrl(blobUrl: string): string {
  return blobUrl.replace(/^https?:\/\/(127\.0\.0\.1|localhost):10000/, '/azurite');
}

// ── Schedules ─────────────────────────────────────────────────────────────────
export const schedulesApi = {
  create: (data: ScheduleRequest) =>
    req<ScheduleResponse>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: (deviceId?: string) =>
    req<ScheduleResponse[]>(`/schedules${deviceId ? `?deviceId=${deviceId}` : ''}`),
  get: (id: string) => req<ScheduleResponse>(`/schedules/${id}`),
  update: (id: string, data: ScheduleRequest) =>
    req<ScheduleResponse>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => req<void>(`/schedules/${id}`, { method: 'DELETE' }),
};
