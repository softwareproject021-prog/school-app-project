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
    <div class="kpis"><div class="kpi"><div class="l">Annual fee</div><div class="v">{{ d.feeTotal | inr }}</div></div>@if (d.feeDiscount) { <div class="kpi good"><div class="l">Discount</div><div class="v">−{{ d.feeDiscount | inr }}</div>@if (d.discountReason) { <div class="muted" style="font-size:12px">{{ d.discountReason }}</div> }</div><div class="kpi"><div class="l">Fee to pay</div><div class="v">{{ d.feeNet | inr }}</div></div> }<div class="kpi good"><div class="l">Paid</div><div class="v">{{ d.feePaid | inr }}</div></div>
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
      @if (d.receipts.length) { <div class="tw"><table><thead><tr><th>Receipt</th><th>Date</th><th>Mode</th><th class="n">Amount</th></tr></thead><tbody>
        @for (p of d.receipts; track p.id) { <tr><td class="mono">{{ p.receiptNo }}</td><td>{{ p.date }}</td><td>{{ p.mode }}</td><td class="n">{{ p.amount | inr }}</td></tr> }</tbody></table></div> }
      @else { <div class="empty">No online payments yet.</div> }</section>
  </div>
  }`,
})
export class ChildFeesComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  d = signal<any>(null); confirm = signal(false); busy = signal(false);
  ngOnInit() { this.load(); }
  load() { this.api.get('/fees/mine').subscribe(r => this.d.set(r)); }
  pay() {
    this.busy.set(true);
    this.api.post('/fees/pay').subscribe({ next: (p: any) => { this.busy.set(false); this.confirm.set(false); this.toast.show('Payment successful · receipt ' + p.receiptNo); this.load(); }, error: e => { this.busy.set(false); this.toast.show(errText(e)); } });
  }
}
