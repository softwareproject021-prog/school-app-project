import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe, SUBJECTS } from '../../core/format';
import { isoToday } from '../../core/dates';

const clock = (hhmm: string, add = 0) => { const [h, m] = hhmm.split(':').map(Number); const t = (h * 60 + m + add) % 1440; const hh = Math.floor(t / 60), mm = t % 60; return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`; };

@Component({
  selector: 'app-exam-schedule', standalone: true, imports: [FormsModule, ClassPipe],
  styles: [`.nx{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.nx .big{font:700 22px var(--mono)}.fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:10px}`],
  template: `
  <div class="head"><div><h1>Examinations</h1><p class="sub">{{ canEdit ? 'Set which class writes which subject, and when. Parents and teachers see it here.' : 'Dates and times of the examinations.' }}</p></div></div>
  <div class="stack">
    @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
    @if (next(); as n) { <section class="panel"><div class="nx"><span class="pill good">Next exam</span><b class="big">{{ n.subject }}</b><span>{{ n.examName }}{{ staff ? ' · Class ' + (n.classCode | cls) : '' }}</span><span class="muted">{{ dateText(n.date) }} · {{ clock(n.startTime) }}</span></div></section> }
    <section class="panel">
      <div class="bar" style="margin:0 0 8px">
        <select [(ngModel)]="exam" (change)="load()" aria-label="Examination"><option value="">All examinations</option>@for (e of exams(); track e.code) { <option [value]="e.code">{{ e.name }}</option> }</select>
        @if (staff) { <select [(ngModel)]="classCode" (change)="load()" aria-label="Class"><option value="">All classes</option>@for (c of classes(); track c.code) { <option [value]="c.code">Class {{ c.code | cls }}</option> }</select> }
      </div>
      @for (g of groups(); track g.name) {
        <h2 style="margin:14px 0 4px">{{ g.name }}</h2>
        <div class="tw"><table><thead><tr><th>Date</th><th>Time</th>@if (staff) { <th>Class</th> }<th>Subject</th><th>Note</th><th>Status</th>@if (canEdit) { <th></th> }</tr></thead><tbody>
          @for (p of g.items; track p.id) {
            <tr><td>{{ dateText(p.date) }}</td><td class="mono">{{ clock(p.startTime) }} – {{ clock(p.startTime, p.minutes) }}</td>@if (staff) { <td>{{ p.classCode | cls }}</td> }<td><b>{{ p.subject }}</b></td><td>{{ p.note }}</td>
              <td><span class="pill" [class.good]="p.date > today" [class.warn]="p.date === today">{{ p.date > today ? 'Upcoming' : p.date === today ? 'Today' : 'Done' }}</span></td>
              @if (canEdit) { <td><button class="btn sm" type="button" (click)="startEdit(p)" [attr.aria-label]="'Edit ' + p.subject">Edit</button>
                @if (confirmId() === p.id) { <button class="btn sm danger" type="button" (click)="remove(p)">Confirm</button> } @else { <button class="btn sm" type="button" (click)="confirmId.set(p.id)">Remove</button> }</td> }</tr> }
        </tbody></table></div>
      } @empty { @if (loaded()) { <div class="empty">{{ canEdit ? 'No examination papers scheduled yet. Add the first one below.' : 'No examination has been scheduled yet.' }}</div> } }
    </section>
    @if (canEdit) {
      <section class="panel"><div class="ph"><h2>{{ editId() ? 'Edit paper' : 'Add a paper' }}</h2></div>
        <form class="form" (ngSubmit)="save()">
          <div class="fgrid">
            <label>Examination<select name="ex" [(ngModel)]="f.exam">@for (e of exams(); track e.code) { <option [value]="e.code">{{ e.name }}</option> }</select></label>
            <label>Class<select name="cl" [(ngModel)]="f.classCode">@for (c of classes(); track c.code) { <option [value]="c.code">{{ c.code | cls }}</option> }</select></label>
            <label>Subject<input type="text" name="su" [(ngModel)]="f.subject" list="ex-subjects" maxlength="40"></label>
            <label>Date<input type="date" name="da" [(ngModel)]="f.date"></label>
            <label>Start time<input type="time" name="st" [(ngModel)]="f.startTime"></label>
            <label>Minutes<input type="number" name="mi" [(ngModel)]="f.minutes" min="15" max="480"></label></div>
          <datalist id="ex-subjects">@for (s of subjectList; track s) { <option [value]="s"></option> }</datalist>
          <label>Note (optional)<input type="text" name="no" [(ngModel)]="f.note" maxlength="120" placeholder="e.g. Bring geometry box"></label>
          <div class="bar" style="margin:0"><button class="btn pri" type="submit" [disabled]="busy()">{{ busy() ? 'Saving…' : editId() ? 'Save changes' : 'Add paper' }}</button>@if (editId()) { <button class="btn" type="button" (click)="reset()">Cancel</button> }</div>
        </form></section> }
  </div>`,
})
export class ExamScheduleComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast);
  role = this.auth.effectiveRole(); staff = this.role !== 'PARENT'; canEdit = this.role === 'ORG_ADMIN';
  today = isoToday(); clock = clock; subjectList = SUBJECTS;
  exams = signal<any[]>([]); classes = signal<any[]>([]); rows = signal<any[]>([]); loaded = signal(false); error = signal(''); busy = signal(false); confirmId = signal<number | null>(null); editId = signal<number | null>(null);
  exam = ''; classCode = '';
  f: any = { exam: 'QUARTERLY', classCode: '', subject: '', date: '', startTime: '09:30', minutes: 120, note: '' };
  groups = computed(() => { const m = new Map<string, any[]>(); for (const r of this.rows()) { if (!m.has(r.examName)) m.set(r.examName, []); m.get(r.examName)!.push(r); } return [...m].map(([name, items]) => ({ name, items })); });
  next = computed(() => this.rows().filter(r => r.date >= this.today).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0] ?? null);
  dateText(iso: string) { return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  ngOnInit() {
    this.api.get<any>('/exams').subscribe(r => { this.exams.set(r.exams); this.f.exam = r.exams.find((e: any) => e.code === 'QUARTERLY') ? 'QUARTERLY' : r.exams[0]?.code; });
    if (this.staff) this.api.get<any[]>('/school/classes').subscribe(c => { this.classes.set(c); this.f.classCode = c[0]?.code ?? ''; });
    this.load();
  }
  load() {
    this.error.set('');
    const q: any = {}; if (this.exam) q.exam = this.exam; if (this.staff && this.classCode) q.classCode = this.classCode;
    this.api.get<any[]>('/exam-schedule', q).subscribe({ next: r => { this.rows.set(r); this.loaded.set(true); }, error: e => { this.loaded.set(true); this.error.set(errText(e)); } });
  }
  reset() { this.editId.set(null); this.f = { ...this.f, subject: '', note: '' }; }
  startEdit(p: any) { this.editId.set(p.id); this.f = { exam: p.exam, classCode: p.classCode, subject: p.subject, date: p.date, startTime: p.startTime, minutes: p.minutes, note: p.note }; window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
  save() {
    this.error.set(''); this.busy.set(true);
    const id = this.editId(), call = id ? this.api.put<any>('/exam-schedule/' + id, this.f) : this.api.post<any>('/exam-schedule', this.f);
    call.subscribe({ next: () => { this.busy.set(false); this.toast.show(id ? 'Paper updated' : 'Paper added'); this.reset(); this.load(); }, error: e => { this.busy.set(false); this.error.set(errText(e)); } });
  }
  remove(p: any) { this.api.delete('/exam-schedule/' + p.id).subscribe({ next: () => { this.confirmId.set(null); this.toast.show('Paper removed'); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
