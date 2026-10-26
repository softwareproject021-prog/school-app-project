import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, Role } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const a = inject(Auth);
  return a.user() && a.token ? true : inject(Router).parseUrl('/login');
};

/** Allows a route for the given roles. A Main Admin who is viewing a school counts as the principal. */
export const roleGuard = (...roles: Role[]): CanActivateFn => () => {
  const a = inject(Auth);
  const r = a.effectiveRole();
  return r && roles.includes(r) ? true : inject(Router).parseUrl(a.user() ? a.home() : '/login');
};
