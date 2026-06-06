import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../core/services/layout.service';

interface NavItem {
  path:  string;
  label: string;
  icon:  string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly isCollapsed = signal(false);

  readonly navItems: NavItem[] = [
    { path: '/dashboard',    label: 'Dashboard',    icon: 'grid' },
    { path: '/today',        label: 'Today',        icon: 'calendar' },
    { path: '/upcoming',     label: 'Upcoming',     icon: 'clock' },
    { path: '/completed',    label: 'Completed',    icon: 'check-circle' },
    { path: '/analytics',    label: 'Analytics',    icon: 'bar-chart' },
    { path: '/ai-assistant', label: 'AI Assistant', icon: 'cpu' },
    { path: '/settings',     label: 'Settings',     icon: 'settings' },
  ];

  constructor(public layoutService: LayoutService) {}

  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }

  onNavItemClick(): void {
    this.layoutService.closeMobileMenu();
  }

  // SVG icon paths
  getIconPath(icon: string): string {
    const icons: Record<string, string> = {
      'grid':        'M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z',
      'calendar':    'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
      'clock':       'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6v-4.5L15 9',
      'check-circle':'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
      'bar-chart':   'M18 20V10M12 20V4M6 20v-6',
      'cpu':         'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
      'settings':    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6.22-1.37a6 6 0 0 0 .06-.63 6 6 0 0 0-.06-.63l1.36-1.06a.33.33 0 0 0 .08-.42l-1.28-2.22a.33.33 0 0 0-.4-.14l-1.6.64a6 6 0 0 0-1.09-.63l-.24-1.7a.32.32 0 0 0-.32-.28h-2.56a.32.32 0 0 0-.32.28l-.24 1.7a6 6 0 0 0-1.09.63l-1.6-.64a.33.33 0 0 0-.4.14L4.34 9.89a.32.32 0 0 0 .08.42l1.36 1.06a6 6 0 0 0-.06.63 6 6 0 0 0 .06.63l-1.36 1.06a.33.33 0 0 0-.08.42l1.28 2.22c.08.14.26.19.4.14l1.6-.64c.34.24.7.45 1.09.63l.24 1.7c.04.16.18.28.32.28h2.56c.16 0 .28-.12.32-.28l.24-1.7a6 6 0 0 0 1.09-.63l1.6.64c.14.05.32 0 .4-.14l1.28-2.22a.32.32 0 0 0-.08-.42l-1.36-1.06z',
      'chevron-left':'M15 18l-6-6 6-6',
      'chevron-right':'M9 18l6-6-6-6',
      'bell':        'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
      'mic':         'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm6 11a6 6 0 0 1-12 0H4a8 8 0 0 0 16 0h-2zM12 19v4m-4 0h8',
    };
    return icons[icon] || '';
  }
}
