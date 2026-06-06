import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsSummary, DailyBreakdown } from '../../core/models/types';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('completionCanvas') completionCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyCanvas') weeklyCanvas!: ElementRef<HTMLCanvasElement>;

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly dailyBreakdown = signal<DailyBreakdown[]>([]);
  readonly isLoading = signal(true);

  private completionChart: Chart | null = null;
  private weeklyChart: Chart | null = null;

  // Computed values
  readonly streak = computed(() => {
    // Basic streak calculation: count consecutive days with completion > 0
    let currentStreak = 0;
    const sortedDaily = [...this.dailyBreakdown()].sort((a, b) => b.date.localeCompare(a.date));
    
    for (const day of sortedDaily) {
      if (day.reminders_completed > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  });

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // If data is already loaded, render charts. Otherwise they will render when data finishes loading.
  }

  loadData(): void {
    this.isLoading.set(true);
    
    this.analyticsService.getSummary().subscribe({
      next: res => {
        this.summary.set(res.data);
        this.checkAndRenderCharts();
      },
      error: () => this.isLoading.set(false)
    });

    this.analyticsService.getDaily(7).subscribe({
      next: res => {
        this.dailyBreakdown.set(res.data);
        this.checkAndRenderCharts();
      },
      error: () => this.isLoading.set(false)
    });
  }

  checkAndRenderCharts(): void {
    if (this.summary() && this.dailyBreakdown().length > 0) {
      this.isLoading.set(false);
      // Wait for a tick to ensure elements are in the DOM
      setTimeout(() => {
        this.renderCompletionChart();
        this.renderWeeklyChart();
      }, 50);
    }
  }

  recalculateStats(): void {
    this.analyticsService.recalculate().subscribe(() => {
      this.loadData();
    });
  }

  private renderCompletionChart(): void {
    if (!this.completionCanvas) return;

    if (this.completionChart) {
      this.completionChart.destroy();
    }

    const s = this.summary();
    if (!s) return;

    const ctx = this.completionCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const completed = s.total_completed;
    const missed = s.total_missed;
    const snoozed = s.total_snoozed;

    // Default values if no reminders yet
    const dataValues = (completed === 0 && missed === 0 && snoozed === 0) 
      ? [1, 0, 0] 
      : [completed, missed, snoozed];

    this.completionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Missed', 'Snoozed'],
        datasets: [{
          data: dataValues,
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
          borderColor: '#0f0f1a',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a0a0c0',
              font: { family: 'Inter', size: 12 }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  private renderWeeklyChart(): void {
    if (!this.weeklyCanvas) return;

    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }

    const daily = this.dailyBreakdown();
    if (daily.length === 0) return;

    const ctx = this.weeklyCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Chronological order (oldest to newest)
    const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
    const labels = sorted.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const completedData = sorted.map(d => d.reminders_completed);
    const missedData = sorted.map(d => d.reminders_missed);

    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Completed',
            data: completedData,
            backgroundColor: '#4f8ef7',
            borderRadius: 4,
          },
          {
            label: 'Missed',
            data: missedData,
            backgroundColor: '#ef4444',
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a0a0c0',
              font: { family: 'Inter', size: 12 }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#a0a0c0' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#a0a0c0', stepSize: 1 }
          }
        }
      }
    });
  }
}
