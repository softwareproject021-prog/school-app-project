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
  template: `
  <div class="head"><div><h1>Attendance</h1><p class="sub">{{ today }}. Everyone starts as present; tap A for absentees, then submit.</p></div></div>
  <section class="panel">
    <div class="ph">
      <div class="bar" style="margin:0"><select [(ngModel)]="classCode" (change)="load()" aria-label="Class">@for (c of classes(); track c) { <option [value]="c">Class {{ c | cls }}</option> }</select>
        @if (sheet(); as s) { <span class="pill" [class.good]="s.submitted" [class.warn]="!s.submitted">{{ s.submitted ? 'Submitted' : 'Not submitted' }}</span> }</div>
      <div class="bar" style="margin:0"><span class="mono"><b style="color:var(--good)">{{ presentCount() }}</b> P · <b style="color:var(--bad)">{{ absent().size }}</b> A</span>
        <button class="btn" (click)="allPresent()">Mark all present</button><button class="btn acc" (click)="submit()" [disabled]="busy()">{{ sheet()?.submitted ? 'Resubmit' : 'Submit' }} & alert parents</button></div>
    </div>
    @if (error()) { <div class="err">{{ error() }}</div> }
    @if (sheet(); as s) {
      <div class="att">@for (st of s.students; track st.id) {
        <div class="st" [class.abs]="absent().has(st.id)"><span class="nm"><span class="mono muted">{{ st.roll < 10 ? '0' + st.roll : st.roll }}</span> {{ st.name }}</span>
          <span class="seg"><button class="p" [class.on]="!absent().has(st.id)" (click)="mark(st.id, false)" aria-label="Present">P</button><button class="a" [class.on]="absent().has(st.id)" (click)="mark(st.id, true)" aria-label="Absent">A</button></span></div> }</div>
    }
    <p class="muted" style="margin:14px 0 0;font-size:13px">Parents of absent students receive: “Dear Parent, your ward <i>name</i> (Class {{ classCode | cls }}, Roll <i>no.</i>) is marked ABSENT today. If this is wrong, please call the school office.” Each parent gets at most one alert per day.</p>
  </section>`,
})
export class AttendanceComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast); private route = inject(ActivatedRoute);
  today = longToday(); classes = signal<string[]>([]); classCode = '';
  sheet = signal<any>(null); absent = signal<Set<number>>(new Set()); busy = signal(false); error = signal('');
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
      next: s => { this.sheet.set(s); this.absent.set(new Set<number>(s.students.filter((x: any) => x.absent).map((x: any) => x.id))); this.error.set(''); },
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
