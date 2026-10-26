import { Component, OnInit, inject, signal } from '@angular/core';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { copyText } from '../../core/clipboard';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../core/auth.service';

const ROLE: Record<string, string> = { ORG_ADMIN: 'Principal', TEACHER: 'Teacher', PARENT: 'Parent' };

/** Everyone you invited: copy the link again or cancel an invite that has not been used. */
@Component({
  selector: 'app-invites', standalone: true, imports: [FormsModule],
  template: `
  <div class="head"><div><h1>Invites</h1><p class="sub">Links work once and expire after 7 days. Resend emails a fresh link (the old one stops working). If email is not set up yet, copy the link instead.</p></div></div>
  @if (auth.role() === 'MAIN_ADMIN' && !auth.viewing()) {
    <section class="panel" style="margin-bottom:14px"><div class="ph"><h2>Check email setup</h2></div>
      <div class="bar"><input type="email" [(ngModel)]="testTo" placeholder="your@email.com" aria-label="Send test email to"><button class="btn pri" (click)="test()" [disabled]="testing()">{{ testing() ? 'Sending…' : 'Send test email' }}</button></div>
      @if (testResult()) { <div class="note" style="margin-top:10px">{{ testResult() }}</div> }
    </section> }
  <section class="panel">
    @if (rows().length === 0) { <div class="empty">No invites yet.</div> } @else {
    <div class="tw"><table><thead><tr><th>Name</th><th>Role</th><th>Login</th><th>School</th><th>Status</th><th></th></tr></thead><tbody>
      @for (r of rows(); track r.id) {
        <tr><td><b>{{ r.name }}</b></td><td>{{ role(r.role) }}</td><td class="mono">{{ r.login }}</td><td>{{ r.schoolName || '' }}</td>
          <td><span class="pill" [class.good]="r.status==='ACCEPTED'" [class.warn]="r.status==='PENDING'" [class.bad]="r.status==='REVOKED'">{{ r.status === 'ACCEPTED' ? 'Joined' : r.status === 'PENDING' ? 'Waiting' : 'Cancelled' }}</span></td>
          <td>@if (r.status === 'PENDING') { <button class="btn sm" (click)="resend(r)" [disabled]="busy() === r.id">Resend email</button> <button class="btn sm" (click)="copy(r)">Copy link</button> <button class="btn sm" (click)="revoke(r)">Cancel</button> }
            @else if (r.status === 'ACCEPTED') { <button class="btn sm" (click)="resend(r)" [disabled]="busy() === r.id">Send password reset</button> }
            @else { <button class="btn sm" (click)="resend(r)" [disabled]="busy() === r.id">Send new invite</button> }</td></tr> }
    </tbody></table></div> }
  </section>`,
})
export class InvitesComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast); auth = inject(Auth);
  testTo = ''; testing = signal(false); testResult = signal('');
  test() {
    this.testing.set(true); this.testResult.set('');
    this.api.post<any>('/platform/test-email', { to: this.testTo }).subscribe({
      next: r => { this.testing.set(false); this.testResult.set(r.result === 'SENT' ? 'Sent from ' + r.from + '. Check the inbox (and spam).' : r.result); },
      error: e => { this.testing.set(false); this.testResult.set(errText(e)); } });
  }
  rows = signal<any[]>([]); busy = signal<number | null>(null); role = (r: string) => ROLE[r] ?? r;
  ngOnInit() { this.load(); }
  load() { this.api.get<any[]>('/invites').subscribe(r => this.rows.set(r)); }
  copy(r: any) { copyText(r.link).then(ok => this.toast.show(ok ? 'Link copied' : r.link)); }
  resend(r: any) {
    this.busy.set(r.id);
    this.api.post<any>('/invites/' + r.id + '/resend').subscribe({
      next: n => {
        this.busy.set(null); this.load();
        if (n.emailEnabled) this.toast.show('Email sent to ' + n.login);
        else copyText(n.link).then(ok => this.toast.show(ok ? 'Email is not set up, so the new link was copied. Send it yourself.' : n.link));
      },
      error: e => { this.busy.set(null); this.toast.show(errText(e)); } });
  }
  revoke(r: any) { this.api.delete('/invites/' + r.id).subscribe({ next: () => { this.toast.show('Invite cancelled'); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
