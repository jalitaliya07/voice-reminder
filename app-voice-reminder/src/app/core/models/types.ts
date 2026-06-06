// ─── Shared TypeScript Types ─────────────────────────────────────────────────
// Used across the entire Angular application

export type RepeatMode = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type Category   = 'general' | 'work' | 'health' | 'personal' | 'study';
export type Priority   = 'low' | 'medium' | 'high' | 'urgent';
export type RepeatUnit = 'minutes' | 'hours' | 'days';

export interface Reminder {
  id:               number;
  title:            string;
  description:      string;
  date:             string;       // YYYY-MM-DD
  time:             string;       // HH:MM
  repeat_mode:      RepeatMode;
  repeat_interval:  number;
  repeat_unit:      RepeatUnit | null;
  category:         Category;
  priority:         Priority;
  voice_enabled:    number;       // 1 | 0
  is_completed:     number;       // 1 | 0
  is_snoozed:       number;       // 1 | 0
  snooze_until:     string | null;
  completed_at:     string | null;
  created_at:       string;
  updated_at:       string;
}

export interface CreateReminderDto {
  title:            string;
  description?:     string;
  date:             string;
  time:             string;
  repeat_mode?:     RepeatMode;
  repeat_interval?: number;
  repeat_unit?:     RepeatUnit;
  category?:        Category;
  priority?:        Priority;
  voice_enabled?:   boolean;
}

export interface UpdateReminderDto extends Partial<CreateReminderDto> {}

export interface AnalyticsSummary {
  total_created:   number;
  total_completed: number;
  total_missed:    number;
  total_snoozed:   number;
  avg_score:       number;
  best_score:      number;
  active_days:     number;
}

export interface DailyBreakdown {
  date:                string;
  reminders_completed: number;
  reminders_missed:    number;
  productivity_score:  number;
}

export interface AppSettings {
  theme:               'dark' | 'light';
  voice_name:          string;
  voice_volume:        string;
  voice_rate:          string;
  voice_pitch:         string;
  notification_sound:  string;
  notification_volume: string;
  auto_start:          string;
  language:            string;
  user_name:           string;
  minimize_to_tray:    string;
  scheduler_interval:  string;
}

export interface ApiResponse<T> {
  data:    T;
  message?: string;
  count?:  number;
}

export interface ApiError {
  error:    string;
  details?: unknown[];
}

// Electron IPC API shape (window.electronAPI)
export interface ElectronAPI {
  window: {
    minimize:       () => void;
    maximize:       () => void;
    close:          () => void;
    minimizeToTray: () => void;
  };
  notifications: {
    show: (title: string, body: string, options?: { silent?: boolean }) => Promise<void>;
  };
  settings: {
    setAutoStart: (enable: boolean) => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    getInfo:    () => Promise<{
      isDev: boolean; version: string; platform: string; backendPort: number;
    }>;
  };
  onReminderDue: (callback: (reminder: Reminder) => void) => void;
  onTrayOpen:    (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window { electronAPI?: ElectronAPI; }
}
