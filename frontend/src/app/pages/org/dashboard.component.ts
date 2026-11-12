import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { InrPipe, ClassPipe } from '../../core/format';
import { longToday } from '../../core/dates';
import { DonutComponent, Slice } from '../../core/donut.component';

/** The principal's home: a greeting, quick actions, today's attendance, fee collection, the week's attendance trend, and what needs attention. */
@Component({
  selector: 'app-dashboard', standalone: true, imports: [RouterLink, InrPipe, ClassPipe, DonutComponent],
  styles: [`
    .hero{border-radius:16px;background:var(--grad);color:#fff;padding:22px 22px 18px;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-end}
    .hero h1{margin:0;font-size:26px;line-height:1.2;color:#fff}.hero p{margin:4px 0 0;opacity:.85}
    .hero .acts{display:flex;flex-wrap:wrap;gap:8px}
    .hero .acts a{background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.28);border-radius:99px;padding:8px 14px;font-weight:600;font-size:14px;text-decoration:none}
    .hero .acts a:hover{background:rgba(255,255,255,.28)}
    .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
    .tile{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit}
    .tile .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:19px;flex:none;background:var(--sunk)}
    .tile .l{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
    .tile .v{font:700 22px/1.15 var(--mono);font-variant-numeric:tabular-nums}
    .tile.good .ic{background:var(--good-soft)}.tile.bad .ic{background:var(--bad-soft)}.tile.warn .ic{background:var(--warn-soft)}
    .ring{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
    .ring svg{width:130px;height:130px;flex:none}
    .ring .big{font:700 28px var(--mono)}
    .legend{display:grid;gap:6px;font-size:14px}.legend b{font-family:var(--mono)}
    .dotk{display:inline-block;width:10px;height:10px;border-radius:99px;margin-right:6px}
    .trend{display:flex;align-items:flex-end;gap:8px;height:120px;margin-top:6px}
    .trend .col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px;min-width:0}
    .trend .bar{width:100%;max-width:34px;border-radius:8px 8px 3px 3px;background:var(--grad);min-height:4px}
    .trend .bar.none{background:var(--line)}
    .trend small{font-size:11px;color:var(--muted)}.trend .pc{font:600 11px var(--mono)}
    .rings{display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start}.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{background:var(--sunk);border:1px solid var(--line);padding:4px 12px;border-radius:99px;font-size:14px}
    h3{font:600 15px/1.3 var(--display);margin:16px 0 8px}
    .todo{display:grid;gap:8px}
    .todo a,.todo div.row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--sunk);color:inherit;text-decoration:none;border:1px solid var(--line)}
    .todo .warn{background:var(--warn-soft);border-color:transparent}.todo .bad{background:var(--bad-soft);border-color:transparent}.todo .ok{background:var(--good-soft);border-color:transparent}
    .todo b{font-family:var(--mono)}
  `],
  template: `
  <div class="stack">
    @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
    <section class="hero">
      <div><p>{{ greeting() }}</p><h1>{{ school() }}</h1><p>{{ today }}</p></div>
      <nav class="acts" aria-label="Quick actions"><a routerLink="/attendance">Mark attendance</a><a routerLink="/admission">New admission</a><a routerLink="/fees">Receive fee</a><a routerLink="/timetable">Timetable</a><a routerLink="/transport">Buses</a></nav>
    </section>
    @if (d(); as d) {
    <div class="tiles">
      <a class="tile" routerLink="/students"><span class="ic" aria-hidden="true">🎓</span><div><div class="l">Students</div><div class="v">{{ d.students }}</div></div></a>
      <a class="tile" routerLink="/teachers"><span class="ic" aria-hidden="true">👩‍🏫</span><div><div class="l">Teachers</div><div class="v">{{ d.teachers }}</div></div></a>
      <a class="tile good" routerLink="/attendance"><span class="ic" aria-hidden="true">✅</span><div><div class="l">Present today</div><div class="v">{{ d.present }}</div></div></a>
      <a class="tile bad" routerLink="/attendance"><span class="ic" aria-hidden="true">🚫</span><div><div class="l">Absent today</div><div class="v">{{ d.absent }}</div></div></a>
      <a class="tile" routerLink="/transport"><span class="ic" aria-hidden="true">🚌</span><div><div class="l">Buses</div><div class="v">{{ d.buses }}</div></div></a>
      <a class="tile" routerLink="/admission"><span class="ic" aria-hidden="true">📝</span><div><div class="l">Admissions this month</div><div class="v">{{ d.admissionsThisMonth }}</div></div></a>
    </div>

    <div class="grid2">
      <section class="panel"><div class="ph"><h2>Today's attendance</h2><a class="btn sm" routerLink="/attendance">Open</a></div>
        <div class="ring">
          <svg viewBox="0 0 42 42" role="img" [attr.aria-label]="'Attendance ' + d.attendancePct + ' percent'">
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--line)" stroke-width="5"/>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--good)" stroke-width="5" stroke-linecap="round" [attr.stroke-dasharray]="d.attendancePct + ' ' + (100 - d.attendancePct)" stroke-dashoffset="25"/>
          </svg>
          <div><div class="big">{{ d.attendancePct }}%</div><div class="legend">
            <span><i class="dotk" style="background:var(--good)"></i>Present <b>{{ d.present }}</b></span><span><i class="dotk" style="background:var(--bad)"></i>Absent <b>{{ d.absent }}</b></span>
            <span><i class="dotk" style="background:var(--line)"></i>Not submitted <b>{{ d.classesNotSubmitted }}</b> {{ d.classesNotSubmitted === 1 ? 'class' : 'classes' }}</span></div></div>
        </div>
        <div class="muted" style="margin-top:14px;font-size:13px">Last 7 days</div>
        <div class="trend">@for (t of d.attendanceTrend; track t.date) {
          <div class="col"><span class="pc">{{ t.pct == null ? '–' : t.pct + '%' }}</span><div class="bar" [class.none]="t.pct == null" [style.height.%]="t.pct == null ? 3 : t.pct"></div><small>{{ dayName(t.date) }}</small></div> }</div>
      </section>

      <section class="panel"><div class="ph"><h2>Fee collection</h2><a class="btn sm" routerLink="/fees">Fee register</a></div>
        <div class="ring">
          <svg viewBox="0 0 42 42" role="img" [attr.aria-label]="'Collected ' + collectedPct() + ' percent of fees'">
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--line)" stroke-width="5"/>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--brand)" stroke-width="5" stroke-linecap="round" [attr.stroke-dasharray]="collectedPct() + ' ' + (100 - collectedPct())" stroke-dashoffset="25"/>
          </svg>
          <div><div class="big">{{ collectedPct() }}%</div><div class="legend">
            <span><i class="dotk" style="background:var(--brand)"></i>Collected <b>{{ d.feesCollected | inr }}</b></span>
            <span><i class="dotk" style="background:var(--line)"></i>Outstanding <b>{{ d.feesOutstanding | inr }}</b></span>
            <span class="muted">Total billed <b>{{ d.feesBilled | inr }}</b></span></div></div>
        </div>
        <h3 style="margin:16px 0 6px;font-size:14px">Latest receipts</h3>
        @if (d.recentReceipts.length) { <div class="feed">@for (r of d.recentReceipts; track r.receiptNo) {
          <div class="it"><span>{{ r.student }} <span class="muted">· {{ r.classCode | cls }} · {{ r.receiptNo }}{{ r.office ? ' · office' : '' }}</span></span><b class="mono">{{ r.amount | inr }}</b></div> }</div> }
        @else { <div class="muted">No payments yet.</div> }
      </section>
    </div>

    @if (st(); as s) {
    <div class="grid2">
      <section class="panel"><div class="ph"><h2>Students absent</h2><span class="muted" style="font-size:13px">{{ s.attendance.today.absent }} today of {{ s.attendance.today.students }}</span></div>
        <div class="rings">
          <app-donut title="Absent today, by class" [slices]="absentByClass()" [centerText]="s.attendance.today.absent + ''" sub="absent" [size]="140" [selected]="picked()" (pick)="pick($event)"/>
          <app-donut [title]="'Last ' + s.attendance.period.days + ' days'" [slices]="studentsPeriod()" [centerText]="s.attendance.period.pct + '%'" sub="present" [size]="140"/>
        </div>
        @if (picked()) { <h3>Class {{ picked() | cls }}: absent today</h3>
          @if (pickedNames().length) { <div class="chips">@for (n of pickedNames(); track $index) { <span class="chip">{{ n }}</span> }</div> } @else { <div class="muted">No one is absent.</div> } }
        @if (s.attendance.frequentAbsentees.length) { <h3>Absent most often</h3>
          <div class="feed">@for (x of s.attendance.frequentAbsentees.slice(0, 3); track x.studentId) { <div class="it"><span>{{ x.name }} <span class="muted">· {{ x.classCode | cls }}</span></span><b class="mono">{{ x.absentDays }} days</b></div> }</div> }
      </section>
      @if (s.teachers) {
      <section class="panel"><div class="ph"><h2>Teachers absent</h2><span class="muted" style="font-size:13px">{{ s.teachers.onLeaveToday }} on leave today of {{ s.teachers.total }}</span></div>
        <div class="rings">
          <app-donut title="Today" [slices]="teachersToday()" [centerText]="s.teachers.total - s.teachers.onLeaveToday + ''" sub="present" [size]="140"/>
          <app-donut [title]="'Leave days, last ' + s.days + ' days'" [slices]="leaveByTeacher()" [centerText]="s.teachers.leaveDays + ''" sub="leave days" [size]="140"/>
        </div>
        <h3>On leave today</h3>
        @if (onLeave().length === 0) { <div class="muted">Every teacher is present today.</div> }
        <div class="chips">@for (t of onLeave(); track t.id) { <span class="chip">{{ t.name }} · {{ t.subject }}</span> }</div>
      </section> }
    </div>
    }

    <div class="grid2">
      <section class="panel"><div class="ph"><h2>Needs your attention</h2></div>
        <div class="todo">
          @if (d.classesNotSubmitted) { <a class="warn" routerLink="/attendance"><span>{{ d.classesNotSubmitted }} class(es) have not submitted attendance</span><b>Open →</b></a> }
          @if (d.pendingLeaves) { <a class="warn" routerLink="/leave"><span>{{ d.pendingLeaves }} leave request(s) waiting for you</span><b>Review →</b></a> }
          @if (d.teachersOnLeave) { <a class="bad" routerLink="/leave"><span>{{ d.teachersOnLeave }} teacher(s) on leave · {{ d.substitutionsAssigned }} period(s) covered</span><b>Substitutes →</b></a> }
          @if (d.feesOutstanding) { <a routerLink="/fees"><span>Fees outstanding</span><b>{{ d.feesOutstanding | inr }}</b></a> }
          @if (d.lowStockItems) { <a routerLink="/store"><span>Low-stock store items</span><b>{{ d.lowStockItems }}</b></a> }
          @if (!d.classesNotSubmitted && !d.pendingLeaves && !d.teachersOnLeave && !d.lowStockItems) { <div class="row ok"><span>Everything is on track today.</span><b>✓</b></div> }
        </div></section>
      <section class="panel"><div class="ph"><h2>Coming up</h2><a class="btn sm" routerLink="/events">Events</a></div>
        @if (d.upcomingEvents.length) { <div class="feed">@for (e of d.upcomingEvents; track e.title) { <div class="it"><span>{{ e.title }}</span><span class="mono muted">{{ e.date }}</span></div> }</div> }
        @else { <div class="muted">No events coming up.</div> }</section>
    </div>

    <section class="panel"><div class="ph"><h2>Class-wise attendance</h2><span class="muted" style="font-size:13px">present / strength</span></div>
      <div class="cbars">@for (c of d.classes; track c.code) {
        <div class="cbar"><b>{{ c.code | cls }}</b>
          @if (c.submitted) { <div class="track"><div class="fill" [style.width.%]="c.strength ? c.present / c.strength * 100 : 0"></div></div><span class="ns">{{ c.present }}/{{ c.strength }}</span> }
          @else { <div><span class="pill">Not submitted</span></div><span class="ns">–/{{ c.strength }}</span> }
        </div> }</div></section>
    } @else if (!error()) { <div class="empty"><span class="spin"></span> Loading…</div> }
  </div>`,
})
export class DashboardComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  d = signal<any>(null); error = signal(''); today = longToday();
  collectedPct = computed(() => { const x = this.d(); return x && x.feesBilled ? Math.min(100, Math.round(x.feesCollected * 100 / x.feesBilled)) : 0; });
  school = () => this.auth.viewing()?.name ?? this.auth.user()?.schoolName ?? 'School';
  greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  dayName(iso: string) { return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }); }
  st = signal<any>(null); picked = signal<string | null>(null);
  private readonly PAL = ['#1d4ed8', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#4f46e5', '#be123c', '#65a30d', '#9333ea'];
  private readonly OK = 'var(--good, #2b8a55)'; private readonly BAD = 'var(--bad, #c0392b)';
  pick(k: string) { this.picked.set(this.picked() === k ? null : k); }
  studentsPeriod(): Slice[] { const p = this.st().attendance.period; return [{ key: 'p', label: 'Present days', value: p.present, color: this.OK }, { key: 'a', label: 'Absent days', value: p.absent, color: this.BAD }]; }
  absentByClass(): Slice[] { return this.st().attendance.classes.filter((c: any) => c.submitted && c.absentToday > 0).map((c: any, i: number) => ({ key: c.code, label: 'Class ' + c.code.replace(/^(\d+)(\w)$/, '$1-$2'), value: c.absentToday, color: this.PAL[i % this.PAL.length] })); }
  pickedNames(): string[] { const c = this.st().attendance.classes.find((k: any) => k.code === this.picked()); return c ? c.absentNames : []; }
  teachersToday(): Slice[] { const t = this.st().teachers; return [{ key: 'p', label: 'Present', value: t.total - t.onLeaveToday, color: this.OK }, { key: 'l', label: 'On leave', value: t.onLeaveToday, color: this.BAD }]; }
  leaveByTeacher(): Slice[] { return this.st().teachers.teachers.filter((t: any) => t.leaveDays > 0).map((t: any, i: number) => ({ key: String(t.id), label: t.name, value: t.leaveDays, color: this.PAL[i % this.PAL.length] })); }
  onLeave(): any[] { return this.st().teachers.teachers.filter((t: any) => t.onLeaveToday); }
  ngOnInit() {
    this.api.get('/school/dashboard').subscribe({ next: r => this.d.set(r), error: e => this.error.set(errText(e)) });
    this.api.get('/stats/school', { days: 30 }).subscribe({ next: r => this.st.set(r), error: () => this.st.set(null) });
  }
}
