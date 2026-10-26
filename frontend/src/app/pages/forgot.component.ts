import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../core/api.service';

/** "Forgot password": asks for the login email and sends a reset link. The answer never reveals whether the account exists. */
@Component({
  selector: 'app-forgot', standalone: true, imports: [FormsModule, RouterLink],
  template: `
  <header class="top"><a class="logo" href="/" style="text-decoration:none;color:inherit"><i>C</i>Campus1Cloud</a></header>
  <main style="padding:28px 16px;display:flex;justify-content:center">
    <section class="panel" style="max-width:440px;width:100%">
      <a class="btn sm" routerLink="/login" style="text-decoration:none;margin-bottom:12px;display:inline-flex">← Back to sign in</a>
      <h2>Forgot your password?</h2>
      <p class="sub">Enter the email you sign in with. We will email you a link to set a new one.</p>
      @if (msg()) { <div class="note" style="margin-top:14px">{{ msg() }}</div> }
      @else {
        <form class="form" style="margin-top:14px" (ngSubmit)="submit()">
          <label>Email<input type="email" name="login" [(ngModel)]="login" required autocomplete="username" placeholder="you@school.in"></label>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <div><button class="btn pri" type="submit" style="width:100%;padding:10px" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Send reset link' }}</button></div>
        </form>
        <p class="muted" style="font-size:13px;margin:10px 0 0">No email on your account? Ask your principal (or Campus1Cloud) to resend your invite from the Invites page.</p>
      }
    </section>
  </main>`,
})
export class ForgotComponent {
  private api = inject(Api);
  login = ''; busy = signal(false); msg = signal(''); error = signal('');
  submit() {
    this.busy.set(true); this.error.set('');
    this.api.post<any>('/auth/forgot-password', { login: this.login }).subscribe({
      next: r => { this.busy.set(false); this.msg.set(r.message); },
      error: e => { this.busy.set(false); this.error.set(errText(e)); } });
  }
}
