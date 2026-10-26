import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe, InrPipe } from '../../core/format';
import { copyText } from '../../core/clipboard';

@Component({
  selector: 'app-students', standalone: true, imports: [FormsModule, ClassPipe, InrPipe, RouterLink],
  template: `
  <div class="head"><div><h1>Students</h1><p class="sub">{{ rows().length }} students shown.</p></div>
    <button class="btn acc" (click)="open()">{{ showForm() ? 'Close form' : '+ Add student' }}</button></div>
  <div class="stack">
    @if (showForm()) {
      <section class="panel"><div class="ph"><h2>{{ editId() ? 'Edit student' : 'Add student & invite parent' }}</h2></div>
        <form class="form" (ngSubmit)="save()">
          <label>Student name<input type="text" name="name" [(ngModel)]="f.name" required></label>
          @if (classes().length === 0) { <div class="note" style="grid-column:1/-1">There are no classes yet. <a routerLink="/classes">Add a class first</a>, then come back to add students.</div> }
          <label>Class<select name="classCode" [(ngModel)]="f.classCode" required>@for (c of classes(); track c.code) { <option [value]="c.code">{{ c.code | cls }}</option> }</select></label>
          <label>Parent name<input type="text" name="parentName" [(ngModel)]="f.parentName" required></label>
          <label>Parent phone<input type="text" name="phone" [(ngModel)]="f.phone" required></label>
          @if (editId()) { <label>Annual fee (₹)<input type="number" name="feeTotal" [(ngModel)]="f.feeTotal"></label>
          <label>Fee paid (₹)<input type="number" name="feePaid" [(ngModel)]="f.feePaid"></label> } @else {
          <label>Parent email (their login)<input type="email" name="login" [(ngModel)]="f.login" required></label> }
          <div><button class="btn pri" type="submit" [disabled]="classes().length === 0">{{ editId() ? 'Save changes' : 'Add & create invite' }}</button></div></form>
        @if (link()) { <div class="note" style="margin-top:12px">Send this link to the parent. It works once and they set their own password. @if (emailOn()) { <b>We also emailed it.</b> } @else { Email is not set up yet, so send the link yourself. }
          <div class="cred" style="margin-top:8px;word-break:break-all">{{ link() }}</div>
          <div class="bar" style="margin:8px 0 0"><button class="btn sm" type="button" (click)="copy()">Copy link</button></div></div> }
        @if (error()) { <div class="err" style="margin-top:10px">{{ error() }}</div> }</section> }
    <section class="panel">
      <div class="bar"><input type="search" [(ngModel)]="q" (ngModelChange)="typed()" placeholder="Search name, parent or phone…" aria-label="Search students">
        <select [(ngModel)]="classCode" (change)="load()" aria-label="Class"><option value="">All classes</option>@for (c of classes(); track c.code) { <option [value]="c.code">Class {{ c.code | cls }}</option> }</select>
        <select [(ngModel)]="status" (change)="load()" aria-label="Status"><option value="">Any status</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="NOT_MARKED">Not marked</option></select></div>
      @if (rows().length === 0) { <div class="empty">No students match.</div> } @else {
      <div class="tw"><table><thead><tr><th>Class</th><th class="n">Roll</th><th>Name</th><th>Parent</th><th>Parent phone</th><th>Today</th><th class="n">Fee due</th><th></th></tr></thead><tbody>
        @for (s of rows(); track s.id) {
          <tr><td>{{ s.classCode | cls }}</td><td class="n">{{ s.roll }}</td><td><b>{{ s.name }}</b></td><td>{{ s.parentName }}</td><td class="mono">{{ s.phone }}</td>
            <td><span class="pill" [class.good]="s.today==='PRESENT'" [class.bad]="s.today==='ABSENT'">{{ s.today === 'NOT_MARKED' ? 'Not marked' : s.today === 'PRESENT' ? 'Present' : 'Absent' }}</span></td>
            <td class="n" [style.color]="s.feeDue ? 'var(--bad)' : 'var(--muted)'">{{ s.feeDue ? (s.feeDue | inr) : 'Paid' }}</td>
            <td><button class="btn sm" (click)="edit(s)">Edit</button>
              @if (confirmId() === s.id) { <button class="btn sm danger" (click)="remove(s)">Confirm delete</button> } @else { <button class="btn sm" (click)="confirmId.set(s.id)">Delete</button> }</td></tr> }
      </tbody></table></div> }
    </section>
  </div>`,
})
export class StudentsComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast); private route = inject(ActivatedRoute);
  rows = signal<any[]>([]); classes = signal<any[]>([]); showForm = signal(false); editId = signal<number | null>(null); confirmId = signal<number | null>(null); error = signal(''); link = signal(''); emailOn = signal(false);
  q = ''; classCode = ''; status = ''; private t: any;
  f: any = { name: '', classCode: '8A', parentName: '', phone: '+91 ', feeTotal: 44000, feePaid: 0 };
  ngOnInit() {
    this.classCode = this.route.snapshot.queryParamMap.get('classCode') ?? '';
    this.api.get<any[]>('/school/classes').subscribe(c => { this.classes.set(c); if (c.length && !c.some(x => x.code === this.f.classCode)) this.f.classCode = c[0].code; });
    this.load();
  }
  typed() { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 250); }
  load() { this.api.get<any[]>('/school/students', { q: this.q, classCode: this.classCode, status: this.status }).subscribe(r => this.rows.set(r)); }
  open() { if (this.showForm()) { this.showForm.set(false); return; } this.editId.set(null); this.f = { name: '', classCode: this.classCode || this.classes()[0]?.code || '8A', parentName: '', phone: '+91 ', login: '', feeTotal: 0, feePaid: 0 }; this.link.set(''); this.error.set(''); this.showForm.set(true); }
  edit(s: any) { this.editId.set(s.id); this.f = { name: s.name, classCode: s.classCode, parentName: s.parentName, phone: s.phone, feeTotal: s.feeTotal, feePaid: s.feePaid }; this.error.set(''); this.showForm.set(true); window.scrollTo(0, 0); }
  save() {
    this.error.set('');
    if (this.editId()) {
      this.api.put('/school/students/' + this.editId(), this.f).subscribe({ next: () => { this.toast.show('Student updated'); this.showForm.set(false); this.load(); }, error: e => this.error.set(errText(e)) });
      return;
    }
    this.api.post<any>('/invites/student', this.f).subscribe({ next: r => { this.link.set(r.link); this.emailOn.set(!!r.emailEnabled); this.toast.show(this.f.name + ' added'); this.load(); }, error: e => this.error.set(errText(e)) });
  }
  copy() { copyText(this.link()).then(ok => this.toast.show(ok ? 'Link copied' : 'Select the link and copy it')); }
  remove(s: any) { this.api.delete('/school/students/' + s.id).subscribe({ next: () => { this.toast.show(s.name + ' removed'); this.confirmId.set(null); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
