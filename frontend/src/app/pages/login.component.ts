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
  <header class="top"><a class="logo" href="/" style="text-decoration:none;color:inherit"><i>C</i>Campus1Cloud</a></header>
  <main style="padding-block:28px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))">
    <div class="loginwrap">
      <section class="lhero">
        <p class="mono" style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#ffd88a">School management platform</p>
        <h1>Every school you run, on one desk.</h1>
        <p>Attendance with instant parent alerts, substitute teachers in one click, fees, events and more, for every school in your group.</p>
        <div class="rolechips"><span class="rc1">Main Admin</span><span class="rc2">Principal</span><span class="rc3">Teacher</span><span class="rc4">Parent</span></div>
        <div class="art" [innerHTML]="art"></div>
      </section>
      <section class="lform">
        <a class="btn sm" routerLink="/" style="text-decoration:none;margin-bottom:12px;display:inline-flex">← Back to home</a>
        <img src="campus1cloud-logo.png" alt="Campus1Cloud: learn, manage, grow together" style="display:block;width:min(240px,70%);margin:0 auto 14px;border-radius:12px">
        <h2>Sign in</h2>
        <p class="sub">Use the login you created from your invitation link. New here? Ask your school (or Campus1Cloud) to send you an invite.</p>
        <form class="form" style="margin-top:16px" (ngSubmit)="submit()">
          <label>Email / login<input type="text" name="login" [(ngModel)]="login" autocomplete="username" placeholder="you@school.in"></label>
          <label>Password<input type="password" name="password" [(ngModel)]="password" autocomplete="current-password"></label>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <div><button class="btn pri" type="submit" style="width:100%;padding:10px" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button></div>
          <div style="text-align:center"><a routerLink="/forgot" style="font-size:14px">Forgot password?</a></div>
        </form>
      </section>
    </div>
  </main>`,
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
