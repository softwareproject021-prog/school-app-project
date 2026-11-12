import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { ClassPipe, DAYS, PERIODS, todayIdx } from '../../core/format';

@Component({
  selector: 'app-timetable', standalone: true, imports: [FormsModule, ClassPipe],
  template: `
  <div class="head"><div><h1>Timetable</h1><p class="sub">Today's column is highlighted. Substitute periods are marked “sub”.{{ canEditAny() ? ' The principal and the class teacher can change a class timetable with “Edit timetable”.' : '' }}</p></div>
    @if (canEdit()) { <button class="btn" [class.pri]="!edit()" (click)="edit.set(!edit())">{{ edit() ? 'Done editing' : 'Edit timetable' }}</button> }</div>
  @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
  <section class="panel">
    @if (role === 'ORG_ADMIN') {
      <div class="bar"><select [(ngModel)]="mode" (change)="load()" aria-label="View"><option value="class">By class</option><option value="teacher">By teacher</option></select>
        @if (mode === 'class') { <select [(ngModel)]="classCode" (change)="load()" aria-label="Class">@for (c of classes(); track c.code) { <option [value]="c.code">Class {{ c.code | cls }}</option> }</select> }
        @else { <select [(ngModel)]="teacherId" (change)="load()" aria-label="Teacher">@for (t of teachers(); track t.id) { <option [ngValue]="t.id">{{ t.name }} ({{ t.subject }})</option> }</select> }</div>
    } @else if (role === 'TEACHER' && editable().length) {
      <div class="bar"><select [(ngModel)]="mode" (change)="edit.set(false); load()" aria-label="View"><option value="teacher">My periods</option><option value="class">My class timetable (class teacher)</option></select>
        @if (mode === 'class') { <select [(ngModel)]="classCode" (change)="load()" aria-label="Class">@for (c of editable(); track c) { <option [value]="c">Class {{ c | cls }}</option> }</select> }</div>
    } @else { <p class="muted" style="margin:0 0 12px">{{ role === 'TEACHER' ? 'Your periods for the week, including today\\'s substitute duties.' : 'Your child\\'s class timetable.' }}</p> }
    <div class="tw"><table class="tt"><thead><tr><th>Period</th>@for (d of days; track d; let i = $index) { <th>{{ d }}{{ i === today ? ' · today' : '' }}</th> }</tr></thead><tbody>
      @for (tm of periods; track tm; let p = $index) {
        <tr><th>P{{ p + 1 }}<div class="t mono">{{ tm }}</div></th>
          @for (d of days; track d; let di = $index) {
            @let c = cell(di, p);
            <td [class.today]="di === today" [class.subbed]="c?.substitute">
              @if (edit() && canEdit()) {
                <select class="inl" [ngModel]="c ? c.teacherId : null" (ngModelChange)="setSlot(di, p, $event)" [attr.aria-label]="'Teacher for ' + d + ' period ' + (p + 1)"><option [ngValue]="null">Free</option>@for (t of teachers(); track t.id) { <option [ngValue]="t.id">{{ t.name }} · {{ t.subject }}</option> }</select>
              } @else if (c) { @if (byClass()) { <div class="s">{{ c.subject }}{{ c.substitute ? ' · sub' : '' }}</div><div class="t">{{ c.teacherName.replace('Mr. ', '').replace('Mrs. ', '') }}</div> }
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
  editable = signal<string[]>([]); edit = signal(false); error = signal('');
  byClass = () => this.role === 'PARENT' || (this.mode === 'class' && (this.role === 'ORG_ADMIN' || this.editable().length > 0));
  canEditAny = () => this.editable().length > 0;
  canEdit = () => this.byClass() && this.editable().includes(this.classCode);
  setSlot(day: number, period: number, teacherId: number | null) {
    this.error.set('');
    this.api.put<any>('/school/timetable/slot', { classCode: this.classCode, day, period, teacherId }).subscribe({ next: () => this.load(), error: e => { this.error.set(errText(e)); this.load(); } });
  }
  cell(d: number, p: number) { return this.slots().find(s => s.day === d && s.period === p) ?? null; }
  ngOnInit() {
    if (this.role === 'ORG_ADMIN') {
      this.api.get<any[]>('/school/classes').subscribe(c => { this.classes.set(c); this.classCode = this.route.snapshot.queryParamMap.get('classCode') ?? c[0]?.code ?? ''; this.load(); });
      this.api.get<any[]>('/school/teachers').subscribe(t => { this.teachers.set(t); this.teacherId = t[0]?.id ?? null; });
      this.api.get<string[]>('/school/timetable/editable').subscribe(e => this.editable.set(e));
    } else {
      this.mode = this.role === 'TEACHER' ? 'teacher' : 'class';
      if (this.role === 'TEACHER') {
        this.api.get<string[]>('/school/timetable/editable').subscribe(e => { this.editable.set(e); this.classCode = e[0] ?? ''; if (e.length) this.api.get<any[]>('/school/teachers').subscribe(t => this.teachers.set(t)); });
      }
      this.load();
    }
  }
  load() {
    const params = this.role === 'PARENT' ? {} : this.mode === 'class' ? { classCode: this.classCode } : this.role === 'ORG_ADMIN' ? { teacherId: this.teacherId } : {};
    this.api.get<any[]>('/school/timetable', params).subscribe(s => this.slots.set(s));
  }
}
