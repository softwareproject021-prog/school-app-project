import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Thin wrapper over HttpClient. All paths are relative to /api (proxied to the Quarkus backend). */
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  private params(p?: Record<string, any>): HttpParams {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(p ?? {})) if (v !== null && v !== undefined && v !== '') hp = hp.set(k, String(v));
    return hp;
  }
  get<T = any>(path: string, p?: Record<string, any>): Observable<T> { return this.http.get<T>('/api' + path, { params: this.params(p) }); }
  post<T = any>(path: string, body: any = {}, p?: Record<string, any>): Observable<T> { return this.http.post<T>('/api' + path, body, { params: this.params(p) }); }
  put<T = any>(path: string, body: any = {}, p?: Record<string, any>): Observable<T> { return this.http.put<T>('/api' + path, body, { params: this.params(p) }); }
  patch<T = any>(path: string, body: any = {}): Observable<T> { return this.http.patch<T>('/api' + path, body); }
  delete<T = any>(path: string, p?: Record<string, any>): Observable<T> { return this.http.delete<T>('/api' + path, { params: this.params(p) }); }
}

/** Error text from the backend ({"error": "..."}) or a friendly fallback. */
export function errText(e: any): string {
  return e?.error?.error ?? (e?.status === 0 ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong. Try again.');
}
