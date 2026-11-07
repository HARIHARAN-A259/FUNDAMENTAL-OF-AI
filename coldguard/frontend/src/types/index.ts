export type Role = 'STAFF' | 'MANAGER' | 'MEDICAL_OFFICER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export type UnitType = 'FRIDGE' | 'FREEZER';

export interface StorageUnit {
  id: number;
  name: string;
  type: UnitType;
  location: string;
  sensor_id: string | null;
  is_active: boolean;
  min_temp: number;
  max_temp: number;
  warn_low: number;
  warn_high: number;
  critical_min: number;
  critical_max: number;
  created_at: string;
}

export type AlertType = 'TEMPERATURE' | 'SENSOR_OFFLINE';
export type AlertSeverity = 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ESCALATED_L2' | 'ESCALATED_L3' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertEventType = 'OPENED' | 'ESCALATED' | 'REMINDER' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface AlertEvent {
  id: number;
  alert_id: number;
  event_type: AlertEventType;
  user_id: number | null;
  details: string;
  timestamp: string;
}

export interface Alert {
  id: number;
  unit_id: number;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  level: number;
  message: string;
  probable_cause: string;
  opened_at: string;
  resolved_at: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  last_notified_at: string | null;
  events?: AlertEvent[];
}

export interface Reading {
  id: number;
  unit_id: number;
  temperature: number;
  timestamp: string;
}

export interface UnitAnalytics {
  unit_id: number;
  unit_name: string;
  readings_count: number;
  current_temp: number | null;
  min_temp_24h: number | null;
  max_temp_24h: number | null;
  avg_temp_24h: number | null;
  mkt_24h: number;
  probable_cause: string;
  minutes_to_limit: number | null;
  active_alert: number | null;
  health_score: number;
}

export interface DashboardSummary {
  total_units: number;
  active_alerts: number;
  critical_alerts: number;
  units_in_excursion: number;
  simulation_speed: number;
  simulation_paused: boolean;
  system_health: number;
}

export interface NotificationItem {
  id: number;
  alert_id: number | null;
  level: number;
  recipient: string;
  channel: 'CONSOLE' | 'TELEGRAM' | 'EMAIL' | 'SMS';
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  message: string;
  error: string;
  timestamp: string;
}

export interface ContactPerson {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  telegram_chat_id: string;
  escalation_level: number;
}

export interface SettingItem {
  id: number;
  key: string;
  value: string;
  description: string;
}
