import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { ClassPipe } from '../../core/format';
import { DonutComponent, Slice } from '../../core/donut.component';

/** Absence only: students and teachers, each as simple pie charts with a short list underneath. */
@Component({
  selector: 'app-statistics', standalone: true, imports: [FormsModule, ClassPipe, DonutComponent],
  template: `
  <div class="head"><div><h1>Absence statistics</h1><p class="sub">{{ d()?.school }} · who is absent, students and teachers.</p></div>
    <label class="inl">Period <select [(ngModel)]="days" (change)="load()" aria-label="Period"><option [ngValue]="7">Last 7 days</option><option [ngValue]="30">Last 30 days</option><option [ngValue]="90">Last 90 days</option></select></label></div>
  @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
  @if (d(); as d) {
  <div class="stack">
    <section class="panel"><div class="ph"><h2>Students</h2><span class="muted small">{{ d.attendance.today.absent }} absent today of {{ d.attendance.today.students }}</span></div>
      @if (d.attendance.today.classesPending) { <div class="note" style="margin-bottom:12px">{{ d.attendance.today.classesPending }} class(es) have not marked attendance yet today.</div> }
      <div class="rings">
        <app-donut title="Today" [slices]="studentsToday()" [centerText]="d.attendance.today.pct + '%'" sub="present" [size]="150"/>
        <app-donut title="Absent today, by class" [slices]="absentByClass()" [centerText]="d.attendance.today.absent + ''" sub="absent" [size]="150" [selected]="picked()" (pick)="pick($event)"/>
        <app-donut [title]="'Last ' + d.attendance.period.days + ' days'" [slices]="studentsPeriod()" [centerText]="d.attendance.period.pct + '%'" sub="present" [size]="150"/>
      </div>
      @if (picked()) { <div class="drill"><div class="ph"><h3>Class {{ picked() | cls }}: absent today</h3><button class="btn sm" (click)="picked.set(null)">Close</button></div>
        @if (pickedNames().length) { <div class="chips">@for (n of pickedNames(); track $index) { <span class="chip">{{ n }}</span> }</div> } @else { <div class="muted">No one is absent.</div> }</div> }
      <h3>Absent most often</h3>
      @if (d.attendance.frequentAbsentees.length === 0) { <div class="muted">No absences recorded in this period.</div> }
      <div class="feed">@for (s of d.attendance.frequentAbsentees.slice(0, 5); track s.studentId) { <div class="it"><span>{{ s.name }} <span class="muted">· {{ s.classCode | cls }}</span></span><b class="mono">{{ s.absentDays }} days</b></div> }</div>
    </section>

    <section class="panel"><div class="ph"><h2>Teachers</h2><span class="muted small">{{ d.teachers.onLeaveToday }} on leave today of {{ d.teachers.total }}</span></div>
      <div class="rings">
        <app-donut title="Today" [slices]="teachersToday()" [centerText]="d.teachers.total - d.teachers.onLeaveToday + ''" sub="present" [size]="150"/>
        <app-donut [title]="'Leave days, last ' + d.days + ' days'" [slices]="leaveByTeacher()" [centerText]="d.teachers.leaveDays + ''" sub="leave days" [size]="150"/>
      </div>
      <h3>On leave today</h3>
      @if (onLeave().length === 0) { <div class="muted">Every teacher is present today.</div> }
      <div class="chips">@for (t of onLeave(); track t.id) { <span class="chip">{{ t.name }} · {{ t.subject }}</span> }</div>
    </section>
  </div> } @else if (!error()) { <div class="empty"><span class="spin"></span> Loading…</div> }`,
  styles: [`.rings{display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start}.small{font-size:13px}h3{font:600 15px/1.3 var(--display);margin:18px 0 8px}
    .chips{display:flex;flex-wrap:wrap;gap:8px}.chip{background:var(--sunk);border:1px solid var(--line);padding:4px 12px;border-radius:99px;font-size:14px}
    .drill{margin-top:14px;padding:12px;border-radius:10px;background:var(--sunk)}.drill .ph{margin-bottom:8px}.drill h3{margin:0}
    .inl{display:flex;align-items:center;gap:8px;font-weight:600}`],
})
export class StatisticsComponent implements OnInit {
  private api = inject(Api);
  d = signal<any>(null); error = signal(''); days = 30; picked = signal<string | null>(null);
  private readonly PAL = ['#1d4ed8', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#4f46e5', '#be123c', '#65a30d', '#9333ea'];
  private readonly OK = 'var(--good, #2b8a55)'; private readonly BAD = 'var(--bad, #c0392b)'; private readonly MUTE = 'var(--line, #b8c2d6)';
  ngOnInit() { this.load(); }
  load() { this.picked.set(null); this.api.get('/stats/school', { days: this.days }).subscribe({ next: r => { this.d.set(r); this.error.set(''); }, error: e => this.error.set(errText(e)) }); }
  pick(k: string) { this.picked.set(this.picked() === k ? null : k); }
  studentsToday(): Slice[] { const t = this.d().attendance.today; return [{ key: 'p', label: 'Present', value: t.present, color: this.OK }, { key: 'a', label: 'Absent', value: t.absent, color: this.BAD }, { key: 'n', label: 'Not marked', value: Math.max(0, t.students - t.present - t.absent), color: this.MUTE }]; }
  studentsPeriod(): Slice[] { const p = this.d().attendance.period; return [{ key: 'p', label: 'Present days', value: p.present, color: this.OK }, { key: 'a', label: 'Absent days', value: p.absent, color: this.BAD }]; }
  absentByClass(): Slice[] { return this.d().attendance.classes.filter((c: any) => c.submitted && c.absentToday > 0).map((c: any, i: number) => ({ key: c.code, label: 'Class ' + c.code.replace(/^(\d+)(\w)$/, '$1-$2'), value: c.absentToday, color: this.PAL[i % this.PAL.length] })); }
  pickedNames(): string[] { const c = this.d().attendance.classes.find((k: any) => k.code === this.picked()); return c ? c.absentNames : []; }
  teachersToday(): Slice[] { const t = this.d().teachers; return [{ key: 'p', label: 'Present', value: t.total - t.onLeaveToday, color: this.OK }, { key: 'l', label: 'On leave', value: t.onLeaveToday, color: this.BAD }]; }
  leaveByTeacher(): Slice[] { return this.d().teachers.teachers.filter((t: any) => t.leaveDays > 0).map((t: any, i: number) => ({ key: String(t.id), label: t.name, value: t.leaveDays, color: this.PAL[i % this.PAL.length] })); }
  onLeave(): any[] { return this.d().teachers.teachers.filter((t: any) => t.onLeaveToday); }
}
