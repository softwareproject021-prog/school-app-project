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
    <div class="ftabs" role="tablist"><button role="tab" [class.on]="tab()==='reg'" (click)="go('reg')">Fee register</button><button role="tab" [class.on]="tab()==='disc'" (click)="go('disc')">Discounts@if (dd()?.students) { <span class="cnt">{{ dd().students }}</span> }</button><button role="tab" [class.on]="tab()==='bulk'" (click)="go('bulk')">Discount many</button><button role="tab" [class.on]="tab()==='plan'" (click)="go('plan')">Fee structure</button></div>
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
            <td><button class="btn sm pri" (click)="openReceipt(r)" [attr.aria-label]="'Receive payment from the parent of ' + r.name">Receive payment</button> <button class="btn sm" (click)="edit(r)">{{ r.feeDiscount ? 'Change discount' : 'Give discount' }}</button></td></tr>
          @if (rc()?.studentId === r.studentId) { <tr><td colspan="9" style="background:var(--sunk)">
            <form class="bar" style="margin:0" (ngSubmit)="saveReceipt()">
              <b>Payment received at the office from {{ r.name }}'s parent</b>
              <label>Receipt no.<input name="rno" [(ngModel)]="rNo" maxlength="30" placeholder="from the paper receipt" required></label>
              <label>Amount (₹)<input name="ramt" type="number" min="1" [max]="r.feeDue" [(ngModel)]="rAmt" required></label>
              <label>Mode<select name="rmode" [(ngModel)]="rMode"><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option><option value="UPI">UPI at counter</option><option value="CARD">Card</option><option value="BANK">Bank transfer</option></select></label>
              <label>Date<input name="rdate" type="date" [(ngModel)]="rDate" [max]="today"></label>
              <label>Note<input name="rnote" [(ngModel)]="rNote" maxlength="200" placeholder="cheque no., etc."></label>
              <span class="muted">Due after this: <b>{{ r.feeDue - (rAmt || 0) | inr }}</b></span>
              <button class="btn pri" type="submit" [disabled]="rBusy()">{{ rBusy() ? 'Saving…' : 'Save receipt' }}</button><button class="btn" type="button" (click)="rc.set(null)">Close</button>
            </form>
            @if (rErr()) { <div class="err" role="alert" style="margin-top:8px">{{ rErr() }}</div> }
            @if (rList().length) { <div class="tw" style="margin-top:10px"><table><thead><tr><th>Receipt</th><th>Date</th><th>Mode</th><th class="n">Amount</th><th>Note</th><th></th></tr></thead><tbody>
              @for (p of rList(); track p.id) { <tr><td class="mono">{{ p.receiptNo }}</td><td>{{ p.date }}</td><td>{{ p.mode }}</td><td class="n">{{ p.amount | inr }}</td><td class="muted">{{ p.note || (p.recordedBy ? 'Office' : 'Online') }}</td>
                <td>@if (p.recordedBy) { @if (voidId() === p.id) { <button class="btn sm danger" type="button" (click)="voidReceipt(p)">Yes, cancel {{ p.receiptNo }}</button> <button class="btn sm" type="button" (click)="voidId.set(null)">No</button> } @else { <button class="btn sm" type="button" (click)="voidId.set(p.id)">Cancel receipt</button> } }</td></tr> }</tbody></table></div> }
          </td></tr> }
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
    @if (tab()==='bulk') {
      <section class="panel"><div class="ph"><h2>Give the same discount to many students</h2></div>
        <div class="note" style="margin-bottom:10px">This sets the discount for every student in the chosen class (or the whole school). It replaces any discount they have now.
          Students who have already paid more than the new fee, or whose discount would be more than their fee, are skipped. Enter 0 to remove discounts.</div>
        <form class="form" (ngSubmit)="bConfirm.set(true)">
          <label>Who<select name="bClass" [(ngModel)]="bClass" (ngModelChange)="bConfirm.set(false)"><option [ngValue]="''">All classes (whole school)</option>
            @for (c of classes(); track c.code) { <option [ngValue]="c.code">{{ c.code | cls }}</option> }</select></label>
          <label>Discount type<select name="bMode" [(ngModel)]="bMode" (ngModelChange)="bConfirm.set(false)"><option value="percent">Percent of each fee (%)</option><option value="amount">Fixed amount (Rs)</option></select></label>
          <label>{{ bMode === 'percent' ? 'Percent' : 'Amount (Rs)' }}<input name="bVal" type="number" min="0" [max]="bMode === 'percent' ? 100 : 10000000" [(ngModel)]="bVal" (ngModelChange)="bConfirm.set(false)" inputmode="numeric" required></label>
          <label>Reason<input name="bWhy" [(ngModel)]="bWhy" maxlength="120" placeholder="Sibling discount, festival offer…" (ngModelChange)="bConfirm.set(false)"></label>
          <div class="bar">
            @if (bConfirm()) {
              <button class="btn danger" type="button" [disabled]="bBusy()" (click)="applyBulk()">{{ bBusy() ? 'Applying…' : 'Yes, apply to ' + (bClass ? (bClass | cls) : 'the whole school') }}</button>
              <button class="btn" type="button" (click)="bConfirm.set(false)">Cancel</button>
            } @else { <button class="btn pri" type="submit">Review and apply</button> }
          </div>
        </form>
        @if (bResult(); as br) { <div class="note" style="margin-top:10px">Done. {{ br.applied }} students updated, {{ br.unchanged }} already had this discount, {{ br.skipped }} skipped (of {{ br.students }}).</div> }
      </section> }
    @if (tab()==='plan') {
      <section class="panel"><div class="ph"><h2>Fee for each class</h2></div>
        <div class="note" style="margin-bottom:10px">Set the yearly fee of a class and it is applied to every student in it. Parents see their child's class fee on their Fees page.
          A student is skipped if the new fee is less than their discount or what they have already paid.</div>
        @if (plan(); as pl) {
          <div class="tw"><table><thead><tr><th>Class</th><th class="n">Students</th><th class="n">Yearly fee (Rs)</th><th></th></tr></thead><tbody>
            @for (c of pl.classes; track c.code) {
              <tr><td><b>{{ c.code | cls }}</b></td><td class="n">{{ c.students }}</td>
                <td class="n"><input type="number" min="0" class="inl" [value]="c.fee || ''" (input)="setIn('c' + c.code, $any($event.target).value)" [attr.aria-label]="'Yearly fee for class ' + c.code" placeholder="not set"></td>
                <td><button class="btn sm pri" [disabled]="pBusy() === 'c' + c.code" (click)="saveClassFee(c)">Save</button></td></tr> }
          </tbody></table></div> } @else { <div class="empty">Loading…</div> }
      </section>
      @if (plan()?.buses?.length) {
        <section class="panel"><div class="ph"><h2>Fee for each bus</h2></div>
          <div class="note" style="margin-bottom:10px">The bus fee is added to the fee of every student who rides that bus. Choose who rides each bus on the Transport page.</div>
          <div class="tw"><table><thead><tr><th>Bus</th><th class="n">Students</th><th class="n">Yearly bus fee (Rs)</th><th></th></tr></thead><tbody>
            @for (b of plan().buses; track b.id) {
              <tr><td><b>{{ b.code }}</b> <span class="muted">{{ b.name }}</span></td><td class="n">{{ b.riders }}</td>
                <td class="n"><input type="number" min="0" class="inl" [value]="b.fee || ''" (input)="setIn('b' + b.id, $any($event.target).value)" [attr.aria-label]="'Yearly fee for bus ' + b.code" placeholder="not set"></td>
                <td><button class="btn sm pri" [disabled]="pBusy() === 'b' + b.id" (click)="saveBusFee(b)">Save</button></td></tr> }
          </tbody></table></div></section> }
    }
  </div>`,
  styles: [`.ftabs{display:flex;gap:6px;flex-wrap:wrap}.ftabs button{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:8px 16px;border-radius:99px;font-weight:600;cursor:pointer}
    .ftabs button.on{background:var(--grad);color:#fff;border-color:transparent}.cnt{margin-left:6px;background:var(--accent-soft);color:var(--warn);border-radius:99px;padding:0 7px;font-size:12px}`],
})
export class FeesComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  tab = signal<'reg' | 'disc' | 'bulk' | 'plan'>('reg');
  plan = signal<any>(null); pBusy = signal(''); private pIn: Record<string, string> = {};
  bClass = ''; bMode = 'percent'; bVal = 0; bWhy = ''; bConfirm = signal(false); bBusy = signal(false); bResult = signal<any>(null); dd = signal<any>(null); dq = ''; dclass = ''; private td: any;
  rc = signal<any>(null); rList = signal<any[]>([]); rErr = signal(''); rBusy = signal(false); voidId = signal<number | null>(null);
  rNo = ''; rAmt = 0; rMode = 'CASH'; rDate = ''; rNote = ''; today = new Date().toISOString().slice(0, 10);
  ed = signal<any>(null); amt = 0; pct = 0; why = '';
  d = signal<any>(null); classes = signal<any[]>([]); q = ''; classCode = ''; status = 'due'; private t: any;
  ngOnInit() { this.api.get<any[]>('/school/classes').subscribe(c => this.classes.set(c)); this.load(); this.loadD(); }
  go(t: 'reg' | 'disc' | 'bulk' | 'plan') { this.tab.set(t); this.ed.set(null); this.bResult.set(null); this.bConfirm.set(false); if (t === 'disc') this.loadD(); else if (t === 'reg') this.load(); else if (t === 'plan') this.loadPlan(); }
  typedD() { clearTimeout(this.td); this.td = setTimeout(() => this.loadD(), 250); }
  loadD() { this.api.get('/fees/discounts', { q: this.dq, classCode: this.dclass }).subscribe(r => this.dd.set(r)); }
  typed() { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 250); }
  load() { this.api.get('/fees', { q: this.q, classCode: this.classCode, status: this.status }).subscribe(r => this.d.set(r)); }
  edit(r: any) { this.rc.set(null); this.ed.set(this.ed()?.studentId === r.studentId ? null : r); this.amt = r.feeDiscount || 0; this.pct = r.feeTotal ? Math.round(this.amt * 1000 / r.feeTotal) / 10 : 0; this.why = r.discountReason || ''; }
  openReceipt(r: any) {
    if (this.rc()?.studentId === r.studentId) { this.rc.set(null); return; }
    this.ed.set(null); this.rErr.set(''); this.voidId.set(null);
    this.rc.set(r); this.rNo = ''; this.rAmt = r.feeDue; this.rMode = 'CASH'; this.rDate = this.today; this.rNote = '';
    this.loadReceipts(r.studentId);
  }
  loadReceipts(id: number) { this.api.get<any[]>('/fees/payments', { studentId: id }).subscribe(l => this.rList.set(l)); }
  saveReceipt() {
    const r = this.rc(); if (!r) return;
    this.rErr.set(''); this.rBusy.set(true);
    this.api.post<any>('/fees/receipt', { studentId: r.studentId, receiptNo: this.rNo, amount: Number(this.rAmt), mode: this.rMode, date: this.rDate || null, note: this.rNote }).subscribe({
      next: x => { this.rBusy.set(false); this.toast.show('Receipt ' + x.receipt.receiptNo + ' saved. Pending fee is now Rs ' + x.feeDue); this.rNo = ''; this.rNote = ''; this.rAmt = x.feeDue; this.rc.set({ ...r, feeDue: x.feeDue, feePaid: x.feePaid }); this.loadReceipts(r.studentId); this.load(); },
      error: e => { this.rBusy.set(false); this.rErr.set(errText(e)); } });
  }
  voidReceipt(p: any) {
    this.voidId.set(null); const r = this.rc();
    this.api.delete<any>('/fees/receipt/' + p.id).subscribe({ next: x => { this.toast.show('Receipt ' + p.receiptNo + ' cancelled'); if (r) { this.rc.set({ ...r, feeDue: x.feeDue, feePaid: x.feePaid }); this.rAmt = x.feeDue; this.loadReceipts(r.studentId); } this.load(); }, error: e => this.rErr.set(errText(e)) });
  }
  pctFrom() { const t = this.ed()?.feeTotal; this.pct = t ? Math.round((this.amt || 0) * 1000 / t) / 10 : 0; }
  amtFrom(total: number) { this.amt = Math.round(total * (this.pct || 0) / 100); }
  saveDiscount() {
    const r = this.ed(); if (!r) return;
    this.api.put('/fees/discount/' + r.studentId, { amount: Number(this.amt) || 0, reason: this.why }).subscribe({ next: () => { this.toast.show(Number(this.amt) ? 'Discount saved' : 'Discount removed'); this.ed.set(null); this.load(); this.loadD(); }, error: e => this.toast.show(errText(e)) });
  }
  loadPlan() { this.pIn = {}; this.api.get('/fees/structure').subscribe(r => this.plan.set(r)); }
  setIn(k: string, v: string) { this.pIn[k] = v; }
  private feeOf(k: string, current: number) { return k in this.pIn ? Number(this.pIn[k]) : current; }
  saveClassFee(c: any) {
    const fee = this.feeOf('c' + c.code, c.fee);
    if (!(fee >= 0) || !c.code) { this.toast.show('Enter the yearly fee for ' + c.code); return; }
    this.pBusy.set('c' + c.code);
    this.api.put<any>('/fees/class/' + c.code, { fee }).subscribe({
      next: r => { this.pBusy.set(''); this.toast.show('Fee for ' + r.classCode + ' set. ' + r.updated + ' students updated' + (r.skipped ? ', ' + r.skipped + ' skipped' : '')); this.loadPlan(); },
      error: e => { this.pBusy.set(''); this.toast.show(errText(e)); },
    });
  }
  saveBusFee(b: any) {
    const fee = this.feeOf('b' + b.id, b.fee);
    if (!(fee >= 0)) { this.toast.show('Enter the yearly fee for bus ' + b.code); return; }
    this.pBusy.set('b' + b.id);
    this.api.put<any>('/fees/bus/' + b.id, { fee }).subscribe({
      next: r => { this.pBusy.set(''); this.toast.show('Bus fee set. ' + r.updated + ' students updated' + (r.skipped ? ', ' + r.skipped + ' skipped' : '')); this.loadPlan(); },
      error: e => { this.pBusy.set(''); this.toast.show(errText(e)); },
    });
  }
  applyBulk() {
    this.bBusy.set(true);
    this.api.put<any>('/fees/discount-bulk', { classCode: this.bClass || null, mode: this.bMode, value: Number(this.bVal) || 0, reason: this.bWhy }).subscribe({
      next: r => { this.bBusy.set(false); this.bConfirm.set(false); this.bResult.set(r); this.toast.show(r.applied + ' students updated'); this.load(); this.loadD(); },
      error: e => { this.bBusy.set(false); this.bConfirm.set(false); this.toast.show(errText(e)); },
    });
  }
  remind() { this.api.post('/fees/remind', {}, { classCode: this.classCode, status: this.status }).subscribe({ next: (r: any) => this.toast.show(`${r.reminders} fee reminder(s) sent`), error: e => this.toast.show(errText(e)) }); }
}
