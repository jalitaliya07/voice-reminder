import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard — AI Voice Reminder',
  },
  {
    path: 'today',
    loadComponent: () =>
      import('./features/today/today.component').then(m => m.TodayComponent),
    title: 'Today — AI Voice Reminder',
  },
  {
    path: 'upcoming',
    loadComponent: () =>
      import('./features/upcoming/upcoming.component').then(m => m.UpcomingComponent),
    title: 'Upcoming — AI Voice Reminder',
  },
  {
    path: 'completed',
    loadComponent: () =>
      import('./features/completed/completed.component').then(m => m.CompletedComponent),
    title: 'Completed — AI Voice Reminder',
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
    title: 'Analytics — AI Voice Reminder',
  },
  {
    path: 'ai-assistant',
    loadComponent: () =>
      import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent),
    title: 'AI Assistant — AI Voice Reminder',
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(m => m.SettingsComponent),
    title: 'Settings — AI Voice Reminder',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
