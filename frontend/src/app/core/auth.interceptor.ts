import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from './auth.service';

/**
 * Adds the bearer token (and X-School-Id when the Main Admin is viewing a school).
 * When the short-lived token has expired, it silently refreshes once and retries; if that fails the user is signed out.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  if (!req.url.startsWith('/api') || req.url.startsWith('/api/auth/')) return next(req);
  const withToken = (r: HttpRequest<unknown>) => {
    let headers = r.headers;
    if (auth.token) headers = headers.set('Authorization', 'Bearer ' + auth.token);
    const v = auth.viewing();
    if (v && auth.role() === 'MAIN_ADMIN') headers = headers.set('X-School-Id', String(v.id));
    return r.clone({ headers });
  };
  return next(withToken(req)).pipe(catchError((e: HttpErrorResponse) => {
    if (e.status !== 401 || !auth.user()) return throwError(() => e);
    return auth.refresh().pipe(switchMap(ok => {
      if (!ok) { auth.logout(); return throwError(() => e); }
      return next(withToken(req));
    }));
  }));
};
