import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { InrPipe, ClassPipe } from '../../core/format';
import { longToday } from '../../core/dates';
import { AbsencePieComponent, PieSlice } from '../../core/absence-pie.component';

/** The principal's home: a greeting, quick actions, today's attendance, fee collection, the week's attendance trend, and what needs attention. */
@Component({
  selector: 'app-dashboard', standalone: true, imports: [RouterLink, InrPipe, ClassPipe, AbsencePieComponent],
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
    .ov{position:fixed;inset:0;z-index:60;background:rgb(10 20 45/.55);backdrop-filter:blur(3px);display:grid;place-items:center;padding:16px;animation:fade .15s}
    .dlg{width:min(440px,100%);max-height:80vh;display:flex;flex-direction:column;background:var(--surface);border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgb(10 20 45/.4);animation:rise .18s}
    .dlg header{display:flex;gap:12px;align-items:center;padding:16px 18px;background:color-mix(in srgb,var(--c) 14%,var(--surface));border-bottom:3px solid var(--c)}
    .dlg .sw{width:14px;height:44px;border-radius:99px;background:var(--c);flex:none}.dlg h2{margin:0;font-size:18px}.dlg header p{margin:2px 0 0;color:var(--muted);font-size:13px}
    .dlg .x{margin-left:auto;border:0;background:rgb(0 0 0/.06);width:32px;height:32px;border-radius:99px;cursor:pointer;color:var(--ink);font-size:14px}
    .dlg ul{list-style:none;margin:0;padding:8px 10px;overflow:auto;display:grid;gap:6px}
    .dlg li{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:12px;background:var(--sunk)}
    .dlg .av{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#fff;font:700 14px var(--display)}
    .dlg .nm{font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}.dlg .nt{font-size:12px;color:var(--muted);white-space:nowrap}
    .dlg .none{padding:20px;text-align:center;color:var(--muted);margin:0}.dlg footer{padding:12px 16px;border-top:1px solid var(--line);text-align:right}
    @keyframes fade{from{opacity:0}}@keyframes rise{from{transform:translateY(12px);opacity:0}}
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
      <section class="panel"><div class="ph"><h2>Students absent today</h2><span class="muted" style="font-size:13px">{{ s.attendance.today.absent }} of {{ s.attendance.today.students }} · tap a colour for names</span></div>
        <app-absence-pie title="Absent, class by class" [slices]="studentSlices()" [centerText]="s.attendance.today.absent + ''" sub="absent today" emptyText="Nobody absent" (pick)="openClass($event)"/>
      </section>
      @if (s.teachers) {
      <section class="panel"><div class="ph"><h2>Teachers absent today</h2><span class="muted" style="font-size:13px">{{ s.teachers.onLeaveToday }} of {{ s.teachers.total }} · tap a colour for details</span></div>
        <app-absence-pie title="On leave today" [slices]="teacherSlices()" [centerText]="s.teachers.onLeaveToday + ''" sub="on leave today" emptyText="All teachers present" (pick)="openTeacher($event)"/>
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
  </div>
  @if (pop(); as p) {
    <div class="ov" (click)="pop.set(null)"><div class="dlg" role="dialog" aria-modal="true" [attr.aria-label]="p.title" (click)="$event.stopPropagation()" [style.--c]="p.color">
      <header><span class="sw"></span><div><h2>{{ p.title }}</h2><p>{{ p.sub }}</p></div><button class="x" type="button" (click)="pop.set(null)" aria-label="Close">✕</button></header>
      @if (p.rows.length) { <ul>@for (r of p.rows; track $index) { <li><span class="av">{{ r.ini }}</span><span class="nm">{{ r.name }}</span>@if (r.note) { <span class="nt">{{ r.note }}</span> }</li> }</ul> }
      @else { <p class="none">No names to show.</p> }
      <footer><button class="btn pri" type="button" (click)="pop.set(null)">Close</button></footer>
    </div></div>
  }`,
})
export class DashboardComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  d = signal<any>(null); error = signal(''); today = longToday();
  collectedPct = computed(() => { const x = this.d(); return x && x.feesBilled ? Math.min(100, Math.round(x.feesCollected * 100 / x.feesBilled)) : 0; });
  school = () => this.auth.viewing()?.name ?? this.auth.user()?.schoolName ?? 'School';
  greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  dayName(iso: string) { return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }); }
  st = signal<any>(null); pop = signal<{ title: string; sub: string; color: string; rows: { name: string; ini: string; note?: string }[] } | null>(null);
  private readonly PAL = ['#1d4ed8', '#e11d48', '#16a34a', '#f59e0b', '#7c3aed', '#0891b2', '#db2777', '#ea580c', '#65a30d', '#4f46e5', '#0d9488', '#b45309'];
  private ini = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  private colorOfClass(code: string) { const i = this.st().attendance.classes.findIndex((c: any) => c.code === code); return this.PAL[Math.max(i, 0) % this.PAL.length]; }
  private label(code: string) { return 'Class ' + code.replace(/^(\d+)(\w)$/, '$1-$2'); }
  studentSlices(): PieSlice[] { return this.st().attendance.classes.filter((c: any) => c.submitted && c.absentToday > 0).map((c: any) => ({ key: c.code, label: this.label(c.code), value: c.absentToday, color: this.colorOfClass(c.code) })); }
  teacherSlices(): PieSlice[] { return this.st().teachers.teachers.filter((t: any) => t.onLeaveToday).map((t: any, i: number) => ({ key: String(t.id), label: t.name, value: 1, color: this.PAL[i % this.PAL.length] })); }
  openClass(code: string) {
    const c = this.st().attendance.classes.find((k: any) => k.code === code); if (!c) return;
    this.pop.set({ title: this.label(code) + ' · absent today', sub: c.absentToday + ' of ' + c.strength + ' students absent', color: this.colorOfClass(code), rows: c.absentNames.map((n: string) => ({ name: n, ini: this.ini(n) })) });
  }
  openTeacher(id: string) {
    const list = this.st().teachers.teachers.filter((t: any) => t.onLeaveToday); const i = list.findIndex((t: any) => String(t.id) === id); if (i < 0) return;
    const t = list[i];
    this.pop.set({ title: t.name + ' · on leave today', sub: (t.subject || 'Teacher') + ' · ' + t.leaveDays + ' leave day(s) in the last ' + this.st().days + ' days', color: this.PAL[i % this.PAL.length], rows: [{ name: t.name, ini: this.ini(t.name), note: t.subject }] });
  }
  @HostListener('document:keydown.escape') closePop() { this.pop.set(null); }
  ngOnInit() {
    this.api.get('/school/dashboard').subscribe({ next: r => this.d.set(r), error: e => this.error.set(errText(e)) });
    this.api.get('/stats/school', { days: 30 }).subscribe({ next: r => this.st.set(r), error: () => this.st.set(null) });
  }
}
