import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { InrPipe, ClassPipe } from '../../core/format';
import { longToday } from '../../core/dates';

@Component({
  selector: 'app-dashboard', standalone: true, imports: [RouterLink, InrPipe, ClassPipe],
  template: `
  <div class="head"><div><h1>{{ school() }}</h1><p class="sub">{{ today }}</p></div><a class="btn pri" routerLink="/attendance">Mark attendance</a></div>
  @if (error()) { <div class="err">{{ error() }}</div> }
  @if (d(); as d) {
  <div class="stack">
    <div class="kpis">
      <div class="kpi"><div class="l">Students</div><div class="v">{{ d.students }}</div></div>
      <div class="kpi good"><div class="l">Present</div><div class="v">{{ d.present }}</div></div>
      <div class="kpi bad"><div class="l">Absent</div><div class="v">{{ d.absent }}</div></div>
      <div class="kpi"><div class="l">Attendance</div><div class="v">{{ d.attendancePct }}%</div></div>
      <div class="kpi warn"><div class="l">Not submitted</div><div class="v">{{ d.classesNotSubmitted }} classes</div></div>
      <div class="kpi"><div class="l">Teachers on leave</div><div class="v">{{ d.teachersOnLeave }}</div></div>
    </div>
    @if (d.classesNotSubmitted) { <div class="note">{{ d.classesNotSubmitted }} class(es) have not submitted attendance yet. Parents of absent students are alerted only after submission. <a class="btn sm" routerLink="/attendance">Go to attendance</a></div> }
    @if (d.teachersOnLeave) { <div class="note">{{ d.teachersOnLeave }} teacher(s) on leave today · {{ d.substitutionsAssigned }} period(s) covered. <a class="btn sm" routerLink="/leave">Manage substitutes</a></div> }
    <div class="grid2">
      <section class="panel"><div class="ph"><h2>Class-wise attendance</h2><span class="muted" style="font-size:13px">present / strength</span></div>
        <div class="cbars">@for (c of d.classes; track c.code) {
          <div class="cbar"><b>{{ c.code | cls }}</b>
            @if (c.submitted) { <div class="track"><div class="fill" [style.width.%]="c.strength ? c.present / c.strength * 100 : 0"></div></div><span class="ns">{{ c.present }}/{{ c.strength }}</span> }
            @else { <div><span class="pill">Not submitted</span></div><span class="ns">–/{{ c.strength }}</span> }
          </div> }</div></section>
      <div class="stack">
        <section class="panel"><div class="ph"><h2>Coming up</h2><a class="btn sm" routerLink="/events">Events</a></div>
          <div class="feed">@for (e of d.upcomingEvents; track e.title) { <div class="it"><span>{{ e.title }}</span><span class="mono muted">{{ e.date }}</span></div> }</div></section>
        <section class="panel"><div class="ph"><h2>Needs attention</h2></div><div class="feed">
          <div class="it"><span>Low-stock store items</span><b class="mono">{{ d.lowStockItems }}</b></div>
          <div class="it"><span>Fees outstanding</span><b class="mono">{{ d.feesOutstanding | inr }}</b></div></div></section>
      </div>
    </div>
  </div>
  } @else if (!error()) { <div class="empty"><span class="spin"></span> Loading…</div> }`,
})
export class DashboardComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth);
  d = signal<any>(null); error = signal(''); today = longToday();
  school = () => this.auth.viewing()?.name ?? this.auth.user()?.schoolName ?? 'School';
  ngOnInit() { this.api.get('/school/dashboard').subscribe({ next: r => this.d.set(r), error: e => this.error.set(errText(e)) }); }
}
