import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { baseUrlInterceptor } from './core/base-url.interceptor';
import { Auth } from './core/auth.service';
import { busyInterceptor } from './core/busy.service';
import { AppErrorHandler } from './core/app-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    // busyInterceptor goes first so it still sees the short /api address before baseUrlInterceptor makes it a full server address
    provideHttpClient(withInterceptors([busyInterceptor, authInterceptor, baseUrlInterceptor])),
    { provide: ErrorHandler, useClass: AppErrorHandler },
    { provide: APP_INITIALIZER, multi: true, useFactory: () => { const a = inject(Auth); return () => a.init(); } },
  ],
};
