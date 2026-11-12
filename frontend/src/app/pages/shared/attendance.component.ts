import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';
import { longToday } from '../../core/dates';

@Component({
  selector: 'app-attendance', standalone: true, imports: [FormsModule, ClassPipe],
  styles: [`
    .atop{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between}
    .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0 8px}
    .stat{border-radius:14px;padding:12px 14px;background:var(--sunk);border:1px solid var(--line)}
    .stat .n{font:700 24px/1.1 var(--mono)}.stat .t{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
    .stat.p{background:var(--good-soft);border-color:transparent}.stat.p .n{color:var(--good)}
    .stat.a{background:var(--bad-soft);border-color:transparent}.stat.a .n{color:var(--bad)}
    .prog{height:8px;border-radius:99px;background:var(--bad-soft);overflow:hidden}.prog i{display:block;height:100%;background:var(--good);border-radius:99px;transition:width .2s}
    .tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:14px 0}
    .tools input[type=search]{flex:1;min-width:160px}
    .seg2{display:inline-flex;border:1px solid var(--line);border-radius:99px;overflow:hidden}
    .seg2 button{border:0;background:var(--surface);color:var(--ink);padding:7px 14px;font-weight:600;cursor:pointer}
    .seg2 button.on{background:var(--brand);color:var(--brand-ink)}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
    .card{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:var(--surface);border:2px solid var(--good-soft);transition:border-color .15s,background .15s}
    .card.abs{border-color:var(--bad);background:var(--bad-soft)}
    .av{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font:700 16px var(--display);background:var(--good-soft);color:var(--good)}
    .card.abs .av{background:var(--bad);color:#fff}
    .awho{min-width:0;flex:1}.awho b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.awho span{font-size:12px;color:var(--muted)}
    .tg{display:flex;gap:6px;flex:none}
    .tg button{width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--muted);font:700 15px var(--display);cursor:pointer}
    .tg .yes.on{background:var(--good);border-color:var(--good);color:#fff}.tg .no.on{background:var(--bad);border-color:var(--bad);color:#fff}
    .tg button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .dock{position:sticky;bottom:0;margin:16px -16px -16px;padding:12px 16px;background:var(--surface);border-top:1px solid var(--line);border-radius:0 0 12px 12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
    @media (max-width:520px){.stats .n{font-size:20px}.card{padding:10px}}
  `],
  template: `
  <div class="head"><div><h1>Attendance</h1><p class="sub">{{ today }}. Everyone starts as present. Tap <b>A</b> for absentees, then submit.</p></div></div>
  <section class="panel">
    <div class="atop">
      <div class="bar" style="margin:0"><select [(ngModel)]="classCode" (change)="load()" aria-label="Class">@for (c of classes(); track c) { <option [value]="c">Class {{ c | cls }}</option> }</select>
        @if (sheet(); as s) { <span class="pill" [class.good]="s.submitted" [class.warn]="!s.submitted">{{ s.submitted ? 'Submitted today' : 'Not submitted yet' }}</span> }</div>
      <button class="btn" (click)="allPresent()">Mark all present</button>
    </div>
    @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
    @if (sheet(); as s) {
      <div class="stats" aria-live="polite">
        <div class="stat"><div class="n">{{ s.students.length }}</div><div class="t">Students</div></div>
        <div class="stat p"><div class="n">{{ presentCount() }}</div><div class="t">Present</div></div>
        <div class="stat a"><div class="n">{{ absent().size }}</div><div class="t">Absent</div></div>
      </div>
      <div class="prog" role="img" [attr.aria-label]="presentCount() + ' of ' + s.students.length + ' present'"><i [style.width.%]="s.students.length ? presentCount() / s.students.length * 100 : 0"></i></div>
      <div class="tools">
        <input type="search" [(ngModel)]="q" placeholder="Find a student…" aria-label="Find a student">
        <span class="seg2" role="group" aria-label="Show"><button [class.on]="!onlyAbsent()" (click)="onlyAbsent.set(false)">All</button><button [class.on]="onlyAbsent()" (click)="onlyAbsent.set(true)">Absent ({{ absent().size }})</button></span>
      </div>
      <div class="grid">@for (st of shown(); track st.id) {
        <div class="card" [class.abs]="absent().has(st.id)">
          <span class="av" aria-hidden="true">{{ initials(st.name) }}</span>
          <div class="awho"><b>{{ st.name }}</b><span>Roll {{ st.roll < 10 ? '0' + st.roll : st.roll }} · {{ absent().has(st.id) ? 'Absent' : 'Present' }}</span></div>
          <div class="tg"><button class="yes" [class.on]="!absent().has(st.id)" (click)="mark(st.id, false)" [attr.aria-label]="st.name + ' present'" [attr.aria-pressed]="!absent().has(st.id)">P</button><button class="no" [class.on]="absent().has(st.id)" (click)="mark(st.id, true)" [attr.aria-label]="st.name + ' absent'" [attr.aria-pressed]="absent().has(st.id)">A</button></div>
        </div> }</div>
      @if (!shown().length) { <div class="empty">{{ onlyAbsent() && !absent().size ? 'Nobody is marked absent.' : 'No student matches.' }}</div> }
      <div class="dock"><span><b>{{ absent().size }}</b> absent will get a parent alert</span>
        <button class="btn acc" (click)="submit()" [disabled]="busy()">{{ busy() ? 'Submitting…' : (s.submitted ? 'Resubmit' : 'Submit') + ' & alert parents' }}</button></div>
    }
    <p class="muted" style="margin:14px 0 0;font-size:13px">Parents of absent students receive: “Dear Parent, your ward <i>name</i> (Class {{ classCode | cls }}, Roll <i>no.</i>) is marked ABSENT today. If this is wrong, please call the school office.” Each parent gets at most one alert per day.</p>
  </section>`,
})
export class AttendanceComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast); private route = inject(ActivatedRoute);
  today = longToday(); classes = signal<string[]>([]); classCode = '';
  sheet = signal<any>(null); absent = signal<Set<number>>(new Set()); busy = signal(false); error = signal('');
  q = ''; onlyAbsent = signal(false);
  shown = () => (this.sheet()?.students ?? []).filter((x: any) => (!this.onlyAbsent() || this.absent().has(x.id)) && (!this.q.trim() || x.name.toLowerCase().includes(this.q.trim().toLowerCase())));
  initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  presentCount = () => (this.sheet()?.students.length ?? 0) - this.absent().size;
  ngOnInit() {
    const want = this.route.snapshot.queryParamMap.get('classCode');
    const done = (list: string[]) => { this.classes.set(list); this.classCode = want && list.includes(want) ? want : list[0] ?? ''; this.load(); };
    if (this.auth.effectiveRole() === 'TEACHER') this.api.get('/portal/teacher').subscribe({ next: p => done(p.myClasses), error: e => this.error.set(errText(e)) });
    else this.api.get<any[]>('/school/classes').subscribe({ next: c => done(c.map(x => x.code)), error: e => this.error.set(errText(e)) });
  }
  load() {
    if (!this.classCode) return;
    this.api.get('/attendance', { classCode: this.classCode }).subscribe({
      next: s => { this.q = ''; this.sheet.set(s); this.absent.set(new Set<number>(s.students.filter((x: any) => x.absent).map((x: any) => x.id))); this.error.set(''); },
      error: e => this.error.set(errText(e)) });
  }
  mark(id: number, abs: boolean) { const s = new Set(this.absent()); abs ? s.add(id) : s.delete(id); this.absent.set(s); }
  allPresent() { this.absent.set(new Set()); }
  submit() {
    this.busy.set(true);
    this.api.post('/attendance', { classCode: this.classCode, absentIds: [...this.absent()] }).subscribe({
      next: (r: any) => { this.busy.set(false); this.toast.show(`Class ${this.classCode} submitted · ${r.alertsSent} parent alert(s) sent by SMS + WhatsApp${r.corrections ? ' · ' + r.corrections + ' correction(s)' : ''}`); this.load(); },
      error: e => { this.busy.set(false); this.toast.show(errText(e)); } });
  }
}
