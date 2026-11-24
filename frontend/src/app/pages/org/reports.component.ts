import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';
import { isoToday } from '../../core/dates';
import { downloadXlsx } from '../../core/excel';

@Component({
  selector: 'app-reports', standalone: true, imports: [FormsModule, ClassPipe],
  styles: [`.rg{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:18px}
    .rf{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:6px 0 12px}.rf label{display:flex;flex-direction:column;gap:3px;font-size:12.5px;font-weight:700;color:var(--muted,#5b6b86)}
    .ri{display:flex;gap:10px;align-items:center;margin:0 0 8px}.ri .ic{width:36px;height:36px;border-radius:10px;background:var(--grad);color:#fff;display:grid;place-items:center;font-size:16px;flex:none}.ri h2{margin:0}`],
  template: `
  <div class="head"><div><h1>Reports</h1><p class="sub">Download your school's records as Excel files. Choose what you need and press Download.</p></div></div>
  @if (error()) { <div class="err">{{ error() }}</div> }
  <div class="rg">
    <section class="panel"><div class="ri"><span class="ic" aria-hidden="true">✓</span><h2>Attendance report</h2></div>
      <p class="muted" style="margin:0">Each student: days present, days absent, percentage and the dates absent.</p>
      <div class="rf">
        <label>From<input type="date" name="af" [(ngModel)]="a.from" [max]="today"></label>
        <label>To<input type="date" name="at" [(ngModel)]="a.to" [max]="today"></label>
        <label>Class<select name="ac" [(ngModel)]="a.classCode"><option value="">All classes</option>@for (c of classes(); track c.code) { <option [value]="c.code">{{ c.code | cls }}</option> }</select></label></div>
      <button class="btn pri" (click)="attendance()" [disabled]="busy() === 'att'">{{ busy() === 'att' ? 'Preparing…' : 'Download Excel' }}</button></section>

    <section class="panel"><div class="ri"><span class="ic" aria-hidden="true">₹</span><h2>Fee report</h2></div>
      <p class="muted" style="margin:0">Each student: class fee, bus, hostel, discount, paid and pending balance.</p>
      <div class="rf">
        <label>Class<select name="fc" [(ngModel)]="fe.classCode"><option value="">All classes</option>@for (c of classes(); track c.code) { <option [value]="c.code">{{ c.code | cls }}</option> }</select></label>
        <label>Show<select name="fs" [(ngModel)]="fe.status"><option value="all">Everyone</option><option value="due">Not paid</option><option value="partial">Part paid</option><option value="paid">Fully paid</option></select></label></div>
      <button class="btn pri" (click)="fees()" [disabled]="busy() === 'fee'">{{ busy() === 'fee' ? 'Preparing…' : 'Download Excel' }}</button></section>

    <section class="panel"><div class="ri"><span class="ic" aria-hidden="true">🧾</span><h2>Fee receipts</h2></div>
      <p class="muted" style="margin:0">Every receipt in the dates you choose: receipt number, student, amount and mode.</p>
      <div class="rf">
        <label>From<input type="date" name="rf" [(ngModel)]="r.from" [max]="today"></label>
        <label>To<input type="date" name="rt" [(ngModel)]="r.to" [max]="today"></label></div>
      <button class="btn pri" (click)="receipts()" [disabled]="busy() === 'rec'">{{ busy() === 'rec' ? 'Preparing…' : 'Download Excel' }}</button></section>

    <section class="panel"><div class="ri"><span class="ic" aria-hidden="true">🎓</span><h2>Student list</h2></div>
      <p class="muted" style="margin:0">All students with class, roll number, parent name and phone.</p>
      <div class="rf"><label>Class<select name="sc" [(ngModel)]="s.classCode"><option value="">All classes</option>@for (c of classes(); track c.code) { <option [value]="c.code">{{ c.code | cls }}</option> }</select></label></div>
      <button class="btn pri" (click)="students()" [disabled]="busy() === 'stu'">{{ busy() === 'stu' ? 'Preparing…' : 'Download Excel' }}</button></section>

    <section class="panel"><div class="ri"><span class="ic" aria-hidden="true">👩‍🏫</span><h2>Teacher list</h2></div>
      <p class="muted" style="margin:0">All teachers with subject, phone and periods per week.</p>
      <div class="rf"></div>
      <button class="btn pri" (click)="teachers()" [disabled]="busy() === 'tea'">{{ busy() === 'tea' ? 'Preparing…' : 'Download Excel' }}</button></section>
  </div>`,
})
export class ReportsComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  today = isoToday();
  classes = signal<any[]>([]); busy = signal(''); error = signal('');
  a: any = { from: this.back(29), to: isoToday(), classCode: '' };
  r: any = { from: this.back(29), to: isoToday() };
  fe: any = { classCode: '', status: 'all' };
  s: any = { classCode: '' };
  back(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  ngOnInit() { this.api.get<any[]>('/school/classes').subscribe(c => this.classes.set(c)); }

  private run(key: string, get: () => import('rxjs').Observable<any>, make: (d: any) => Promise<void>, emptyMsg: string) {
    this.error.set(''); this.busy.set(key);
    get().subscribe({
      next: async d => {
        try { if (!(d.rows ?? d).length) { this.toast.show(emptyMsg); } else { await make(d); this.toast.show('Excel file downloaded'); } }
        catch { this.error.set('Could not make the Excel file. Try again.'); }
        this.busy.set('');
      },
      error: e => { this.busy.set(''); this.error.set(errText(e)); } });
  }
  private range(x: any): boolean { if (!x.from || !x.to) { this.error.set('Choose both dates.'); return false; } if (x.from > x.to) { this.error.set('The From date is after the To date.'); return false; } return true; }

  attendance() {
    if (!this.range(this.a)) return;
    this.run('att', () => this.api.get('/reports/attendance', this.a), d => downloadXlsx(`attendance-${this.a.from}-to-${this.a.to}`, 'Attendance',
      ['Class', 'Roll', 'Student', 'Days present', 'Days absent', 'Days marked', 'Attendance %', 'Dates absent'],
      d.rows.map((x: any) => [x.classCode, x.roll, x.name, x.present, x.absent, x.total, x.percent, x.absentDates]), [10, 8, 26, 14, 13, 13, 14, 50]),
      'No students found for that class.');
  }
  fees() {
    this.run('fee', () => this.api.get('/fees', this.fe), d => downloadXlsx('fee-report-' + isoToday(), 'Fees',
      ['Class', 'Student', 'Phone', 'Class fee', 'Bus fee', 'Hostel fee', 'Total', 'Discount', 'Discount reason', 'To pay', 'Paid', 'Pending'],
      d.rows.map((x: any) => [x.classCode, x.name, x.phone, x.classFee, x.busFee, x.hostelFee, x.feeTotal, x.feeDiscount, x.discountReason, x.feeNet, x.feePaid, x.feeDue]), [10, 26, 14, 12, 10, 11, 11, 11, 24, 12, 12, 12]),
      'No students match those choices.');
  }
  receipts() {
    if (!this.range(this.r)) return;
    this.run('rec', () => this.api.get('/reports/receipts', this.r), d => downloadXlsx(`receipts-${this.r.from}-to-${this.r.to}`, 'Receipts',
      ['Date', 'Receipt no', 'Student', 'Class', 'Amount', 'Mode', 'Note', 'Recorded by'],
      d.rows.map((x: any) => [x.date, x.receiptNo, x.student, x.classCode, x.amount, x.mode, x.note, x.recordedBy]), [12, 14, 26, 10, 12, 10, 30, 18]),
      'No receipts in those dates.');
  }
  students() {
    this.run('stu', () => this.api.get('/school/students', this.s), d => downloadXlsx('students-' + isoToday(), 'Students',
      ['Class', 'Roll', 'Student', 'Parent', 'Phone'], d.map((x: any) => [x.classCode, x.roll, x.name, x.parentName, x.phone]), [10, 8, 26, 26, 16]),
      'No students found.');
  }
  teachers() {
    this.run('tea', () => this.api.get('/school/teachers'), d => downloadXlsx('teachers-' + isoToday(), 'Teachers',
      ['Teacher', 'Subject', 'Phone', 'Periods per week'], d.map((x: any) => [x.name, x.subject, x.phone, x.periodsPerWeek]), [26, 16, 16, 16]),
      'No teachers found.');
  }
}
