import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Api } from './api.service';
import { Observable, catchError, finalize, map, of, share, tap } from 'rxjs';

export type Role = 'MAIN_ADMIN' | 'ORG_ADMIN' | 'TEACHER' | 'PARENT';
export interface User { login: string; name: string; role: Role; schoolId: number | null; schoolName: string | null; teacherId: number | null; studentId: number | null; }

@Injectable({ providedIn: 'root' })
export class Auth {
  private api = inject(Api);
  private http = inject(HttpClient);
  /** The access token lives only in memory (never in localStorage). The refresh token is an httpOnly cookie the page cannot read. */
  private accessToken: string | null = null;
  private refreshing$: Observable<boolean> | null = null;
  private router = inject(Router);
  readonly user = signal<User | null>(null);
  /** Main Admin "view as school": the school being viewed (sent as X-School-Id). */
  readonly viewing = signal<{ id: number; name: string } | null>(this.read('vd.viewing'));
  readonly role = computed(() => this.user()?.role ?? null);
  /** The role whose screens are shown: a Main Admin viewing a school sees the principal's screens. */
  readonly effectiveRole = computed<Role | null>(() => (this.role() === 'MAIN_ADMIN' && this.viewing() ? 'ORG_ADMIN' : this.role()));

  get token(): string | null { return this.accessToken; }

  login(login: string, password: string) {
    return this.api.post<{ token: string; user: User }>('/auth/login', { login, password }).pipe(tap(r => {
      this.accessToken = r.token; this.set(r.user); this.viewing.set(null); this.write('vd.viewing', null);
    }));
  }
  /** Opens an invitation: sets the person's own password and signs them in. */
  acceptInvite(token: string, password: string) {
    return this.api.post<{ token: string; user: User }>('/auth/accept-invite', { token, password }).pipe(tap(r => {
      this.accessToken = r.token; this.set(r.user); this.viewing.set(null); this.write('vd.viewing', null);
    }));
  }
  private set(u: User) { this.user.set(u); }

  /** Called once at start-up: restores the session from the refresh cookie, if there is one. */
  init(): Promise<void> {
    return new Promise(res => this.refresh().subscribe(() => res()));
  }

  /** Gets a new access token using the httpOnly cookie. Shared, so parallel calls make one request. */
  refresh(): Observable<boolean> {
    if (!this.refreshing$) {
      this.refreshing$ = this.http.post<{ token: string; user: User }>('/api/auth/refresh', {}, { withCredentials: true, headers: { 'X-Requested-With': 'campus1cloud' } }).pipe(
        tap(r => { this.accessToken = r.token; this.set(r.user); }),
        map(() => true), catchError(() => { this.accessToken = null; this.user.set(null); return of(false); }),
        finalize(() => { this.refreshing$ = null; }), share());
    }
    return this.refreshing$;
  }

  home(): string {
    switch (this.effectiveRole()) {
      case 'MAIN_ADMIN': return '/schools';
      case 'ORG_ADMIN': return '/dashboard';
      case 'TEACHER': return '/today';
      case 'PARENT': return '/home';
      default: return '/login';
    }
  }
  viewAs(id: number, name: string, to = '/dashboard') { const v = { id, name }; this.viewing.set(v); this.write('vd.viewing', v); this.router.navigateByUrl(to); }
  backToPlatform() { this.viewing.set(null); this.write('vd.viewing', null); this.router.navigateByUrl('/schools'); }
  logout() {
    this.http.post('/api/auth/logout', {}, { withCredentials: true, headers: { 'X-Requested-With': 'campus1cloud' } }).pipe(catchError(() => of(null))).subscribe();
    this.accessToken = null; this.user.set(null); this.viewing.set(null);
    this.write('vd.viewing', null);
    try { localStorage.removeItem('vd.token'); localStorage.removeItem('vd.user'); } catch { /* storage blocked */ }
    this.router.navigateByUrl('/login');
  }

  private read(k: string) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } }
  private write(k: string, v: any) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } }
}
