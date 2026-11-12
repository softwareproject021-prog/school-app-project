import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { ClassPipe, InrPipe } from '../../core/format';

/** The admission form: student and parent details, tuition fee, transport fee, discount, and an optional first payment taken at the office. */
@Component({
  selector: 'app-admission', standalone: true, imports: [FormsModule, RouterLink, ClassPipe, InrPipe],
  template: `
  <div class="head"><div><h1>New admission</h1><p class="sub">Enrol a student, set the tuition and transport fee, and take the first payment if the parent pays at the office.</p></div></div>
  <div class="stack">
    @if (done(); as r) {
      <section class="panel"><div class="ph"><h2>Admission complete</h2><span class="pill good">{{ r.admissionNo }}</span></div>
        <div class="kpis"><div class="kpi"><div class="l">Class · Roll</div><div class="v">{{ r.classCode | cls }} · {{ r.roll }}</div></div>
          <div class="kpi"><div class="l">Tuition fee</div><div class="v">{{ r.tuitionFee | inr }}</div></div>
          <div class="kpi"><div class="l">Transport fee</div><div class="v">{{ r.transportFee | inr }}</div></div>
          @if (r.discount) { <div class="kpi good"><div class="l">Discount</div><div class="v">−{{ r.discount | inr }}</div></div> }
          <div class="kpi good"><div class="l">Paid</div><div class="v">{{ r.feePaid | inr }}</div></div>
          <div class="kpi" [class.bad]="r.feeDue>0"><div class="l">Due</div><div class="v">{{ r.feeDue | inr }}</div></div></div>
        @if (r.receiptNo) { <p class="muted">Receipt {{ r.receiptNo }} is saved. The parent can see it once they join.</p> }
        <div class="bar"><button class="btn pri" (click)="again()">Admit another student</button><a class="btn" routerLink="/students">Go to students</a><a class="btn" routerLink="/fees">Fee register</a></div>
      </section>
    } @else {
    @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
    <form (ngSubmit)="submit()">
      <section class="panel"><div class="ph"><h2>Student</h2></div>
        <div class="form">
          <label>Student name<input name="name" [(ngModel)]="f.name" maxlength="60" required></label>
          <label>Class<select name="classCode" [(ngModel)]="f.classCode" (ngModelChange)="pickClass()" required><option value="" disabled>Choose a class</option>@for (c of classes(); track c.code) { <option [value]="c.code">Class {{ c.code | cls }}</option> }</select></label>
          <label>Date of birth<input name="dob" type="date" [(ngModel)]="f.dob" [max]="today"></label>
          <label>Gender<select name="gender" [(ngModel)]="f.gender"><option value="">Not said</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
        </div></section>
      <section class="panel"><div class="ph"><h2>Parent</h2></div>
        <div class="form">
          <label>Parent name<input name="parentName" [(ngModel)]="f.parentName" maxlength="60" required></label>
          <label>Parent phone<input name="phone" [(ngModel)]="f.phone" inputmode="tel" maxlength="15" required></label>
          <label>Address<input name="address" [(ngModel)]="f.address" maxlength="300"></label>
        </div></section>
      <section class="panel"><div class="ph"><h2>Fees</h2></div>
        <div class="form">
          <label>Tuition fee for the year (₹)<input name="tuition" type="number" min="0" [(ngModel)]="f.tuitionFee"></label>
          <label>Transport<select name="bus" [(ngModel)]="f.busRouteId"><option [ngValue]="null">No school bus</option>@for (b of buses(); track b.id) { <option [ngValue]="b.id">{{ b.code }} · {{ b.name }} ({{ b.fee | inr }})</option> }</select></label>
          <label>Discount (₹)<input name="discount" type="number" min="0" [(ngModel)]="f.discount"></label>
          @if (f.discount > 0) { <label>Discount reason<input name="why" [(ngModel)]="f.discountReason" maxlength="120" placeholder="Sibling, scholarship…" required></label> }
        </div>
        <div class="kpis" style="margin-top:12px"><div class="kpi"><div class="l">Tuition</div><div class="v">{{ f.tuitionFee || 0 | inr }}</div></div><div class="kpi"><div class="l">Transport</div><div class="v">{{ transport() | inr }}</div></div>
          <div class="kpi good"><div class="l">Discount</div><div class="v">−{{ f.discount || 0 | inr }}</div></div><div class="kpi warn"><div class="l">Total to pay</div><div class="v">{{ total() | inr }}</div></div></div>
      </section>
      <section class="panel"><div class="ph"><h2>First payment (optional)</h2></div>
        <div class="form">
          <label>Amount received now (₹)<input name="pay" type="number" min="0" [max]="total()" [(ngModel)]="f.initialPayment"></label>
          @if (f.initialPayment > 0) {
            <label>Receipt no.<input name="rno" [(ngModel)]="f.receiptNo" maxlength="30" placeholder="from the paper receipt" required></label>
            <label>Mode<select name="mode" [(ngModel)]="f.paymentMode"><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option><option value="UPI">UPI at counter</option><option value="CARD">Card</option><option value="BANK">Bank transfer</option></select></label> }
        </div>
        <div class="bar" style="margin-top:12px"><button class="btn pri" type="submit" [disabled]="busy()">{{ busy() ? 'Admitting…' : 'Admit student' }}</button></div>
      </section>
    </form> }
  </div>`,
})
export class AdmissionComponent implements OnInit {
  private api = inject(Api);
  classes = signal<any[]>([]); buses = signal<any[]>([]); done = signal<any>(null); error = signal(''); busy = signal(false);
  today = new Date().toISOString().slice(0, 10);
  f: any = this.blank();
  transport = () => this.busFee();
  blank() { return { name: '', classCode: '', dob: '', gender: '', parentName: '', phone: '', address: '', tuitionFee: 0, busRouteId: null, discount: 0, discountReason: '', initialPayment: 0, receiptNo: '', paymentMode: 'CASH' }; }
  ngOnInit() { this.api.get<any>('/fees/structure').subscribe(s => { this.classes.set(s.classes); this.buses.set(s.buses ?? []); }); }
  pickClass() { const c = this.classes().find(x => x.code === this.f.classCode); this.f.tuitionFee = c?.fee || 0; }
  busFee() { return this.buses().find(b => b.id === this.f.busRouteId)?.fee || 0; }
  total() { return Math.max(0, (Number(this.f.tuitionFee) || 0) + this.busFee() - (Number(this.f.discount) || 0)); }
  again() { this.done.set(null); this.f = this.blank(); }
  submit() {
    this.error.set(''); this.busy.set(true);
    const f = this.f;
    const body = { name: f.name, classCode: f.classCode, parentName: f.parentName, phone: f.phone, address: f.address || null, gender: f.gender || null, dob: f.dob || null,
      busRouteId: f.busRouteId, tuitionFee: Number(f.tuitionFee) || 0, discount: Number(f.discount) || 0, discountReason: f.discountReason || null,
      initialPayment: Number(f.initialPayment) || 0, receiptNo: f.receiptNo || null, paymentMode: f.paymentMode };
    this.api.post<any>('/school/admissions', body).subscribe({ next: r => { this.busy.set(false); this.done.set(r); }, error: e => { this.busy.set(false); this.error.set(errText(e)); } });
  }
}
