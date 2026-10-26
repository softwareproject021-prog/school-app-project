import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { ClassPipe, DAYS, PERIODS, todayIdx } from '../../core/format';

@Component({
  selector: 'app-timetable', standalone: true, imports: [FormsModule, ClassPipe],
  template: `
  <div class="head"><div><h1>Timetable</h1><p class="sub">Today's column is highlighted. Substitute periods are marked “sub”.</p></div></div>
  <section class="panel">
    @if (role === 'ORG_ADMIN') {
      <div class="bar"><select [(ngModel)]="mode" (change)="load()" aria-label="View"><option value="class">By class</option><option value="teacher">By teacher</option></select>
        @if (mode === 'class') { <select [(ngModel)]="classCode" (change)="load()" aria-label="Class">@for (c of classes(); track c.code) { <option [value]="c.code">Class {{ c.code | cls }}</option> }</select> }
        @else { <select [(ngModel)]="teacherId" (change)="load()" aria-label="Teacher">@for (t of teachers(); track t.id) { <option [ngValue]="t.id">{{ t.name }} ({{ t.subject }})</option> }</select> }</div>
    } @else { <p class="muted" style="margin:0 0 12px">{{ role === 'TEACHER' ? 'Your periods for the week, including today\\'s substitute duties.' : 'Your child\\'s class timetable.' }}</p> }
    <div class="tw"><table class="tt"><thead><tr><th>Period</th>@for (d of days; track d; let i = $index) { <th>{{ d }}{{ i === today ? ' · today' : '' }}</th> }</tr></thead><tbody>
      @for (tm of periods; track tm; let p = $index) {
        <tr><th>P{{ p + 1 }}<div class="t mono">{{ tm }}</div></th>
          @for (d of days; track d; let di = $index) {
            @let c = cell(di, p);
            <td [class.today]="di === today" [class.subbed]="c?.substitute">
              @if (c) { @if (byClass()) { <div class="s">{{ c.subject }}{{ c.substitute ? ' · sub' : '' }}</div><div class="t">{{ c.teacherName.replace('Mr. ', '').replace('Mrs. ', '') }}</div> }
                @else { <div class="s">{{ c.classCode | cls }}</div><div class="t">{{ c.subject }}{{ c.substitute ? ' · substitute' : '' }}</div> } }
              @else if (!byClass()) { <span class="muted">Free</span> }
            </td> }
        </tr>
        @if (p === 2) { <tr><td colspan="7" class="muted" style="text-align:center;font-size:12px">Break 11:15 – 11:30</td></tr> }
        @if (p === 4) { <tr><td colspan="7" class="muted" style="text-align:center;font-size:12px">Lunch 1:00 – 1:45</td></tr> }
      }</tbody></table></div>
  </section>`,
})
export class TimetableComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private route = inject(ActivatedRoute);
  role = this.auth.effectiveRole(); days = DAYS; periods = PERIODS; today = todayIdx();
  mode: 'class' | 'teacher' = 'class'; classCode = ''; teacherId: number | null = null;
  classes = signal<any[]>([]); teachers = signal<any[]>([]); slots = signal<any[]>([]);
  byClass = () => this.role === 'PARENT' || (this.role === 'ORG_ADMIN' && this.mode === 'class');
  cell(d: number, p: number) { return this.slots().find(s => s.day === d && s.period === p) ?? null; }
  ngOnInit() {
    if (this.role === 'ORG_ADMIN') {
      this.api.get<any[]>('/school/classes').subscribe(c => { this.classes.set(c); this.classCode = this.route.snapshot.queryParamMap.get('classCode') ?? c[0]?.code ?? ''; this.load(); });
      this.api.get<any[]>('/school/teachers').subscribe(t => { this.teachers.set(t); this.teacherId = t[0]?.id ?? null; });
    } else this.load();
  }
  load() {
    const params = this.role !== 'ORG_ADMIN' ? {} : this.mode === 'class' ? { classCode: this.classCode } : { teacherId: this.teacherId };
    this.api.get<any[]>('/school/timetable', params).subscribe(s => this.slots.set(s));
  }
}
