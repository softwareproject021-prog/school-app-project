import { Component, OnInit, inject, signal } from '@angular/core';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { InrPipe } from '../../core/format';

@Component({
  selector: 'app-child-fees', standalone: true, imports: [InrPipe],
  template: `
  @if (d(); as d) {
  <div class="head"><div><h1>Fees</h1><p class="sub">{{ d.studentName }} · Academic year 2026–27</p></div></div>
  <div class="stack">
    <div class="kpis"><div class="kpi"><div class="l">Class fee{{ d.classCode ? ' · ' + d.classCode : '' }}</div><div class="v">{{ d.classFee | inr }}</div></div>@if (d.busFee) { <div class="kpi"><div class="l">Bus fee{{ d.busCode ? ' · ' + d.busCode : '' }}</div><div class="v">{{ d.busFee | inr }}</div></div> }@if (d.feeDiscount) { <div class="kpi good"><div class="l">Discount</div><div class="v">−{{ d.feeDiscount | inr }}</div>@if (d.discountReason) { <div class="muted" style="font-size:12px">{{ d.discountReason }}</div> }</div><div class="kpi"><div class="l">Fee to pay</div><div class="v">{{ d.feeNet | inr }}</div></div> }<div class="kpi good"><div class="l">Paid</div><div class="v">{{ d.feePaid | inr }}</div></div>
      <div class="kpi" [class.bad]="d.feeDue>0" [class.good]="d.feeDue===0"><div class="l">Due</div><div class="v">{{ d.feeDue | inr }}</div></div></div>
    <section class="panel">
      @if (d.feeDue > 0) {
        @if (confirm()) { <h2>Confirm payment</h2><p style="margin:8px 0 14px">Pay <b>{{ d.feeDue | inr }}</b> by UPI.</p>
          <div class="bar" style="margin:0"><button class="btn acc" (click)="pay()" [disabled]="busy()">Pay {{ d.feeDue | inr }}</button><button class="btn" (click)="confirm.set(false)">Cancel</button></div>
          <p class="muted" style="margin:10px 0 0;font-size:13px">Demo payment. No money moves.</p> }
        @else { <div class="ph"><h2>{{ d.feeDue | inr }} pending</h2><button class="btn acc" (click)="confirm.set(true)">Pay now</button></div><p class="muted" style="margin:0">UPI, debit card or net banking. A receipt is sent by SMS.</p> }
      } @else { <div class="empty">All fees paid. Thank you.</div> }
    </section>
    @if (d.items?.length) { <section class="panel"><div class="ph"><h2>Uniform and stationery</h2></div><div class="tw"><table><thead><tr><th>Date</th><th>Item</th><th class="n">Qty</th><th class="n">Amount</th><th>Status</th></tr></thead><tbody>
      @for (x of d.items; track x.id) { <tr><td>{{ x.date }}</td><td>{{ x.name }} <span class="muted">· {{ x.category }}</span></td><td class="n">{{ x.qty }}</td><td class="n">{{ x.amount | inr }}</td><td><span class="pill" [class.good]="x.paid" [class.bad]="!x.paid">{{ x.paid ? 'Paid' : 'Pay at school' }}</span></td></tr> }</tbody></table></div></section> }
    <section class="panel"><div class="ph"><h2>Receipts</h2></div>
      @if (d.receipts.length) { <div class="tw"><table><thead><tr><th>Receipt</th><th>Date</th><th>Paid</th><th class="n">Amount</th><th></th></tr></thead><tbody>
        @for (p of d.receipts; track p.id) { <tr><td class="mono">{{ p.receiptNo }}</td><td>{{ p.date }}</td><td>{{ p.recordedBy ? 'At school · ' : 'Online · ' }}{{ p.mode }}</td><td class="n">{{ p.amount | inr }}</td>
          <td><button class="btn sm" (click)="slip(p)" [attr.aria-label]="'View pay slip ' + p.receiptNo">Pay slip</button></td></tr> }</tbody></table></div> }
      @else { <div class="empty">No payments yet.</div> }</section>
  </div>
  }`,
})
export class ChildFeesComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  d = signal<any>(null); confirm = signal(false); busy = signal(false);
  ngOnInit() { this.load(); }
  load() { this.api.get('/fees/mine').subscribe(r => this.d.set(r)); }
  /** Opens a printable pay slip for one receipt (also works as "save as PDF" from the print dialog). */
  slip(p: any) {
    const d = this.d(); if (!d) return;
    const e = (v: any) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
    const row = (k: string, v: any) => `<tr><td class="k">${e(k)}</td><td>${e(v)}</td></tr>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Fee receipt ${e(p.receiptNo)}</title>
      <style>body{font:15px/1.5 system-ui,sans-serif;max-width:520px;margin:24px auto;padding:0 16px;color:#111}h1{font-size:20px;margin:0}h2{font-size:15px;margin:2px 0 14px;color:#555;font-weight:500}
      table{width:100%;border-collapse:collapse}td{padding:7px 4px;border-bottom:1px solid #ddd}.k{color:#555;width:42%}.amt td{font-size:18px;font-weight:700;border-bottom:2px solid #111}
      .f{margin-top:16px;color:#555;font-size:13px}button{margin-top:16px;padding:8px 16px}@media print{button{display:none}}</style></head><body>
      <h1>${e(d.schoolName || 'School')}</h1><h2>Fee payment slip</h2><table>
      ${row('Receipt no.', p.receiptNo)}${row('Date', p.date)}${row('Student', d.studentName)}${row('Class', d.classCode)}${d.admissionNo ? row('Admission no.', d.admissionNo) : ''}${row('Parent', d.parentName)}
      ${row('Paid by', (p.recordedBy ? 'At school office · ' : 'Online · ') + p.mode)}${p.note ? row('Note', p.note) : ''}
      <tr class="amt"><td class="k">Amount received</td><td>Rs ${e(p.amount)}</td></tr>
      ${row('Total fee after discount', 'Rs ' + d.feeNet)}${row('Total paid so far', 'Rs ' + d.feePaid)}${row('Pending now', 'Rs ' + d.feeDue)}</table>
      <p class="f">This is a computer-generated slip for the payment recorded by the school.${p.recordedBy ? ' Recorded by ' + e(p.recordedBy) + '.' : ''}</p>
      <button onclick="window.print()">Print or save as PDF</button></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { this.toast.show('Allow pop-ups to open the pay slip'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  pay() {
    this.busy.set(true);
    this.api.post('/fees/pay').subscribe({ next: (p: any) => { this.busy.set(false); this.confirm.set(false); this.toast.show('Payment successful · receipt ' + p.receiptNo); this.load(); }, error: e => { this.busy.set(false); this.toast.show(errText(e)); } });
  }
}
