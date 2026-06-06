import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings, ApiResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly base = '/api/settings';

  readonly settings = signal<Partial<AppSettings>>({});

  constructor(private http: HttpClient) {
    this.load();
  }

  load(): void {
    this.http.get<ApiResponse<AppSettings>>(this.base).subscribe({
      next: res => this.settings.set(res.data),
    });
  }

  getAll(): Observable<ApiResponse<AppSettings>> {
    return this.http.get<ApiResponse<AppSettings>>(this.base);
  }

  update(updates: Partial<AppSettings>): Observable<ApiResponse<AppSettings>> {
    return this.http.put<ApiResponse<AppSettings>>(this.base, updates);
  }

  updateOne(key: string, value: string): Observable<{ data: { key: string; value: string } }> {
    return this.http.patch<{ data: { key: string; value: string } }>(
      `${this.base}/${key}`,
      { value }
    );
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] | undefined {
    return this.settings()[key] as AppSettings[K] | undefined;
  }
}
