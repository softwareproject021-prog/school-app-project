import { HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

/** Counts the requests that are in flight so the app can show one loading bar for every screen. */
@Injectable({ providedIn: 'root' })
export class Busy {
  private n = signal(0);
  readonly active = computed(() => this.n() > 0);
  start() { this.n.update(v => v + 1); }
  done() { this.n.update(v => Math.max(0, v - 1)); }
}

export const busyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const busy = inject(Busy);
  busy.start();
  return next(req).pipe(finalize(() => busy.done()));
};
