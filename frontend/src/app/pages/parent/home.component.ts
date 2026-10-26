import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { ClassPipe, InrPipe } from '../../core/format';

@Component({
  selector: 'app-parent-home', standalone: true, imports: [RouterLink, ClassPipe, InrPipe],
  template: `
  @if (d(); as d) {
  <div class="head"><div class="kid"><div class="avatar">{{ d.name.charAt(0) }}</div><div><h1>{{ d.name }}</h1>
    <p class="sub" style="margin:2px 0 0">Class {{ d.classCode | cls }} · Roll {{ d.roll }} · Class teacher {{ d.classTeacher }}</p></div></div></div>
  <div class="stack">
    <div class="kpis">
      <div class="kpi" [class.bad]="d.today==='ABSENT'" [class.good]="d.today==='PRESENT'"><div class="l">Today</div><div class="v" style="font-size:20px">{{ d.today === 'NOT_MARKED' ? 'Not taken yet' : d.today === 'ABSENT' ? 'Absent' : 'Present' }}</div></div>
      <div class="kpi"><div class="l">Attendance (30 days)</div><div class="v">{{ d.attendancePct }}%</div></div>
      <div class="kpi" [class.bad]="d.feeDue>0" [class.good]="d.feeDue===0"><div class="l">Fee due</div><div class="v">{{ d.feeDue ? (d.feeDue | inr) : 'Nil' }}</div></div>
      <div class="kpi"><div class="l">UT-1 average</div><div class="v">{{ avg(d) }}/50</div></div></div>
    @if (d.feeDue > 0) { <div class="note">{{ d.feeDue | inr }} school fee is pending. <a class="btn sm acc" routerLink="/child-fees">Pay now</a></div> }
    <div class="grid2">
      <section class="panel"><div class="ph"><h2>Attendance · last 30 days</h2></div>
        <div class="days">@for (h of d.history; track h.date) { <span [class.a]="h.absent" [title]="h.absent ? 'Absent' : 'Present'">{{ h.date.slice(8) }}</span> }</div>
        <p class="muted" style="margin:10px 0 0;font-size:13px">Red = absent.</p></section>
      <section class="panel"><div class="ph"><h2>Marks · Unit Test 1</h2><a class="btn sm" routerLink="/child-marks">Details</a></div>
        <div class="feed">@for (m of d.marks; track m.subject) { <div class="it"><span>{{ m.subject }}</span><b class="mono" [style.color]="m.belowPass ? 'var(--bad)' : 'inherit'">{{ m.marks }}/{{ m.max }}</b></div> }</div></section>
    </div>
  </div>
  } @else if (error()) { <div class="err">{{ error() }}</div> } @else { <div class="empty"><span class="spin"></span> Loading…</div> }`,
})
export class ParentHomeComponent implements OnInit {
  private api = inject(Api);
  d = signal<any>(null); error = signal('');
  avg = (d: any) => d.marks.length ? Math.round(d.marks.reduce((a: number, m: any) => a + m.marks, 0) / d.marks.length) : 0;
  ngOnInit() { this.api.get('/portal/parent').subscribe({ next: r => this.d.set(r), error: e => this.error.set(errText(e)) }); }
}
