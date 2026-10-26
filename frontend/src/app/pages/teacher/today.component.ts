import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { ClassPipe, PERIODS } from '../../core/format';
import { longToday } from '../../core/dates';

@Component({
  selector: 'app-today', standalone: true, imports: [RouterLink, ClassPipe],
  template: `
  @if (d(); as d) {
  <div class="head"><div><h1>Good day, {{ d.name }}</h1><p class="sub">{{ d.subject }} teacher · {{ today }}</p></div><a class="btn pri" routerLink="/attendance">Mark attendance</a></div>
  <div class="stack">
    <div class="kpis"><div class="kpi"><div class="l">Periods today</div><div class="v">{{ d.periods.length }}</div></div><div class="kpi warn"><div class="l">Substitute duties</div><div class="v">{{ d.substituteDuties }}</div></div>
      <div class="kpi"><div class="l">My classes</div><div class="v">{{ d.myClasses.length }}</div></div><div class="kpi"><div class="l">Leave pending</div><div class="v">{{ d.pendingLeave }}</div></div></div>
    @if (d.onLeave) { <div class="note">You are on approved leave today. Your periods have been handed to substitutes.</div> }
    @for (c of d.classTeacherOf; track c.classCode) { <div class="note">You are class teacher of <b>{{ c.classCode | cls }}</b> · attendance {{ c.submitted ? 'submitted' : 'not submitted yet' }}. <button class="btn sm" (click)="openAtt(c.classCode)">Open {{ c.classCode | cls }}</button></div> }
    <section class="panel"><div class="ph"><h2>My periods today</h2></div>
      @if (d.periods.length === 0) { <div class="empty">No periods today.</div> } @else {
      <div class="tw"><table><thead><tr><th>Period</th><th>Time</th><th>Class</th><th>Subject</th><th>Duty</th><th></th></tr></thead><tbody>
        @for (p of d.periods; track p.classCode + p.period) {
          <tr><td>P{{ p.period + 1 }}</td><td class="mono">{{ times[p.period] }}</td><td><b>{{ p.classCode | cls }}</b></td><td>{{ p.subject }}</td>
            <td><span class="pill" [class.warn]="p.substitute">{{ p.substitute ? 'Substitute' : 'Regular' }}</span></td><td><button class="btn sm" (click)="openAtt(p.classCode)">Attendance</button></td></tr> }</tbody></table></div> }
    </section>
  </div>
  } @else if (error()) { <div class="err">{{ error() }}</div> } @else { <div class="empty"><span class="spin"></span> Loading…</div> }`,
})
export class TodayComponent implements OnInit {
  private api = inject(Api); private router = inject(Router);
  d = signal<any>(null); error = signal(''); today = longToday(); times = PERIODS;
  ngOnInit() { this.api.get('/portal/teacher').subscribe({ next: r => this.d.set(r), error: e => this.error.set(errText(e)) }); }
  openAtt(code: string) { this.router.navigate(['/attendance'], { queryParams: { classCode: code } }); }
}
