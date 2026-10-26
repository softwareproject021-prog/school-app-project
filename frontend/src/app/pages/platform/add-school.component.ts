import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { copyText } from '../../core/clipboard';

@Component({
  selector: 'app-add-school', standalone: true, imports: [FormsModule, RouterLink],
  template: `
  <div class="head"><div><h1>Add a school</h1><p class="sub">Creates the school and invites its principal. The principal opens a one-time link and sets their own password. You never see or share a password.</p></div></div>
  <section class="panel">
    <form class="form" (ngSubmit)="save()">
      <label>School name<input type="text" name="name" [(ngModel)]="f.name" required></label>
      <label>City<input type="text" name="city" [(ngModel)]="f.city"></label>
      <label>State<select name="state" [(ngModel)]="f.state"><option>Telangana</option><option>Andhra Pradesh</option><option>Karnataka</option><option>Tamil Nadu</option><option>Maharashtra</option></select></label>
      <label>Plan<select name="plan" [(ngModel)]="f.plan"><option>Basic</option><option>Standard</option><option>Premium</option></select></label>
      <label>Principal name<input type="text" name="adminName" [(ngModel)]="f.adminName" required></label>
      <label>Principal email (their login)<input type="email" name="adminLogin" [(ngModel)]="f.adminLogin" required placeholder="principal@school.in"></label>
      <label>Start as<select name="status" [(ngModel)]="f.status"><option value="TRIAL">Trial</option><option value="ACTIVE">Active</option></select></label>
      <label>Sample data<select name="sampleData" [(ngModel)]="f.sampleData"><option [ngValue]="true">Add sample data</option><option [ngValue]="false">Start empty</option></select></label>
      <div><button class="btn pri" type="submit" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create school & invite principal' }}</button></div>
    </form>
    @if (error()) { <div class="err" style="margin-top:12px">{{ error() }}</div> }
    @if (result(); as r) {
      <div class="note" style="margin-top:14px"><b>{{ f.name }} created.</b> @if (r.emailEnabled) { We emailed the invite to <b>{{ r.login }}</b>. It can take a minute, and may land in spam. } @else { <b>Email is not set up on the server yet</b>, so nothing was emailed. Send this link to {{ r.login }} yourself, or set up Resend (see the Principal invites page). } The link works once and expires in 7 days:
        <div class="cred" style="margin-top:8px;word-break:break-all">{{ r.inviteLink }}</div>
        <div class="bar" style="margin:8px 0 0"><button class="btn sm" type="button" (click)="copy(r.inviteLink)">Copy link</button></div>
        <div class="bar" style="margin:10px 0 0"><button class="btn pri" type="button" (click)="auth.viewAs(r.schoolId, f.name)">View as this school</button><a class="btn" routerLink="/schools">Back to schools</a></div></div>
    }
  </section>`,
})
export class AddSchoolComponent {
  private api = inject(Api); auth = inject(Auth); private toast = inject(Toast);
  copy(t: string) { copyText(t).then(ok => this.toast.show(ok ? 'Link copied' : 'Select the link and copy it')); }
  f: any = { name: '', city: '', state: 'Telangana', plan: 'Standard', adminName: '', adminLogin: '', status: 'TRIAL', sampleData: true };
  busy = signal(false); error = signal(''); result = signal<any>(null);
  save() {
    this.busy.set(true); this.error.set(''); this.result.set(null);
    this.api.post('/platform/schools', this.f).subscribe({ next: r => { this.result.set(r); this.busy.set(false); }, error: e => { this.error.set(errText(e)); this.busy.set(false); } });
  }
}
