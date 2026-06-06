import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reminder, CreateReminderDto, UpdateReminderDto, ApiResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly base = '/api/reminders';

  // ── Signal-based local state ─────────────────────────────────────────────────
  readonly reminders   = signal<Reminder[]>([]);
  readonly todayCount  = signal<number>(0);
  readonly isLoading   = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  // ── API calls ─────────────────────────────────────────────────────────────────
  getAll(filters?: { category?: string; priority?: string; completed?: boolean }): Observable<ApiResponse<Reminder[]>> {
    let params = new HttpParams();
    if (filters?.category)  params = params.set('category', filters.category);
    if (filters?.priority)  params = params.set('priority', filters.priority);
    if (filters?.completed !== undefined) params = params.set('completed', String(filters.completed));
    return this.http.get<ApiResponse<Reminder[]>>(this.base, { params });
  }

  getToday(): Observable<ApiResponse<Reminder[]>> {
    return this.http.get<ApiResponse<Reminder[]>>(`${this.base}/today`);
  }

  getUpcoming(): Observable<ApiResponse<Reminder[]>> {
    return this.http.get<ApiResponse<Reminder[]>>(`${this.base}/upcoming`);
  }

  getDue(): Observable<ApiResponse<Reminder[]>> {
    return this.http.get<ApiResponse<Reminder[]>>(`${this.base}/due`);
  }

  getCompleted(): Observable<ApiResponse<Reminder[]>> {
    return this.http.get<ApiResponse<Reminder[]>>(`${this.base}/completed`);
  }

  getById(id: number): Observable<ApiResponse<Reminder>> {
    return this.http.get<ApiResponse<Reminder>>(`${this.base}/${id}`);
  }

  create(dto: CreateReminderDto): Observable<ApiResponse<Reminder>> {
    return this.http.post<ApiResponse<Reminder>>(this.base, dto);
  }

  update(id: number, dto: UpdateReminderDto): Observable<ApiResponse<Reminder>> {
    return this.http.put<ApiResponse<Reminder>>(`${this.base}/${id}`, dto);
  }

  complete(id: number): Observable<ApiResponse<Reminder>> {
    return this.http.patch<ApiResponse<Reminder>>(`${this.base}/${id}/complete`, {});
  }

  snooze(id: number, minutes = 10): Observable<ApiResponse<Reminder>> {
    return this.http.patch<ApiResponse<Reminder>>(`${this.base}/${id}/snooze`, { minutes });
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
