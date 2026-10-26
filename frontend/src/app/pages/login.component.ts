import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../core/auth.service';
import { errText } from '../core/api.service';
import { EVENT_ART } from '../core/event-art';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-login', standalone: true, imports: [FormsModule, RouterLink],
  template: `
  <div class="auth">
    <div class="auth-hero">
      <img src="campus1cloud-logo.png" alt="Campus1Cloud">
      <p>Learn · Manage · Grow together</p>
    </div>
    <form class="auth-card" (ngSubmit)="submit()">
      <h2>Welcome back</h2>
      <p class="sub">Sign in with the login from your invitation.</p>
      <label>Email / login<input type="text" name="login" [(ngModel)]="login" autocomplete="username" autocapitalize="none" inputmode="email" placeholder="you@school.in"></label>
      <label>Password<input type="password" name="password" [(ngModel)]="password" autocomplete="current-password"></label>
      @if (error()) { <div class="err">{{ error() }}</div> }
      <button class="btn pri big" type="submit" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
      <a routerLink="/forgot" class="forgot">Forgot password?</a>
    </form>
    <p class="auth-foot">New here? Ask your school to send you an invite.</p>
  </div>`,
})
export class LoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  art = inject(DomSanitizer).bypassSecurityTrustHtml(EVENT_ART['Cultural']);
  login = ''; password = '';
  busy = signal(false); error = signal('');
  submit() {
    this.busy.set(true); this.error.set('');
    this.auth.login(this.login, this.password).subscribe({
      next: () => { this.busy.set(false); this.router.navigateByUrl(this.auth.home()); },
      error: e => { this.busy.set(false); this.error.set(errText(e)); },
    });
  }
}
