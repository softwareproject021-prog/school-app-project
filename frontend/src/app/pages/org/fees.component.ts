import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe, InrPipe } from '../../core/format';

@Component({
  selector: 'app-fees', standalone: true, imports: [FormsModule, DecimalPipe, ClassPipe, InrPipe],
  template: `
  <div class="head"><div><h1>Fees</h1><p class="sub">Academic year 2026–27.</p></div><button class="btn acc" (click)="remind()">Send reminders to filtered list</button></div>
  <div class="stack">
    <div class="ftabs" role="tablist"><button role="tab" [class.on]="tab()==='reg'" (click)="go('reg')">Fee register</button><button role="tab" [class.on]="tab()==='disc'" (click)="go('disc')">Discounts@if (dd()?.students) { <span class="cnt">{{ dd().students }}</span> }</button></div>
    @if (tab()==='reg') { @if (d(); as d) {
    <div class="kpis"><div class="kpi"><div class="l">Fee before discount</div><div class="v">{{ d.gross | inr }}</div></div><div class="kpi warn"><div class="l">Discounts</div><div class="v">{{ d.discount | inr }}</div></div><div class="kpi"><div class="l">Billed</div><div class="v">{{ d.billed | inr }}</div></div><div class="kpi good"><div class="l">Collected</div><div class="v">{{ d.collected | inr }}</div></div>
      <div class="kpi bad"><div class="l">Outstanding</div><div class="v">{{ d.outstanding | inr }}</div></div><div class="kpi"><div class="l">Collection</div><div class="v">{{ d.billed ? (d.collected / d.billed * 100 | number:'1.0-0') : 0 }}%</div></div></div>
    <section class="panel">
      <div class="bar"><input type="search" [(ngModel)]="q" (ngModelChange)="typed()" placeholder="Search student…" aria-label="Search student">
        <select [(ngModel)]="classCode" (change)="load()" aria-label="Class"><option value="">All classes</option>@for (c of classes(); track c.code) { <option [value]="c.code">Class {{ c.code | cls }}</option> }</select>
        <select [(ngModel)]="status" (change)="load()" aria-label="Fee status"><option value="due">Fully due</option><option value="partial">Partly paid</option><option value="paid">Paid</option><option value="all">All</option></select></div>
      @if (d.rows.length === 0) { <div class="empty">No students match.</div> } @else {
      <p class="muted" style="margin:0 0 8px">{{ d.rows.length }} students</p>
      <div class="tw"><table><thead><tr><th>Class</th><th>Name</th><th>Parent phone</th><th class="n">Annual fee</th><th class="n">Discount</th><th class="n">Paid</th><th class="n">Due</th><th>Status</th><th></th></tr></thead><tbody>
        @for (r of d.rows; track r.studentId) {
          <tr><td>{{ r.classCode | cls }}</td><td>{{ r.name }}</td><td class="mono">{{ r.phone }}</td><td class="n">{{ r.feeTotal | inr }}</td>
            <td class="n">{{ r.feeDiscount ? (r.feeDiscount | inr) : '—' }}@if (r.discountReason) { <div class="muted" style="font-size:12px">{{ r.discountReason }}</div> }</td><td class="n">{{ r.feePaid | inr }}</td><td class="n">{{ r.feeDue | inr }}</td>
            <td><span class="pill" [class.good]="r.feeDue===0" [class.warn]="r.feePaid>0 && r.feeDue>0" [class.bad]="r.feePaid===0">{{ r.feeDue === 0 ? 'Paid' : r.feePaid ? 'Partial' : 'Due' }}</span></td>
            <td><button class="btn sm" (click)="edit(r)">{{ r.feeDiscount ? 'Change discount' : 'Give discount' }}</button></td></tr>
          @if (ed()?.studentId === r.studentId) { <tr><td colspan="9" style="background:var(--sunk)">
            <form class="bar" style="margin:0" (ngSubmit)="saveDiscount()">
              <b>Discount for {{ r.name }}</b>
              <label>Amount (₹)<input type="number" name="amt" min="0" [max]="r.feeTotal" [(ngModel)]="amt" (ngModelChange)="pctFrom()"></label>
              <label>or percent<input type="number" name="pct" min="0" max="100" [(ngModel)]="pct" (ngModelChange)="amtFrom(r.feeTotal)"></label>
              <label>Reason<input type="text" name="why" maxlength="120" [(ngModel)]="why" placeholder="Sibling, scholarship, staff child…"></label>
              <span class="muted">Fee after discount: <b>{{ r.feeTotal - (amt || 0) | inr }}</b></span>
              <button class="btn pri" type="submit">Save</button><button class="btn" type="button" (click)="ed.set(null)">Cancel</button>
              @if (r.feeDiscount) { <button class="btn danger" type="button" (click)="amt = 0; saveDiscount()">Remove discount</button> }
            </form></td></tr> } }
      </tbody></table></div> }
    </section> } }

    @if (tab()==='disc') { @if (dd(); as x) {
    <div class="kpis">
      <div class="kpi warn"><div class="l">Students with discount</div><div class="v">{{ x.students }}</div></div>
      <div class="kpi"><div class="l">Total discount</div><div class="v">{{ x.total | inr }}</div></div>
      <div class="kpi"><div class="l">Of all fees</div><div class="v">{{ x.percentOfFees }}%</div></div>
      <div class="kpi good"><div class="l">Fee after discount</div><div class="v">{{ x.net | inr }}</div></div>
    </div>
    <section class="panel">
      <div class="ph"><h2>Students with a discount</h2></div>
      <div class="bar"><input type="search" [(ngModel)]="dq" (ngModelChange)="typedD()" placeholder="Search student…" aria-label="Search student">
        <select [(ngModel)]="dclass" (change)="loadD()" aria-label="Class"><option value="">All classes</option>@for (c of classes(); track c.code) { <option [value]="c.code">Class {{ c.code | cls }}</option> }</select></div>
      @if (x.rows.length === 0) { <div class="empty">No discounts given yet. Give one from the Fee register (“Give discount”), and it will appear here.</div> } @else {
      <div class="tw"><table><thead><tr><th>Class</th><th>Student</th><th class="n">Fee</th><th class="n">Discount</th><th class="n">%</th><th>Reason</th><th>Given by</th><th>Date</th><th class="n">Fee after discount</th><th class="n">Due</th><th></th></tr></thead><tbody>
        @for (r of x.rows; track r.studentId) {
          <tr><td>{{ r.classCode | cls }}</td><td>{{ r.name }}</td><td class="n">{{ r.feeTotal | inr }}</td><td class="n"><b>{{ r.feeDiscount | inr }}</b></td><td class="n">{{ r.percent }}%</td>
            <td>{{ r.discountReason || '—' }}</td><td>{{ r.givenBy || '—' }}</td><td class="mono">{{ r.date || '—' }}</td><td class="n">{{ r.feeNet | inr }}</td><td class="n">{{ r.feeDue | inr }}</td>
            <td><button class="btn sm" (click)="edit(r)">Change</button></td></tr>
          @if (ed()?.studentId === r.studentId) { <tr><td colspan="11" style="background:var(--sunk)">
            <form class="bar" style="margin:0" (ngSubmit)="saveDiscount()">
              <b>Discount for {{ r.name }}</b>
              <label>Amount (₹)<input type="number" name="amt2" min="0" [max]="r.feeTotal" [(ngModel)]="amt" (ngModelChange)="pctFrom()"></label>
              <label>or percent<input type="number" name="pct2" min="0" max="100" [(ngModel)]="pct" (ngModelChange)="amtFrom(r.feeTotal)"></label>
              <label>Reason<input type="text" name="why2" maxlength="120" [(ngModel)]="why"></label>
              <span class="muted">Fee after discount: <b>{{ r.feeTotal - (amt || 0) | inr }}</b></span>
              <button class="btn pri" type="submit">Save</button><button class="btn" type="button" (click)="ed.set(null)">Cancel</button>
              <button class="btn danger" type="button" (click)="amt = 0; saveDiscount()">Remove discount</button>
            </form></td></tr> } }
      </tbody></table></div> }
    </section>
    <section class="panel"><div class="ph"><h2>Recent changes</h2><span class="muted" style="font-size:13px">who changed what, and when</span></div>
      @if (x.history.length === 0) { <div class="empty">No changes yet.</div> } @else {
      <div class="tw"><table><thead><tr><th>When</th><th>Student</th><th class="n">From</th><th class="n">To</th><th>Reason</th><th>By</th></tr></thead><tbody>
        @for (h of x.history; track $index) { <tr><td class="mono">{{ h.at.slice(0, 16).replace('T', ' ') }}</td><td>{{ h.studentName }} <span class="muted">· {{ h.classCode | cls }}</span></td><td class="n">{{ h.from | inr }}</td><td class="n">{{ h.to | inr }}</td><td>{{ h.reason }}</td><td>{{ h.givenBy }}</td></tr> }
      </tbody></table></div> }
    </section> } }
  </div>`,
  styles: [`.ftabs{display:flex;gap:6px}.ftabs button{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:8px 16px;border-radius:99px;font-weight:600;cursor:pointer}
    .ftabs button.on{background:var(--grad);color:#fff;border-color:transparent}.cnt{margin-left:6px;background:var(--accent-soft);color:var(--warn);border-radius:99px;padding:0 7px;font-size:12px}`],
})
export class FeesComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  tab = signal<'reg' | 'disc'>('reg'); dd = signal<any>(null); dq = ''; dclass = ''; private td: any;
  ed = signal<any>(null); amt = 0; pct = 0; why = '';
  d = signal<any>(null); classes = signal<any[]>([]); q = ''; classCode = ''; status = 'due'; private t: any;
  ngOnInit() { this.api.get<any[]>('/school/classes').subscribe(c => this.classes.set(c)); this.load(); this.loadD(); }
  go(t: 'reg' | 'disc') { this.tab.set(t); this.ed.set(null); if (t === 'disc') this.loadD(); else this.load(); }
  typedD() { clearTimeout(this.td); this.td = setTimeout(() => this.loadD(), 250); }
  loadD() { this.api.get('/fees/discounts', { q: this.dq, classCode: this.dclass }).subscribe(r => this.dd.set(r)); }
  typed() { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 250); }
  load() { this.api.get('/fees', { q: this.q, classCode: this.classCode, status: this.status }).subscribe(r => this.d.set(r)); }
  edit(r: any) { this.ed.set(this.ed()?.studentId === r.studentId ? null : r); this.amt = r.feeDiscount || 0; this.pct = r.feeTotal ? Math.round(this.amt * 1000 / r.feeTotal) / 10 : 0; this.why = r.discountReason || ''; }
  pctFrom() { const t = this.ed()?.feeTotal; this.pct = t ? Math.round((this.amt || 0) * 1000 / t) / 10 : 0; }
  amtFrom(total: number) { this.amt = Math.round(total * (this.pct || 0) / 100); }
  saveDiscount() {
    const r = this.ed(); if (!r) return;
    this.api.put('/fees/discount/' + r.studentId, { amount: Number(this.amt) || 0, reason: this.why }).subscribe({ next: () => { this.toast.show(Number(this.amt) ? 'Discount saved' : 'Discount removed'); this.ed.set(null); this.load(); this.loadD(); }, error: e => this.toast.show(errText(e)) });
  }
  remind() { this.api.post('/fees/remind', {}, { classCode: this.classCode, status: this.status }).subscribe({ next: (r: any) => this.toast.show(`${r.reminders} fee reminder(s) sent`), error: e => this.toast.show(errText(e)) }); }
}
