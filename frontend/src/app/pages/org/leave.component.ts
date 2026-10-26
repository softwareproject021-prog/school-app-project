import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe, PERIODS } from '../../core/format';

@Component({
  selector: 'app-leave', standalone: true, imports: [FormsModule, ClassPipe],
  template: `
  <div class="head"><div><h1>Leave & substitutes</h1><p class="sub">When a teacher is on leave, assign their periods to teachers who are free in that period. Same-subject teachers are listed first (★), then whoever has the lightest load today.</p></div></div>
  <div class="stack">
    @if (pending().length) {
      <section class="panel"><div class="ph"><h2>Leave requests from teachers</h2><span class="pill warn">{{ pending().length }} pending</span></div>
        <div class="tw"><table><thead><tr><th>Teacher</th><th>Date</th><th>Type</th><th>Reason</th><th></th></tr></thead><tbody>
          @for (r of pending(); track r.id) {
            <tr><td><b>{{ r.teacherName }}</b> <span class="muted">{{ r.subject }}</span></td><td class="mono">{{ r.date }}</td><td>{{ r.kind }}</td><td>{{ r.reason }}</td>
              <td><button class="btn sm pri" (click)="decide(r, 'APPROVED')">Approve</button> <button class="btn sm danger" (click)="decide(r, 'REJECTED')">Reject</button></td></tr> }
        </tbody></table></div></section>
    }
    <section class="panel"><div class="ph"><h2>Mark a teacher on leave today</h2></div>
      <div class="bar" style="margin:0"><select [(ngModel)]="teacherId" aria-label="Teacher">@for (t of teachers(); track t.id) { <option [ngValue]="t.id">{{ t.name }} · {{ t.subject }}</option> }</select>
        <button class="btn pri" (click)="mark()">Mark on leave</button></div></section>
    @for (b of board(); track b.teacherId) {
      <section class="leavecard">
        <div class="ph" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div><h2>{{ b.teacherName }} <span class="pill warn">On leave · {{ b.subject }}</span></h2><p class="sub">{{ b.periods.length }} periods today</p></div>
          <div class="bar" style="margin:0"><button class="btn acc" (click)="auto(b)">Auto-assign all</button><button class="btn" (click)="cancel(b)">Cancel leave</button></div></div>
        <div class="tw"><table><thead><tr><th>Period</th><th>Time</th><th>Class</th><th>Subject</th><th>Substitute</th><th></th></tr></thead><tbody>
          @for (p of b.periods; track p.classCode + p.period) {
            <tr><td>P{{ p.period + 1 }}</td><td class="mono">{{ times[p.period] }}</td><td><b>{{ p.classCode | cls }}</b></td><td>{{ p.subject }}</td>
              <td>@if (p.substituteName) { <span class="pill good">{{ p.substituteName }}</span> }
                @else if (p.noFreeTeacher) { <span class="pill bad">No free teacher — self-study</span> }
                @else { <select [(ngModel)]="choice[key(p)]" aria-label="Choose substitute">@for (c of p.candidates; track c.teacherId) { <option [ngValue]="c.teacherId">{{ c.sameSubject ? '★ ' : '' }}{{ c.name }} · {{ c.subject }} · {{ c.loadToday }} today</option> }</select> }</td>
              <td>@if (p.substituteName) { <button class="btn sm" (click)="unassign(p)">Change</button> }
                @else if (!p.noFreeTeacher) { <button class="btn sm pri" (click)="assign(b, p)">Assign</button> }</td></tr> }
        </tbody></table></div>
      </section>
    } @empty { <div class="empty panel">No teachers on leave today. Mark one above to try the substitute workflow.</div> }
  </div>`,
})
export class LeaveComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  times = PERIODS;
  board = signal<any[]>([]); pending = signal<any[]>([]); teachers = signal<any[]>([]);
  teacherId: number | null = null; choice: Record<string, number> = {};
  key = (p: any) => p.classCode + '|' + p.period;
  ngOnInit() { this.api.get<any[]>('/school/teachers').subscribe(t => { this.teachers.set(t); this.teacherId = (t.find(x => x.subject === 'Maths') ?? t[0])?.id ?? null; }); this.reload(); }
  reload() {
    this.api.get<any[]>('/leave/board').subscribe(b => {
      this.board.set(b);
      for (const t of b) for (const p of t.periods) if (p.candidates?.length && this.choice[this.key(p)] == null) this.choice[this.key(p)] = p.candidates[0].teacherId;
    });
    this.api.get<any[]>('/leave/requests', { status: 'PENDING' }).subscribe(r => this.pending.set(r));
  }
  fail = (e: any) => this.toast.show(errText(e));
  decide(r: any, status: string) { this.api.patch(`/leave/requests/${r.id}`, { status }).subscribe({ next: () => { this.toast.show('Leave ' + status.toLowerCase()); this.reload(); }, error: this.fail }); }
  mark() { if (this.teacherId) this.api.post('/leave/mark', { teacherId: this.teacherId }).subscribe({ next: () => { this.toast.show('Marked on leave. Assign substitutes below'); this.reload(); }, error: this.fail }); }
  cancel(b: any) { this.api.delete('/leave/mark', { teacherId: b.teacherId }).subscribe({ next: () => { this.toast.show('Leave cancelled. Substitutions removed'); this.reload(); }, error: this.fail }); }
  assign(b: any, p: any) {
    this.api.post('/leave/assign', { teacherId: b.teacherId, classCode: p.classCode, period: p.period, substituteId: this.choice[this.key(p)] })
      .subscribe({ next: () => { this.toast.show('Substitute assigned and notified'); this.reload(); }, error: this.fail });
  }
  unassign(p: any) { this.api.delete('/leave/assign', { classCode: p.classCode, period: p.period }).subscribe({ next: () => this.reload(), error: this.fail }); }
  auto(b: any) { this.api.post('/leave/auto-assign', { teacherId: b.teacherId }).subscribe({ next: (r: any) => { this.toast.show(`${r.assigned} period(s) assigned`); this.reload(); }, error: this.fail }); }
}
