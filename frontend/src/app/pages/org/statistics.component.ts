import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { ClassPipe, InrPipe } from '../../core/format';
import { DonutComponent, Slice } from '../../core/donut.component';

type Tab = 'att' | 'fees' | 'uniform' | 'stationery';

@Component({
  selector: 'app-statistics', standalone: true, imports: [FormsModule, ClassPipe, InrPipe, DonutComponent],
  template: `
  <div class="head"><div><h1>Statistics</h1><p class="sub">{{ d()?.school }} · attendance, fees, uniform and stationery, class by class.</p></div>
    <label class="inl">Period <select [(ngModel)]="days" (change)="load()" aria-label="Period"><option [ngValue]="7">Last 7 days</option><option [ngValue]="30">Last 30 days</option><option [ngValue]="90">Last 90 days</option></select></label></div>
  @if (error()) { <div class="err">{{ error() }}</div> }
  @if (d(); as d) {
  <div class="stack">
    <div class="tabs" role="tablist">
      <button role="tab" [class.on]="tab()==='att'" (click)="go('att')">Attendance</button>
      <button role="tab" [class.on]="tab()==='fees'" (click)="go('fees')">Fees</button>
      <button role="tab" [class.on]="tab()==='uniform'" (click)="go('uniform')">Uniform</button>
      <button role="tab" [class.on]="tab()==='stationery'" (click)="go('stationery')">Stationery</button>
    </div>

    @if (tab()==='att') {
      <div class="kpis">
        <div class="kpi"><div class="l">Students</div><div class="v">{{ d.attendance.today.students }}</div></div>
        <div class="kpi good"><div class="l">Present today</div><div class="v">{{ d.attendance.today.present }}</div></div>
        <div class="kpi bad"><div class="l">Absent today</div><div class="v">{{ d.attendance.today.absent }}</div></div>
        <div class="kpi"><div class="l">Today</div><div class="v">{{ d.attendance.today.pct }}%</div></div>
        <div class="kpi"><div class="l">Last {{ d.attendance.period.days }} days</div><div class="v">{{ d.attendance.period.pct }}%</div></div>
      </div>
      <section class="panel"><div class="ph"><h2>Whole school today, class by class</h2><span class="muted small">Click a class in a ring to see its students</span></div>
        <div class="rings">
          <app-donut title="Present" [slices]="byClass('presentToday')" [centerText]="d.attendance.today.present + ''" sub="present" [size]="170" [selected]="pickKey('cp')" (pick)="pickSlice('cp', $event)"/>
          <app-donut title="Absent" [slices]="byClass('absentToday')" [centerText]="d.attendance.today.absent + ''" sub="absent" [size]="170" [selected]="pickKey('ca')" (pick)="pickSlice('ca', $event)"/>
        </div>
        @if (sel(); as x) { @if (x.group==='cp' || x.group==='ca') { <div class="drill"><div class="ph"><h2>{{ drillTitle() }}</h2><button class="btn sm" (click)="sel.set(null)">Close</button></div>
          @if (classNames().length === 0) { <div class="empty">No students to show.</div> } @else { <div class="chips">@for (n of classNames(); track $index) { <span class="chip">{{ n }}</span> }</div> } </div> } }
      </section>
      <section class="panel"><div class="rings">
        <app-donut title="Today" [slices]="attToday()" [centerText]="d.attendance.today.pct + '%'" sub="present" [selected]="pickKey('att')" (pick)="pickSlice('att', $event)"/>
        <app-donut title="Last {{ d.attendance.period.days }} days" [slices]="attPeriod()" [centerText]="d.attendance.period.pct + '%'" sub="present" [selected]="pickKey('attp')" (pick)="pickSlice('attp', $event)"/>
      </div>
      @if (sel(); as x) { @if (x.group==='att' || x.group==='attp') { <div class="drill"><div class="ph"><h2>{{ drillTitle() }}</h2><button class="btn sm" (click)="sel.set(null)">Close</button></div>
        @if (drillRows().length === 0) { <div class="empty">Nothing to show.</div> } @else { <div class="tw"><table><thead><tr><th>Class</th><th>Detail</th><th class="n">Count</th></tr></thead><tbody>
          @for (r of drillRows(); track $index) { <tr><td><b>{{ r.cls | cls }}</b></td><td>{{ r.text }}</td><td class="n">{{ r.n }}</td></tr> }</tbody></table></div> } </div> } }
      </section>
      @if (d.attendance.today.classesPending) { <div class="note">{{ d.attendance.today.classesPending }} class(es) have not submitted today's attendance yet, so they show as not marked.</div> }
      <section class="panel"><div class="ph"><h2>Class-wise attendance</h2></div>
        <div class="tw"><table><thead><tr><th>Class</th><th class="n">Students</th><th class="n">Present today</th><th class="n">Absent today</th><th>Absent today (names)</th><th class="n">Absent days ({{ d.attendance.period.days }}d)</th><th>Attendance</th></tr></thead><tbody>
          @for (c of d.attendance.classes; track c.code) {
            <tr><td><b>{{ c.code | cls }}</b></td><td class="n">{{ c.strength }}</td>
              @if (c.submitted) { <td class="n">{{ c.presentToday }}</td><td class="n">{{ c.absentToday }}</td><td class="small">{{ c.absentNames.length ? c.absentNames.join(', ') : '—' }}</td> }
              @else { <td colspan="3"><span class="pill">Not marked yet</span></td> }
              <td class="n">{{ c.periodAbsent }}</td>
              <td><div class="mini"><div class="track"><div class="fill" [style.width.%]="c.periodPct"></div></div><span class="mono">{{ c.periodPct }}%</span></div></td></tr> }
        </tbody></table></div></section>
      <div class="grid2">
        <section class="panel"><div class="ph"><h2>Most absences</h2><span class="muted small">last {{ d.attendance.period.days }} days</span></div>
          @if (d.attendance.frequentAbsentees.length === 0) { <div class="empty">No absences recorded.</div> }
          <div class="feed">@for (s of d.attendance.frequentAbsentees; track s.studentId) { <div class="it"><span>{{ s.name }} <span class="muted">· {{ s.classCode | cls }}</span></span><b class="mono">{{ s.absentDays }} days</b></div> }</div></section>
        <section class="panel"><div class="ph"><h2>Daily attendance</h2></div>
          @if (d.attendance.trend.length === 0) { <div class="empty">No attendance recorded in this period.</div> }
          <div class="feed">@for (t of lastDays(d.attendance.trend); track t.date) { <div class="it"><span class="mono">{{ t.date }}</span><span>{{ t.present }} present · {{ t.absent }} absent</span><b class="mono">{{ t.pct }}%</b></div> }</div></section>
      </div>
    }

    @if (tab()==='fees') {
      <div class="kpis">
        <div class="kpi"><div class="l">Fee after discounts</div><div class="v">{{ d.fees.net | inr }}</div></div>
        <div class="kpi"><div class="l">Discounts given</div><div class="v">{{ d.fees.discount | inr }}</div><div class="muted small">{{ d.fees.discountedStudents }} student(s)</div></div>
        <div class="kpi good"><div class="l">Collected</div><div class="v">{{ d.fees.collected | inr }}</div></div>
        <div class="kpi bad"><div class="l">Outstanding</div><div class="v">{{ d.fees.outstanding | inr }}</div></div>
        <div class="kpi"><div class="l">Collection</div><div class="v">{{ d.fees.pct }}%</div></div>
      </div>
      <section class="panel"><div class="rings">
        <app-donut title="Students" [slices]="feeStudents()" [centerText]="d.fees.pct + '%'" sub="collected" [selected]="pickKey('fee')" (pick)="pickSlice('fee', $event)"/>
        <app-donut title="Money" [slices]="feeMoney()" [centerText]="d.fees.pct + '%'" sub="collected" [selected]="pickKey('feem')" (pick)="pickSlice('feem', $event)"/>
      </div>
      @if (sel(); as x) { @if (x.group==='fee') { <div class="drill"><div class="ph"><h2>{{ drillTitle() }}</h2><button class="btn sm" (click)="sel.set(null)">Close</button></div>
        <div class="tw"><table><thead><tr><th>Class</th><th>Student</th><th class="n">Fee</th><th class="n">Paid</th><th class="n">Due</th></tr></thead><tbody>
          @for (r of drillRows(); track $index) { <tr><td><b>{{ r.cls | cls }}</b></td><td>{{ r.text }}</td><td class="n">{{ r.fee | inr }}</td><td class="n">{{ r.paid | inr }}</td><td class="n">{{ r.due | inr }}</td></tr> }</tbody></table></div></div> }
        @if (x.group==='feem') { <div class="drill"><div class="ph"><h2>{{ drillTitle() }}</h2><button class="btn sm" (click)="sel.set(null)">Close</button></div>
        <div class="tw"><table><thead><tr><th>Class</th><th class="n">Amount</th></tr></thead><tbody>
          @for (r of drillRows(); track $index) { <tr><td><b>{{ r.cls | cls }}</b></td><td class="n">{{ r.fee | inr }}</td></tr> }</tbody></table></div></div> } }
      </section>
      <div class="kpis"><div class="kpi good"><div class="l">Fully paid</div><div class="v">{{ d.fees.paid }}</div></div><div class="kpi warn"><div class="l">Part paid</div><div class="v">{{ d.fees.partial }}</div></div><div class="kpi bad"><div class="l">Not paid</div><div class="v">{{ d.fees.unpaid }}</div></div></div>
      <section class="panel"><div class="ph"><h2>Class-wise fees</h2><span class="muted small">Tap a class to see who has paid and who has not</span></div>
        <div class="tw"><table><thead><tr><th>Class</th><th class="n">Students</th><th class="n">Fee</th><th class="n">Discount</th><th class="n">Collected</th><th class="n">Outstanding</th><th class="n">Paid</th><th class="n">Part</th><th class="n">Not paid</th><th>Collection</th></tr></thead><tbody>
          @for (c of d.fees.classes; track c.code) {
            <tr class="click" [class.sel]="open()===tab()+c.code" (click)="toggle(c.code)" tabindex="0" (keydown.enter)="toggle(c.code)"><td><b>{{ c.code | cls }}</b></td><td class="n">{{ c.strength }}</td><td class="n">{{ c.net | inr }}</td><td class="n">{{ c.discount | inr }}</td>
              <td class="n">{{ c.collected | inr }}</td><td class="n">{{ c.outstanding | inr }}</td><td class="n">{{ c.paid }}</td><td class="n">{{ c.partial }}</td><td class="n">{{ c.unpaid }}</td>
              <td><div class="mini"><div class="track"><div class="fill" [style.width.%]="c.pct"></div></div><span class="mono">{{ c.pct }}%</span></div></td></tr>
            @if (open()===tab()+c.code) { <tr class="detail"><td colspan="10">
              <div class="bar" style="margin:0 0 8px"><select [(ngModel)]="sf" aria-label="Show"><option value="">Everyone</option><option value="PAID">Paid</option><option value="PARTIAL">Part paid</option><option value="UNPAID">Not paid</option></select></div>
              <div class="tw"><table><thead><tr><th>Roll</th><th>Student</th><th class="n">Fee</th><th class="n">Discount</th><th class="n">Paid</th><th class="n">Due</th><th>Status</th></tr></thead><tbody>
                @for (s of filter(c.students, 'status'); track s.id) {
                  <tr><td>{{ s.roll }}</td><td>{{ s.name }}</td><td class="n">{{ s.net | inr }}</td><td class="n">{{ s.discount ? (s.discount | inr) : '—' }}@if (s.reason) { <span class="muted small"> · {{ s.reason }}</span> }</td><td class="n">{{ s.paid | inr }}</td><td class="n">{{ s.due | inr }}</td>
                    <td><span class="pill" [class.good]="s.status==='PAID'" [class.warn]="s.status==='PARTIAL'" [class.bad]="s.status==='UNPAID'">{{ s.status==='PAID' ? 'Paid' : s.status==='PARTIAL' ? 'Part paid' : 'Not paid' }}</span></td></tr> }
              </tbody></table></div></td></tr> }
          }
        </tbody></table></div></section>
    }

    @if (tab()==='uniform' || tab()==='stationery') {
      <div class="kpis">
        <div class="kpi"><div class="l">{{ label() }} issued (value)</div><div class="v">{{ g().billed | inr }}</div></div>
        <div class="kpi good"><div class="l">Paid</div><div class="v">{{ g().paid | inr }}</div></div>
        <div class="kpi bad"><div class="l">Not paid</div><div class="v">{{ g().unpaid | inr }}</div></div>
      </div>
      <section class="panel"><div class="rings">
        <app-donut [title]="label() + ' students'" [slices]="storeStudents()" [centerText]="storePct() + '%'" sub="paid" [selected]="pickKey('store')" (pick)="pickSlice('store', $event)"/>
        <app-donut [title]="label() + ' money'" [slices]="storeMoney()" [centerText]="storePct() + '%'" sub="paid" [selected]="pickKey('storem')" (pick)="pickSlice('storem', $event)"/>
      </div>
      @if (sel(); as x) { @if (x.group==='store') { <div class="drill"><div class="ph"><h2>{{ drillTitle() }}</h2><button class="btn sm" (click)="sel.set(null)">Close</button></div>
        <div class="tw"><table><thead><tr><th>Class</th><th>Student</th><th class="n">Value</th><th class="n">Owes</th></tr></thead><tbody>
          @for (r of drillRows(); track $index) { <tr><td><b>{{ r.cls | cls }}</b></td><td>{{ r.text }}</td><td class="n">{{ r.fee | inr }}</td><td class="n">{{ r.due | inr }}</td></tr> }</tbody></table></div></div> }
        @if (x.group==='storem') { <div class="drill"><div class="ph"><h2>{{ drillTitle() }}</h2><button class="btn sm" (click)="sel.set(null)">Close</button></div>
        <div class="tw"><table><thead><tr><th>Class</th><th class="n">Amount</th></tr></thead><tbody>
          @for (r of drillRows(); track $index) { <tr><td><b>{{ r.cls | cls }}</b></td><td class="n">{{ r.fee | inr }}</td></tr> }</tbody></table></div></div> } }
      </section>
      @if (g().billed === 0) { <div class="note">No {{ label().toLowerCase() }} has been issued to students yet. Issue items from the Stationery store page and they will appear here with paid / not paid.</div> }
      <section class="panel"><div class="ph"><h2>Class-wise {{ label().toLowerCase() }}</h2><span class="muted small">Tap a class to see each student</span></div>
        <div class="tw"><table><thead><tr><th>Class</th><th class="n">Students</th><th class="n">Value</th><th class="n">Paid</th><th class="n">Not paid</th><th class="n">Students paid</th><th class="n">Students owing</th><th class="n">Not bought</th></tr></thead><tbody>
          @for (c of d.store.classes; track c.code) {
            <tr class="click" [class.sel]="open()===tab()+c.code" (click)="toggle(c.code)" tabindex="0" (keydown.enter)="toggle(c.code)"><td><b>{{ c.code | cls }}</b></td><td class="n">{{ c.strength }}</td><td class="n">{{ c[tab()].billed | inr }}</td><td class="n">{{ c[tab()].paid | inr }}</td><td class="n">{{ c[tab()].unpaid | inr }}</td>
              <td class="n">{{ c[tab()].paidStudents }}</td><td class="n">{{ c[tab()].unpaidStudents }}</td><td class="n">{{ c[tab()].noPurchase }}</td></tr>
            @if (open()===tab()+c.code) { <tr class="detail"><td colspan="8">
              <div class="bar" style="margin:0 0 8px"><select [(ngModel)]="sf" aria-label="Show"><option value="">Everyone</option><option value="PAID">Paid</option><option value="UNPAID">Not paid</option><option value="NONE">Not bought</option></select></div>
              <div class="tw"><table><thead><tr><th>Roll</th><th>Student</th><th class="n">Value</th><th class="n">Owes</th><th>Status</th></tr></thead><tbody>
                @for (s of filter(c.students, tab()+'Status'); track s.id) {
                  <tr><td>{{ s.roll }}</td><td>{{ s.name }}</td><td class="n">{{ s[tab()+'Billed'] | inr }}</td><td class="n">{{ s[tab()+'Due'] | inr }}</td>
                    <td><span class="pill" [class.good]="s[tab()+'Status']==='PAID'" [class.bad]="s[tab()+'Status']==='UNPAID'">{{ s[tab()+'Status']==='PAID' ? 'Paid' : s[tab()+'Status']==='UNPAID' ? 'Not paid' : 'Not bought' }}</span></td></tr> }
              </tbody></table></div></td></tr> }
          }
        </tbody></table></div></section>
    }
  </div> }`,
  styles: [`.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{background:var(--sunk);border:1px solid var(--line);padding:5px 12px;border-radius:99px;font-size:14px}.rings{display:flex;gap:36px;flex-wrap:wrap;align-items:center}.drill{margin-top:16px;border-top:1px solid var(--line);padding-top:12px}
    .tabs{display:flex;gap:6px;flex-wrap:wrap}.tabs button{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:8px 14px;border-radius:99px;font-weight:600;cursor:pointer}
    .tabs button.on{background:var(--grad);color:#fff;border-color:transparent}
    .inl{display:flex;align-items:center;gap:8px;font-weight:600}.small{font-size:13px}.mini{display:flex;align-items:center;gap:8px;min-width:130px}.mini .track{flex:1;height:10px;border-radius:99px;background:var(--bad-soft);overflow:hidden}.mini .fill{height:100%;background:var(--good);border-radius:99px}
    tr.click{cursor:pointer}tr.click:hover,tr.sel{background:var(--sunk)}tr.detail>td{background:var(--sunk);padding:12px}`],
})
export class StatisticsComponent implements OnInit {
  private api = inject(Api);
  sel = signal<{ group: string; key: string } | null>(null);
  d = signal<any>(null); error = signal(''); tab = signal<Tab>('att'); open = signal(''); days = 30; sf = '';
  ngOnInit() { this.load(); }
  load() { this.api.get('/stats/school', { days: this.days }).subscribe({ next: r => { this.d.set(r); this.error.set(''); }, error: e => this.error.set(errText(e)) }); }
  go(t: Tab) { this.sel.set(null); this.tab.set(t); this.open.set(''); this.sf = ''; }
  toggle(code: string) { const k = this.tab() + code; this.open.set(this.open() === k ? '' : k); this.sf = ''; }
  private readonly C = { good: 'var(--good, #2b8a55)', bad: 'var(--bad, #c0392b)', warn: 'var(--warn, #c98a1b)', mute: 'var(--line, #b8c2d6)' };
  pickKey(g: string) { const x = this.sel(); return x && x.group === g ? x.key : null; }
  pickSlice(group: string, key: string) { const x = this.sel(); this.sel.set(x && x.group === group && x.key === key ? null : { group, key }); }
  private PAL = ['#1d4ed8', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#4f46e5', '#be123c', '#65a30d', '#9333ea'];
  byClass(f: string): Slice[] { return this.d().attendance.classes.map((c: any, i: number) => ({ key: c.code, label: 'Class ' + c.code.replace(/^(\d+)(\w)$/, '$1-$2'), value: c[f], color: this.PAL[i % this.PAL.length] })); }
  classNames(): string[] { const x = this.sel(); if (!x) return []; const c = this.d().attendance.classes.find((k: any) => k.code === (x as any).key.split('|')[0]); return c ? (x.group === 'cp' ? c.presentNames : c.absentNames) : []; }
  attToday(): Slice[] { const t = this.d().attendance.today; const marked = t.present + t.absent; return [{ key: 'present', label: 'Present', value: t.present, color: this.C.good }, { key: 'absent', label: 'Absent', value: t.absent, color: this.C.bad }, { key: 'nm', label: 'Not marked', value: Math.max(0, t.students - marked), color: this.C.mute }]; }
  attPeriod(): Slice[] { const p = this.d().attendance.period; return [{ key: 'present', label: 'Present days', value: p.present, color: this.C.good }, { key: 'absent', label: 'Absent days', value: p.absent, color: this.C.bad }]; }
  feeStudents(): Slice[] { const f = this.d().fees; return [{ key: 'PAID', label: 'Paid', value: f.paid, color: this.C.good }, { key: 'PARTIAL', label: 'Part paid', value: f.partial, color: this.C.warn }, { key: 'UNPAID', label: 'Not paid', value: f.unpaid, color: this.C.bad }]; }
  feeMoney(): Slice[] { const f = this.d().fees; return [{ key: 'collected', label: 'Collected ₹', value: f.collected, color: this.C.good }, { key: 'outstanding', label: 'Outstanding ₹', value: f.outstanding, color: this.C.bad }]; }
  storeStudents(): Slice[] { const k = this.tab(); const c = this.d().store.classes; const sum = (f: string) => c.reduce((a: number, x: any) => a + x[k][f], 0);
    return [{ key: 'PAID', label: 'Paid', value: sum('paidStudents'), color: this.C.good }, { key: 'UNPAID', label: 'Owing', value: sum('unpaidStudents'), color: this.C.bad }, { key: 'NONE', label: 'Not bought', value: sum('noPurchase'), color: this.C.mute }]; }
  storeMoney(): Slice[] { const g = this.g(); return [{ key: 'paid', label: 'Paid ₹', value: g.paid, color: this.C.good }, { key: 'unpaid', label: 'Not paid ₹', value: g.unpaid, color: this.C.bad }]; }
  storePct() { const g = this.g(); return g.billed ? Math.round(g.paid * 1000 / g.billed) / 10 : 0; }
  drillTitle() {
    const x = this.sel(); if (!x) return '';
    const m: any = { present: 'Present today, class by class', absent: 'Absent', nm: 'Classes that have not marked attendance', PAID: 'Paid', PARTIAL: 'Part paid', UNPAID: 'Not paid', NONE: 'Not bought', collected: 'Collected, class by class', outstanding: 'Outstanding, class by class', paid: 'Paid, class by class', unpaid: 'Not paid, class by class' };
    if (x.group === 'cp' || x.group === 'ca') { const c = x.key.replace(/^(\d+)(\w)$/, '$1-$2'); return 'Class ' + c + ' — ' + (x.group === 'cp' ? 'present today' : 'absent today') + ' (' + this.classNames().length + ')'; }
    const what = x.group === 'attp' ? (x.key === 'absent' ? 'Absent days, class by class' : 'Present days, class by class') : x.group === 'att' && x.key === 'absent' ? 'Absent today (names)' : m[x.key];
    return (x.group === 'store' ? this.label() + ': ' : '') + what;
  }
  drillRows(): any[] {
    const x = this.sel(), d = this.d(); if (!x) return []; const out: any[] = [];
    if (x.group === 'att') for (const c of d.attendance.classes) {
      if (x.key === 'nm') { if (!c.submitted) out.push({ cls: c.code, text: 'Attendance not submitted', n: c.strength }); }
      else if (x.key === 'present') { if (c.submitted) out.push({ cls: c.code, text: 'present of ' + c.strength, n: c.presentToday }); }
      else if (c.submitted && c.absentToday) out.push({ cls: c.code, text: c.absentNames.join(', '), n: c.absentToday });
    }
    if (x.group === 'attp') for (const c of d.attendance.classes) out.push({ cls: c.code, text: c.periodPct + '% present', n: x.key === 'absent' ? c.periodAbsent : c.periodPresent });
    if (x.group === 'fee') for (const c of d.fees.classes) for (const s of c.students) if (s.status === x.key) out.push({ cls: c.code, text: s.name, fee: s.net, paid: s.paid, due: s.due });
    if (x.group === 'feem') for (const c of d.fees.classes) out.push({ cls: c.code, fee: x.key === 'collected' ? c.collected : c.outstanding });
    const k = this.tab();
    if (x.group === 'store') for (const c of d.store.classes) for (const s of c.students) if (s[k + 'Status'] === x.key) out.push({ cls: c.code, text: s.name, fee: s[k + 'Billed'], due: s[k + 'Due'] });
    if (x.group === 'storem') for (const c of d.store.classes) out.push({ cls: c.code, fee: x.key === 'paid' ? c[k].paid : c[k].unpaid });
    return out;
  }
  g() { return this.d().store[this.tab()]; }
  label() { return this.tab() === 'uniform' ? 'Uniform' : 'Stationery'; }
  filter(list: any[], key: string) { return this.sf ? list.filter(s => s[key] === this.sf) : list; }
  lastDays(t: any[]) { return t.slice(-10).reverse(); }
}
