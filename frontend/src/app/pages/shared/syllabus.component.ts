import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe, SUBJECTS } from '../../core/format';

const LABEL: Record<string, string> = { TODO: 'Not started', DOING: 'In progress', DONE: 'Completed' };

@Component({
  selector: 'app-syllabus', standalone: true, imports: [FormsModule, ClassPipe],
  styles: [`.sumt{margin:4px 0 14px}.sumt .sp{display:flex;align-items:center;gap:10px;min-width:150px}.sumt .sp .pb{flex:1;margin:0}.sumt tr.tot td{border-top:2px solid var(--line);background:var(--surface-2,transparent)}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
    .sg{display:flex;flex-direction:column;gap:6px}.sh{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.sh h2{margin:0}
    .pb{height:8px;border-radius:99px;background:var(--line);overflow:hidden;margin:6px 0 4px}.pb i{display:block;height:100%;background:var(--good,#1f9d63);border-radius:99px}
    .tp{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);flex-wrap:wrap}.tp .t{flex:1;min-width:180px}.tp .t b{font-weight:600}.tp .t span{display:block;font-size:12px;color:var(--muted)}
    .st{display:inline-flex;border:1px solid var(--line);border-radius:99px;overflow:hidden}.st button{border:0;background:var(--surface);color:var(--ink);padding:6px 11px;font-weight:600;font-size:13px;cursor:pointer}
    .st button.on.TODO{background:var(--line)}.st button.on.DOING{background:var(--warn-soft,#fff1d6);color:var(--warn,#a86400)}.st button.on.DONE{background:var(--good,#1f9d63);color:#fff}
    .chips{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px}.chips button{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:6px 13px;border-radius:99px;font-weight:600;cursor:pointer}.chips button.on{background:var(--brand);color:var(--brand-ink);border-color:var(--brand)}`],
  template: `
  <div class="head"><div><h1>Syllabus</h1><p class="sub">{{ staff ? 'Add the topics of each subject and update how far they have been taught. Any teacher can update any class.' : 'What your child\\'s class is learning, and how far each subject has been taught.' }}</p></div></div>
  <div class="stack">
    @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
    <section class="panel">
      <div class="bar" style="margin:0 0 10px">
        @if (staff) { <label style="display:flex;gap:8px;align-items:center;font-weight:700">Class
          <select [(ngModel)]="classCode" (change)="load()" aria-label="Class">@for (c of classes(); track c.code) { <option [value]="c.code">{{ c.code | cls }}</option> }</select></label> }
        @else if (classCode) { <span class="pill good">Class {{ classCode | cls }}</span> }
        @if (rows().length) { <span class="muted">{{ subjDone() }} of {{ subjects().length }} subjects completed ({{ pct() }}%)</span> }
      </div>
      @if (rows().length) {
        <div class="tw"><table class="sumt"><caption class="sr">Syllabus summary by subject</caption><thead><tr><th>Subject</th><th>Status</th></tr></thead><tbody>
          @for (g of summary(); track g.subject) {
            <tr><td><b>{{ g.subject }}</b></td><td><span class="pill" [class.good]="g.status === 'Completed'" [class.warn]="g.status === 'In progress'">{{ g.status }}</span></td></tr> }
          <tr class="tot"><td><b>Overall: {{ subjDone() }} of {{ subjects().length }} subjects completed</b></td>
            <td><span class="sp"><span class="pb" role="img" [attr.aria-label]="'Overall ' + pct() + ' percent of subjects completed'"><i [style.width.%]="pct()"></i></span><b class="mono">{{ pct() }}%</b></span></td></tr>
        </tbody></table></div> }
      @if (subjects().length > 1) { <div class="chips" role="group" aria-label="Subject filter"><button type="button" [class.on]="!subject()" (click)="subject.set('')">All subjects</button>
        @for (s of subjects(); track s) { <button type="button" [class.on]="subject() === s" (click)="subject.set(s)">{{ s }}</button> }</div> }
      @for (g of groups(); track g.subject) {
        <div class="sg"><div class="sh"><h2>{{ g.subject }}</h2><span class="muted">{{ g.status }}</span></div>
          <div class="pb" role="img" [attr.aria-label]="g.subject + ' ' + g.pct + ' percent completed'"><i [style.width.%]="g.pct"></i></div>
          @for (t of g.items; track t.id) {
            <div class="tp"><div class="t"><b>{{ t.title }}</b><span>{{ t.updatedBy ? 'Updated by ' + t.updatedBy : '' }}</span></div>
              @if (staff) {
                <div class="st" role="group" [attr.aria-label]="'Progress of ' + t.title">@for (s of states; track s) { <button type="button" [class]="s + (t.status === s ? ' on' : '')" [attr.aria-pressed]="t.status === s" (click)="setStatus(t, s)">{{ label(s) }}</button> }</div>
                @if (confirmId() === t.id) { <button class="btn sm danger" type="button" (click)="remove(t)">Confirm</button> } @else { <button class="btn sm" type="button" (click)="confirmId.set(t.id)" [attr.aria-label]="'Remove ' + t.title">Remove</button> }
              } @else { <span class="pill" [class.good]="t.status === 'DONE'" [class.warn]="t.status === 'DOING'">{{ label(t.status) }}</span> }
            </div> }
        </div>
      } @empty { @if (loaded()) { <div class="empty">{{ staff ? 'No topics yet for this class. Add the first subject below.' : 'The school has not added the syllabus for your child\\'s class yet.' }}</div> } }
    </section>
    @if (staff && classCode) {
      <section class="panel"><div class="ph"><h2>Add topics to class {{ classCode | cls }}</h2></div>
        <form class="form" (ngSubmit)="add()">
          <label>Subject<input type="text" name="subject" [(ngModel)]="f.subject" list="syl-subjects" maxlength="40" placeholder="e.g. Maths"></label>
          <datalist id="syl-subjects">@for (s of subjectOptions(); track s) { <option [value]="s"></option> }</datalist>
          <label>Topics (one on each line)<textarea name="title" [(ngModel)]="f.title" rows="5" placeholder="Chapter 1 - Real numbers&#10;Chapter 2 - Polynomials"></textarea></label>
          <div><button class="btn pri" type="submit" [disabled]="busy()">{{ busy() ? 'Adding…' : 'Add topics' }}</button></div></form>
      </section> }
  </div>`,
})
export class SyllabusComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast);
  staff = this.auth.effectiveRole() !== 'PARENT';
  states = ['TODO', 'DOING', 'DONE']; label = (s: string) => LABEL[s] ?? s;
  classes = signal<any[]>([]); classCode = ''; rows = signal<any[]>([]); subject = signal(''); loaded = signal(false); error = signal(''); busy = signal(false); confirmId = signal<number | null>(null);
  f = { subject: '', title: '' };
  subjects = computed(() => [...new Set(this.rows().map(r => r.subject))]);
  subjectOptions = computed(() => [...new Set([...this.subjects(), ...SUBJECTS])]);
  private statusOf = (s: string) => { const it = this.rows().filter(r => r.subject === s); return it.length && it.every(r => r.status === 'DONE') ? 'Completed' : it.some(r => r.status !== 'TODO') ? 'In progress' : 'Not started'; };
  subjDone = computed(() => this.subjects().filter(s => this.statusOf(s) === 'Completed').length);
  pct = computed(() => this.subjects().length ? Math.round(this.subjDone() * 100 / this.subjects().length) : 0);
  summary = computed(() => this.subjects().map(s => ({ subject: s, status: this.statusOf(s) })));
  groups = computed(() => this.subjects().filter(s => !this.subject() || s === this.subject()).map(s => {
    const items = this.rows().filter(r => r.subject === s), done = items.filter(r => r.status === 'DONE').length;
    return { subject: s, items, done, status: this.statusOf(s), pct: items.length ? Math.round(done * 100 / items.length) : 0 }; }));
  ngOnInit() {
    if (this.staff) this.api.get<any[]>('/school/classes').subscribe({ next: c => { this.classes.set(c); this.classCode = c[0]?.code ?? ''; this.load(); }, error: e => this.error.set(errText(e)) });
    else this.load();
  }
  load() {
    this.error.set(''); this.subject.set('');
    if (this.staff && !this.classCode) { this.loaded.set(true); return; }
    this.api.get<any[]>('/syllabus', this.staff ? { classCode: this.classCode } : undefined).subscribe({
      next: r => { this.rows.set(r); if (!this.staff && r.length) this.classCode = r[0].classCode; this.loaded.set(true); }, error: e => { this.loaded.set(true); this.error.set(errText(e)); } });
  }
  setStatus(t: any, s: string) {
    if (t.status === s) return; const old = t.status; t.status = s; this.rows.update(r => [...r]);
    this.api.put<any>('/syllabus/' + t.id, { status: s }).subscribe({ error: e => { t.status = old; this.rows.update(r => [...r]); this.toast.show(errText(e)); } });
  }
  add() {
    this.error.set(''); this.busy.set(true);
    this.api.post<any>('/syllabus', { classCode: this.classCode, subject: this.f.subject, title: this.f.title }).subscribe({
      next: r => { this.busy.set(false); this.toast.show(r.added + (r.added === 1 ? ' topic added' : ' topics added')); this.f.title = ''; this.load(); },
      error: e => { this.busy.set(false); this.error.set(errText(e)); } });
  }
  remove(t: any) { this.api.delete('/syllabus/' + t.id).subscribe({ next: () => { this.confirmId.set(null); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
