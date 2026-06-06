import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyticsSummary, DailyBreakdown, ApiResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly base = '/api/analytics';

  readonly summary = signal<AnalyticsSummary | null>(null);

  constructor(private http: HttpClient) {}

  getSummary(from?: string, to?: string): Observable<{ data: AnalyticsSummary; from: string; to: string }> {
    let url = `${this.base}/summary`;
    if (from && to) url += `?from=${from}&to=${to}`;
    return this.http.get<{ data: AnalyticsSummary; from: string; to: string }>(url);
  }

  getDaily(days = 7): Observable<{ data: DailyBreakdown[]; days: number }> {
    return this.http.get<{ data: DailyBreakdown[]; days: number }>(
      `${this.base}/daily?days=${days}`
    );
  }

  recalculate(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/recalculate`, {});
  }
}
