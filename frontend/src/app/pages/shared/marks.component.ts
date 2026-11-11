import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';

/**
 * Marks and results. The Principal and Main Admin enter any class and subject; the class teacher enters every subject of their class and
 * sees its results; a subject teacher enters only their own subject. Results are worked out from the saved marks.
 */
@Component({
  selector: 'app-marks', standalone: true, imports: [FormsModule, ClassPipe],
  template: `
  <div class="head"><div><h1>Marks and results</h1><p class="sub">{{ examName() }} · academic year {{ year() }}@if (d()) { · out of {{ d().max }}, pass mark {{ d().pass }} }</p></div></div>
  <div class="ftabs" role="tablist" style="margin-bottom:12px">
    <button role="tab" [class.on]="view() === 'enter'" (click)="setView('enter')">Enter marks</button>
    @if (canResults()) { <button role="tab" [class.on]="view() === 'results'" (click)="setView('results')">Results</button> }
    @if (isAdmin) { <button role="tab" [class.on]="view() === 'setup'" (click)="setView('setup')">Marks setup</button> }
  </div>
  @if (error()) { <div class="err">{{ error() }}</div> }

  @if (view() !== 'setup') {
    <section class="panel">
      <div class="ph"><div class="bar" style="margin:0">
        <select [ngModel]="exam" (ngModelChange)="pickExam($event)" aria-label="Examination">@for (e of exams(); track e.code) { <option [value]="e.code">{{ e.name }}</option> }</select>
        <select [ngModel]="classCode" (ngModelChange)="pickClass($event)" aria-label="Class">@for (c of classes(); track c) { <option [value]="c">Class {{ c | cls }}</option> }</select>
        @if (view() === 'enter') { <select [ngModel]="subject" (ngModelChange)="pickSubject($event)" aria-label="Subject">@for (s of subjects(); track s) { <option>{{ s }}</option> }</select> }
      </div>
      @if (view() === 'enter' && d(); as d) { <div class="bar" style="margin:0"><span class="mono">Avg {{ d.average }} · <b style="color:var(--bad)">{{ d.belowPass }}</b> below pass</span>
        <button class="btn acc" (click)="alert()">Alert parents of {{ d.belowPass }} student{{ d.belowPass === 1 ? '' : 's' }}</button></div> }</div>

      @if (view() === 'enter') {
        @if (d(); as d) {
          @if (d.published) { <div class="note" style="margin-bottom:10px">These results are published to parents. Only the Principal can change marks now; withdraw the results first to let teachers edit.</div> }
          <div class="tw"><table><thead><tr><th class="n">Roll</th><th>Name</th><th class="n">{{ subject }} / {{ d.max }}</th><th>Result</th></tr></thead><tbody>
            @for (r of d.rows; track r.studentId) {
              <tr><td class="n">{{ r.roll }}</td><td>{{ r.name }}</td>
                <td class="n"><input type="number" min="0" [max]="d.max" [ngModel]="r.entered ? r.marks : null" (change)="save(r, $any($event.target).value)" style="width:76px;text-align:right" [attr.aria-label]="'Marks for ' + r.name" placeholder="–"></td>
                <td>@if (!r.entered) { <span class="pill">Not entered</span> } @else { <span class="pill" [class.bad]="r.marks < d.pass" [class.good]="r.marks >= d.pass && r.marks * 10 >= d.max * 9">{{ r.marks < d.pass ? 'Below pass' : r.marks * 10 >= d.max * 9 ? 'Distinction' : 'Pass' }}</span> }</td></tr> }</tbody></table></div>
        } @else if (!error()) { <div class="empty">Loading…</div> }
      }

      @if (view() === 'results') {
        @if (rs(); as rs) {
          <div class="bar" style="margin:0 0 10px;justify-content:space-between">
            <span class="mono">{{ rs.summary.students }} students · <b>{{ rs.summary.passed }}</b> passed · <b style="color:var(--bad)">{{ rs.summary.failed }}</b> failed@if (rs.summary.incomplete) { · {{ rs.summary.incomplete }} incomplete } · average {{ rs.summary.averagePercentage }}%@if (rs.summary.topper) { · top: {{ rs.summary.topper }} }</span>
            <span class="bar" style="margin:0"><span class="pill" [class.good]="rs.published">{{ rs.published ? 'Published to parents' : 'Not published' }}</span>
              <button class="btn sm pri" [disabled]="pubBusy()" (click)="publish(!rs.published)">{{ rs.published ? 'Withdraw' : 'Publish to parents' }}</button></span></div>
          <div class="tw"><table><thead><tr><th class="n">Roll</th><th>Name</th>@for (s of rs.subjects; track s) { <th class="n">{{ s }}</th> }<th class="n">Total</th><th class="n">%</th><th>Grade</th><th>Result</th></tr></thead><tbody>
            @for (r of rs.rows; track r.studentId) {
              <tr><td class="n">{{ r.roll }}</td><td>{{ r.name }}</td>
                @for (m of r.subjects; track m.subject) { <td class="n" [style.color]="m.belowPass ? 'var(--bad)' : null">{{ m.marks ?? '–' }}</td> }
                <td class="n">{{ r.total }}/{{ r.maxTotal }}</td><td class="n">{{ r.percentage }}</td><td>{{ r.grade || '–' }}</td>
                <td><span class="pill" [class.bad]="r.result === 'FAIL'" [class.good]="r.result === 'PASS'">{{ r.result === 'INCOMPLETE' ? 'Incomplete' : r.result === 'PASS' ? 'Pass' : 'Fail' }}</span></td></tr> }</tbody></table></div>
        } @else if (!error()) { <div class="empty">Loading…</div> }
      }
    </section>
  }

  @if (view() === 'setup') {
    <section class="panel"><div class="ph"><h2>Maximum and pass marks</h2></div>
      <div class="note" style="margin-bottom:10px">Set these for each exam of your school. Unit tests start at 50 (pass 18), the larger exams at 100 (pass 35). They apply to every subject of the exam.</div>
      <div class="tw"><table><thead><tr><th>Examination</th><th class="n">Maximum</th><th class="n">Pass mark</th><th></th></tr></thead><tbody>
        @for (e of exams(); track e.code) {
          <tr><td>{{ e.name }}</td>
            <td class="n"><input type="number" min="1" max="1000" [ngModel]="e.max" (ngModelChange)="e.max = +$event" style="width:84px;text-align:right" [attr.aria-label]="'Maximum marks for ' + e.name"></td>
            <td class="n"><input type="number" min="0" max="1000" [ngModel]="e.pass" (ngModelChange)="e.pass = +$event" style="width:84px;text-align:right" [attr.aria-label]="'Pass mark for ' + e.name"></td>
            <td><button class="btn sm pri" (click)="saveSetup(e)">Save</button></td></tr> }</tbody></table></div></section>
    <section class="panel"><div class="ph"><h2>Grades</h2></div>
      <div class="note" style="margin-bottom:10px">A student gets the highest grade whose percentage they reach. The lowest grade must start at 0.</div>
      <div class="tw"><table><thead><tr><th class="n">From %</th><th>Grade</th><th></th></tr></thead><tbody>
        @for (g of grades(); track $index) {
          <tr><td class="n"><input type="number" min="0" max="100" [(ngModel)]="g.minPercent" style="width:84px;text-align:right" [attr.aria-label]="'Percentage for grade ' + ($index + 1)"></td>
            <td><input [(ngModel)]="g.grade" maxlength="4" style="width:84px" [attr.aria-label]="'Grade name ' + ($index + 1)"></td>
            <td><button class="btn sm" (click)="removeGrade($index)" [disabled]="grades().length === 1">Remove</button></td></tr> }</tbody></table></div>
      <div class="bar" style="margin-top:10px"><button class="btn sm" (click)="addGrade()" [disabled]="grades().length >= 10">Add a grade</button><button class="btn sm pri" (click)="saveGrades()">Save grades</button></div></section>
  }`,
  styles: [`.ftabs{display:flex;gap:6px;flex-wrap:wrap}.ftabs button{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:8px 16px;border-radius:99px;font-weight:600;cursor:pointer}
    .ftabs button.on{background:var(--grad);color:#fff;border-color:transparent}`],
})
export class MarksComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast);
  isAdmin = this.auth.effectiveRole() !== 'TEACHER';
  exams = signal<any[]>([]); year = signal(''); grades = signal<any[]>([]);
  classes = signal<string[]>([]); subjects = signal<string[]>([]); classTeacher = signal(false);
  exam = 'UT1'; classCode = ''; subject = '';
  view = signal<'enter' | 'results' | 'setup'>('enter');
  d = signal<any>(null); rs = signal<any>(null); error = signal(''); pubBusy = signal(false);

  examName() { return this.exams().find(e => e.code === this.exam)?.name ?? ''; }
  canResults() { return this.isAdmin || this.classTeacher(); }

  ngOnInit() {
    this.api.get('/exams').subscribe({ next: r => { this.exams.set(r.exams); this.year.set(r.year); this.grades.set(r.grades.map((g: any) => ({ ...g }))); }, error: e => this.error.set(errText(e)) });
    const done = (list: string[]) => { this.classes.set(list); this.pickClass(list[0] ?? ''); };
    if (this.isAdmin) this.api.get<any[]>('/school/classes').subscribe(c => done(c.map(x => x.code)));
    else this.api.get('/portal/teacher').subscribe({ next: p => done(p.myClasses), error: e => this.error.set(errText(e)) });
  }
  setView(v: 'enter' | 'results' | 'setup') { this.view.set(v); this.error.set(''); if (v === 'results') this.loadResults(); else if (v === 'enter') this.load(); }
  pickExam(c: string) { this.exam = c; this.refresh(); }
  pickClass(c: string) {
    this.classCode = c; this.d.set(null); this.rs.set(null); this.error.set('');
    if (!c) return;
    this.api.get('/exams/subjects', { classCode: c }).subscribe({
      next: r => { this.subjects.set(r.subjects); this.classTeacher.set(r.classTeacher); this.subject = r.subjects[0] ?? ''; if (this.view() === 'results' && !this.canResults()) this.view.set('enter'); this.refresh(); },
      error: e => { this.subjects.set([]); this.error.set(errText(e)); },
    });
  }
  pickSubject(s: string) { this.subject = s; this.load(); }
  refresh() { if (this.view() === 'results') this.loadResults(); else if (this.view() === 'enter') this.load(); }
  load() { if (this.classCode && this.subject) this.api.get('/marks', { classCode: this.classCode, subject: this.subject, exam: this.exam }).subscribe({ next: r => { this.d.set(r); this.error.set(''); }, error: e => this.error.set(errText(e)) }); }
  loadResults() { if (this.classCode) this.api.get('/results', { classCode: this.classCode, exam: this.exam }).subscribe({ next: r => { this.rs.set(r); this.error.set(''); }, error: e => { this.rs.set(null); this.error.set(errText(e)); } }); }

  save(r: any, v: string) {
    if (v === '' || v === null) return;
    const max = this.d()?.max ?? 100;
    const n = Math.max(0, Math.min(max, Math.round(+v || 0)));
    this.api.put('/marks', { studentId: r.studentId, marks: n }, { subject: this.subject, exam: this.exam }).subscribe({ next: () => this.load(), error: e => { this.toast.show(errText(e)); this.load(); } });
  }
  alert() { this.api.post('/marks/alert', {}, { classCode: this.classCode, subject: this.subject, exam: this.exam }).subscribe({ next: (r: any) => this.toast.show(`${r.alerted} parent(s) alerted about low ${this.subject} marks`), error: e => this.toast.show(errText(e)) }); }
  publish(on: boolean) {
    this.pubBusy.set(true);
    this.api.post('/results/publish', { classCode: this.classCode, exam: this.exam, publish: on }).subscribe({
      next: () => { this.pubBusy.set(false); this.toast.show(on ? 'Results published to parents' : 'Results withdrawn'); this.loadResults(); },
      error: e => { this.pubBusy.set(false); this.toast.show(errText(e)); },
    });
  }

  saveSetup(e: any) { this.api.put('/exams/' + e.code, { max: e.max, pass: e.pass }).subscribe({ next: () => this.toast.show(e.name + ' saved'), error: er => this.toast.show(errText(er)) }); }
  addGrade() { this.grades.set([...this.grades(), { minPercent: 0, grade: '' }]); }
  removeGrade(i: number) { this.grades.set(this.grades().filter((_, k) => k !== i)); }
  saveGrades() {
    const bands = this.grades().map(g => ({ minPercent: Number(g.minPercent), grade: String(g.grade ?? '').trim() }));
    this.api.put('/exams/grades', { bands }).subscribe({ next: () => { this.toast.show('Grades saved'); this.api.get('/exams').subscribe(r => this.grades.set(r.grades.map((g: any) => ({ ...g })))); }, error: e => this.toast.show(errText(e)) });
  }
}
