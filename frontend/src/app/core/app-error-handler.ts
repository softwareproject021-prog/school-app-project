import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { errText } from './api.service';
import { Toast } from './toast.service';

/**
 * Safety net for requests whose screen has no error handler of its own: the person sees why it failed
 * instead of an empty list or a button that does nothing. Screens that handle their own errors are not affected,
 * because only errors nobody caught reach this class.
 */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private toast = inject(Toast);
  handleError(error: unknown): void {
    const e = (error as any)?.rejection ?? error;
    if (e instanceof HttpErrorResponse) {
      // A 401 means the session ended; the interceptor is already sending the person to the sign-in page.
      if (e.status !== 401) this.toast.show(errText(e), 6000);
      return;
    }
    console.error(error);
  }
}
