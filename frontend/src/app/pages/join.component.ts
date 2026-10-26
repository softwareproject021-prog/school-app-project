import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, errText } from '../core/api.service';
import { Auth } from '../core/auth.service';

const WHO: Record<string, string> = { ORG_ADMIN: 'principal', TEACHER: 'teacher', PARENT: 'parent' };

/** Page opened from an invitation link: the person sets their own password and is signed in. */
@Component({
  selector: 'app-join', standalone: true, imports: [FormsModule, RouterLink],
  template: `
  <header class="top"><div class="logo"><i>C</i>Campus1Cloud</div></header>
  <div class="plain">
    <section class="panel" style="max-width:440px;width:100%">
      @if (info(); as i) {
        <img src="campus1cloud-logo.png" alt="Campus1Cloud" style="display:block;width:min(200px,60%);margin:0 auto 12px;border-radius:12px">
        <h2>Welcome, {{ i.name }}</h2>
        <p class="sub">{{ i.reset ? 'Set a new password for' : 'You are invited to join' }}
          @if (i.schoolName) { <b>{{ i.schoolName }}</b> } @else { Campus1Cloud }
          as {{ who(i.role) }}. Your login will be <b>{{ i.login }}</b>.</p>
        <form class="form" style="margin-top:14px" (ngSubmit)="submit()">
          <label>Choose a password<input type="password" name="pw" [(ngModel)]="pw" autocomplete="new-password" minlength="10" required></label>
          <label>Repeat password<input type="password" name="pw2" [(ngModel)]="pw2" autocomplete="new-password" required></label>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <div><button class="btn pri" type="submit" style="width:100%;padding:10px" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Set password & continue' }}</button></div>
        </form>
        <p class="muted" style="font-size:13px;margin:10px 0 0">At least 10 characters with letters and numbers. This link works once.</p>
      } @else if (bad()) {
        <a class="btn sm" routerLink="/login" style="text-decoration:none;margin-bottom:12px;display:inline-flex">← Back to sign in</a><h2>Invite not available</h2><div class="err" style="margin-top:10px">{{ bad() }}</div>
      } @else { <div class="empty"><span class="spin"></span> Checking your invite…</div> }
    </section>
  </div>`,
})
export class JoinComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private router = inject(Router); private route = inject(ActivatedRoute);
  info = signal<any>(null); bad = signal(''); error = signal(''); busy = signal(false);
  pw = ''; pw2 = ''; private token = '';
  who = (r: string) => WHO[r] ?? 'a member';
  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.api.get('/auth/invite/' + encodeURIComponent(this.token)).subscribe({ next: r => this.info.set(r), error: e => this.bad.set(errText(e)) });
  }
  submit() {
    if (this.pw.length < 10 || !/[A-Za-z]/.test(this.pw) || !/[0-9]/.test(this.pw)) { this.error.set('Use at least 10 characters with letters and numbers.'); return; }
    if (this.pw !== this.pw2) { this.error.set('The two passwords do not match.'); return; }
    this.busy.set(true); this.error.set('');
    this.auth.acceptInvite(this.token, this.pw).subscribe({
      next: () => { this.busy.set(false); this.router.navigateByUrl(this.auth.home()); },
      error: e => { this.busy.set(false); this.error.set(errText(e)); },
    });
  }
}
