import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { SUBJECTS } from '../../core/format';
import { copyText } from '../../core/clipboard';
import { StaffDocsComponent } from '../shared/staff-docs.component';

@Component({
  selector: 'app-teachers', standalone: true, imports: [FormsModule, StaffDocsComponent],
  template: `
  <div class="head"><div><h1>Teachers</h1><p class="sub">{{ rows().length }} teachers. Mark a teacher on leave from Leave & substitutes.</p></div>
    <span class="bar" style="margin:0"><button class="btn" (click)="docs.set({ type: 'PRINCIPAL', who: 'Principal (you)' })">My documents</button>
      <button class="btn acc" (click)="showForm.set(!showForm())">{{ showForm() ? 'Close form' : '+ Invite teacher' }}</button></span></div>
  <div class="stack">
    @if (showForm()) {
      <section class="panel"><div class="ph"><h2>Invite a teacher</h2></div>
        <form class="form" (ngSubmit)="add()">
          <label>Full name<input type="text" name="name" [(ngModel)]="f.name" required placeholder="e.g. Mrs. Kavitha Rao"></label>
          <label>Subject<select name="subject" [(ngModel)]="f.subject">@for (s of subjects; track s) { <option>{{ s }}</option> }</select></label>
          <label>Teacher type<select name="category" [(ngModel)]="f.category"><option value="PRIMARY">Primary (Nursery, LKG, UKG and classes 1 to 5)</option><option value="SECONDARY">Secondary (classes 6 to 10)</option></select></label>
          <label>Phone<input type="text" name="phone" [(ngModel)]="f.phone" placeholder="+91 98xxx xxxxx"></label>
          <label>Email (their login)<input type="email" name="login" [(ngModel)]="f.login" required placeholder="teacher@school.in"></label>
          <div><button class="btn pri" type="submit">Create invite</button></div></form>
        @if (error()) { <div class="err" style="margin-top:10px">{{ error() }}</div> }
        @if (link()) { <div class="note" style="margin-top:12px">Send this link to the teacher. It works once and they set their own password. @if (emailOn()) { <b>We also emailed it.</b> } @else { Email is not set up yet, so send the link yourself. }
          <div class="cred" style="margin-top:8px;word-break:break-all">{{ link() }}</div>
          <div class="bar" style="margin:8px 0 0"><button class="btn sm" type="button" (click)="copy()">Copy link</button></div></div> }
        <p class="muted" style="margin:10px 0 0;font-size:13px">New teachers start with no periods, so they are offered first as substitutes. Waiting invites are listed under Invites.</p></section> }
    <section class="panel">
      <div class="bar"><input type="search" [(ngModel)]="q" (ngModelChange)="typed()" placeholder="Search teacher…" aria-label="Search teacher">
        <select [(ngModel)]="subject" (change)="load()" aria-label="Subject"><option value="">All subjects</option>@for (s of subjects; track s) { <option>{{ s }}</option> }</select>
        <select [(ngModel)]="type" aria-label="Teacher type"><option value="">All types</option><option value="PRIMARY">Primary</option><option value="SECONDARY">Secondary</option></select></div>
      <div class="tw"><table><thead><tr><th>Name</th><th>Type</th><th>Subject</th><th>Phone</th><th>Documents</th><th class="n">Periods / week</th><th class="n">Periods today</th><th>Today</th><th></th></tr></thead><tbody>
        @for (t of shown(); track t.id) {
          <tr><td><b>{{ t.name }}</b></td>
            <td><select class="inl" [ngModel]="t.category" (ngModelChange)="setType(t, $event)" [attr.aria-label]="'Type of ' + t.name"><option value="">Not set</option><option value="PRIMARY">Primary (to class 5)</option><option value="SECONDARY">Secondary (6 to 10)</option></select></td>
            <td>{{ t.subject }}</td><td class="mono">{{ t.phone }}</td>
            <td><button class="btn sm" type="button" (click)="docs.set({ type: 'TEACHER', id: t.id, who: t.name })">{{ t.documents ? 'View (' + t.documents + ')' : 'Add' }}</button></td><td class="n">{{ t.periodsPerWeek }}</td><td class="n">{{ t.periodsToday }}</td>
            <td><span class="pill" [class.warn]="t.onLeave" [class.good]="!t.onLeave">{{ t.onLeave ? 'On leave' : 'In school' }}</span></td>
            <td>@if (t.periodsPerWeek === 0) { @if (confirmId() === t.id) { <button class="btn sm danger" (click)="remove(t)">Confirm remove</button> } @else { <button class="btn sm" (click)="confirmId.set(t.id)">Remove</button> } }</td></tr> }
      </tbody></table></div>
    </section>
  </div>
  @if (docs(); as d) { <app-staff-docs [who]="d.who" [ownerType]="d.type" [ownerId]="d.id ?? null" (closed)="docs.set(null); load()"/> }`,
})
export class TeachersComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  subjects = SUBJECTS; rows = signal<any[]>([]); showForm = signal(false); confirmId = signal<number | null>(null);
  q = ''; subject = ''; type = ''; docs = signal<any>(null); f = { name: '', subject: 'Maths', phone: '', login: '', category: 'PRIMARY' }; error = signal(''); link = signal(''); emailOn = signal(false); private t: any;
  ngOnInit() { this.load(); }
  typed() { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 250); }
  shown = () => this.rows().filter(t => !this.type || t.category === this.type);
  setType(t: any, v: string) { this.api.put<any>('/school/teachers/' + t.id + '/category', { category: v }).subscribe({ next: () => { t.category = v; this.toast.show('Type updated'); }, error: e => { this.toast.show(errText(e)); this.load(); } }); }
  load() { this.api.get<any[]>('/school/teachers', { q: this.q, subject: this.subject }).subscribe(r => this.rows.set(r)); }
  add() {
    this.error.set(''); this.link.set('');
    this.api.post<any>('/invites/teacher', this.f).subscribe({ next: r => { this.link.set(r.link); this.emailOn.set(!!r.emailEnabled); this.toast.show(this.f.name + ' invited'); this.f = { name: '', subject: 'Maths', phone: '', login: '', category: this.f.category }; this.load(); }, error: e => this.error.set(errText(e)) });
  }
  copy() { copyText(this.link()).then(ok => this.toast.show(ok ? 'Link copied' : 'Select the link and copy it')); }
  remove(t: any) { this.api.delete('/school/teachers/' + t.id).subscribe({ next: () => { this.toast.show(t.name + ' removed'); this.confirmId.set(null); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
