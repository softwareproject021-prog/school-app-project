import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE } from './native';

/** Last in the chain: turns /api/... into the full server address when running as the installed app. */
export const baseUrlInterceptor: HttpInterceptorFn = (req, next) =>
  API_BASE && req.url.startsWith('/api') ? next(req.clone({ url: API_BASE + req.url })) : next(req);
