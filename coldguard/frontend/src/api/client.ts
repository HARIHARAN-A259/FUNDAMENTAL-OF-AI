import axios from 'axios';
import {
  Alert,
  AlertEvent,
  ContactPerson,
  DashboardSummary,
  NotificationItem,
  Reading,
  Role,
  SettingItem,
  StorageUnit,
  UnitAnalytics,
  User,
} from '../types';

// Base API URL from environment variable, falling back to localhost:8000
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim() : 'http://localhost:8000'
).replace(/\/+$/, '');

// Base WebSocket URL from VITE_WS_URL, or derived from VITE_API_URL, or fallback to ws://localhost:8000
export const WS_BASE_URL = (
  import.meta.env.VITE_WS_URL
    ? import.meta.env.VITE_WS_URL.trim()
    : import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.trim().replace(/^http/, 'ws')
    : 'ws://localhost:8000'
).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('coldguard_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Logout if 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('coldguard_token');
      localStorage.removeItem('coldguard_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/* Auth */
export const loginApi = async (email: string, password: string) => {
  const res = await api.post<{ access_token: string; user: User }>('/api/auth/login', {
    email,
    password,
  });
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get<User>('/api/auth/me');
  return res.data;
};

/* Units */
export const getUnitsApi = async () => {
  const res = await api.get<StorageUnit[]>('/api/units');
  return res.data;
};

export const getUnitApi = async (id: number) => {
  const res = await api.get<StorageUnit>(`/api/units/${id}`);
  return res.data;
};

export const getUnitAnalyticsApi = async (id: number) => {
  const res = await api.get<UnitAnalytics>(`/api/units/${id}/analytics`);
  return res.data;
};

export const createUnitApi = async (data: Partial<StorageUnit>) => {
  const res = await api.post<StorageUnit>('/api/units', data);
  return res.data;
};

export const updateUnitApi = async (id: number, data: Partial<StorageUnit>) => {
  const res = await api.put<StorageUnit>(`/api/units/${id}`, data);
  return res.data;
};

export const deleteUnitApi = async (id: number) => {
  await api.delete(`/api/units/${id}`);
};

/* Readings */
export const getUnitReadingsApi = async (unitId: number, hours = 24) => {
  const res = await api.get<Reading[]>(`/api/units/${unitId}/readings?hours=${hours}&page_size=300`);
  return res.data;
};

/* Alerts */
export const getAlertsApi = async (params?: Record<string, any>) => {
  const res = await api.get<Alert[]>('/api/alerts', { params });
  return res.data;
};

export const getActiveAlertsApi = async () => {
  const res = await api.get<Alert[]>('/api/alerts/active');
  return res.data;
};

export const getAlertDetailApi = async (id: number) => {
  const res = await api.get<Alert>(`/api/alerts/${id}`);
  return res.data;
};

export const acknowledgeAlertApi = async (id: number, note?: string) => {
  const res = await api.post(`/api/alerts/${id}/acknowledge`, { note });
  return res.data;
};

export const getAuditLogApi = async (params?: Record<string, any>) => {
  const res = await api.get<AlertEvent[]>('/api/alerts/audit/log', { params });
  return res.data;
};

/* Stats */
export const getSummaryStatsApi = async () => {
  const res = await api.get<DashboardSummary>('/api/stats/summary');
  return res.data;
};

/* Notifications */
export const getNotificationsApi = async (params?: Record<string, any>) => {
  const res = await api.get<NotificationItem[]>('/api/notifications', { params });
  return res.data;
};

/* Simulator */
export const injectSimulatorFaultApi = async (unit_id: number, scenario: string) => {
  const res = await api.post('/api/simulator/inject', { unit_id, scenario });
  return res.data;
};

export const setSimulatorSpeedApi = async (speed: number) => {
  const res = await api.post('/api/simulator/speed', { speed });
  return res.data;
};

export const pauseSimulatorApi = async () => {
  const res = await api.post('/api/simulator/pause');
  return res.data;
};

export const resumeSimulatorApi = async () => {
  const res = await api.post('/api/simulator/resume');
  return res.data;
};

export const resetSimulatorApi = async () => {
  const res = await api.post('/api/simulator/reset');
  return res.data;
};

export const getSimulatorStateApi = async () => {
  const res = await api.get('/api/simulator/state');
  return res.data;
};

/* Contacts */
export const getContactsApi = async () => {
  const res = await api.get<ContactPerson[]>('/api/contacts');
  return res.data;
};

export const createContactApi = async (data: Partial<ContactPerson>) => {
  const res = await api.post<ContactPerson>('/api/contacts', data);
  return res.data;
};

export const deleteContactApi = async (id: number) => {
  await api.delete(`/api/contacts/${id}`);
};

/* Users */
export const getUsersApi = async () => {
  const res = await api.get<User[]>('/api/users');
  return res.data;
};

export const createUserApi = async (data: any) => {
  const res = await api.post<User>('/api/users', data);
  return res.data;
};

export const deleteUserApi = async (id: number) => {
  await api.delete(`/api/users/${id}`);
};

/* Settings */
export const getSettingsApi = async () => {
  const res = await api.get<SettingItem[]>('/api/settings');
  return res.data;
};

export const updateSettingApi = async (key: string, value: string) => {
  const res = await api.put<SettingItem>(`/api/settings/${key}`, { value });
  return res.data;
};

