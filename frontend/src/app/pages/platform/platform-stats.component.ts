import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { InrPipe } from '../../core/format';

@Component({
  selector: 'app-platform-stats', standalone: true, imports: [FormsModule, InrPipe],
  template: `
  <div class="head"><div><h1>Statistics · all schools</h1><p class="sub">Attendance, fee collection, uniform and stationery dues for every school.</p></div>
    <label class="inl">Period <select [(ngModel)]="days" (change)="load()" aria-label="Period"><option [ngValue]="7">Last 7 days</option><option [ngValue]="30">Last 30 days</option><option [ngValue]="90">Last 90 days</option></select></label></div>
  @if (error()) { <div class="err">{{ error() }}</div> }
  @if (d(); as d) {
  <div class="stack">
    <div class="kpis">
      <div class="kpi"><div class="l">Schools</div><div class="v">{{ d.totals.schools }}</div></div>
      <div class="kpi"><div class="l">Students</div><div class="v">{{ d.totals.students }}</div></div>
      <div class="kpi"><div class="l">Attendance ({{ d.days }}d)</div><div class="v">{{ d.totals.periodPct }}%</div></div>
      <div class="kpi good"><div class="l">Fees collected</div><div class="v">{{ d.totals.feeCollected | inr }}</div></div>
      <div class="kpi bad"><div class="l">Fees outstanding</div><div class="v">{{ d.totals.feeOutstanding | inr }}</div></div>
      <div class="kpi warn"><div class="l">Uniform + stationery unpaid</div><div class="v">{{ d.totals.uniformUnpaid + d.totals.stationeryUnpaid | inr }}</div></div>
    </div>
    <section class="panel"><div class="ph"><h2>School by school</h2><span class="muted small">Open "View as school" for class-wise detail</span></div>
      @if (d.schools.length === 0) { <div class="empty">No schools yet.</div> } @else {
      <div class="tw"><table><thead><tr><th>School</th><th class="n">Students</th><th class="n">Present today</th><th class="n">Absent today</th><th class="n">Attendance ({{ d.days }}d)</th><th class="n">Fee after discount</th><th class="n">Discounts</th><th class="n">Collected</th><th class="n">Outstanding</th><th class="n">Students owing</th><th class="n">Uniform unpaid</th><th class="n">Stationery unpaid</th><th></th></tr></thead><tbody>
        @for (s of d.schools; track s.id) {
          <tr><td><b>{{ s.name }}</b><div class="muted small">{{ s.city }}</div></td><td class="n">{{ s.students }}</td><td class="n">{{ s.todayPresent }}</td><td class="n">{{ s.todayAbsent }}</td><td class="n">{{ s.periodPct }}%</td>
            <td class="n">{{ s.feeNet | inr }}</td><td class="n">{{ s.feeDiscount | inr }}</td><td class="n">{{ s.feeCollected | inr }} <span class="muted small">({{ s.feePct }}%)</span></td><td class="n">{{ s.feeOutstanding | inr }}</td><td class="n">{{ s.studentsWithDue }}</td>
            <td class="n">{{ s.uniformUnpaid | inr }}</td><td class="n">{{ s.stationeryUnpaid | inr }}</td>
            <td><button class="btn sm pri" (click)="view(s)">Class-wise</button></td></tr> }
      </tbody></table></div> }
    </section>
  </div> }`,
  styles: [`.inl{display:flex;align-items:center;gap:8px;font-weight:600}.small{font-size:13px}`],
})
export class PlatformStatsComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  d = signal<any>(null); error = signal(''); days = 30;
  ngOnInit() { this.load(); }
  load() { this.api.get('/stats/platform', { days: this.days }).subscribe({ next: r => { this.d.set(r); this.error.set(''); }, error: e => this.error.set(errText(e)) }); }
  view(s: any) { this.auth.viewAs(s.id, s.name, '/statistics'); }
}
