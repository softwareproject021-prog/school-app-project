import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe, InrPipe } from '../../core/format';

@Component({
  selector: 'app-store', standalone: true, imports: [FormsModule, InrPipe, ClassPipe],
  template: `
  <div class="head"><div><h1>Stationery store</h1><p class="sub">Issue items to students and restock. Items below their minimum level are flagged.</p></div></div>
  <div class="stack">
    <section class="panel"><div class="tw"><table><thead><tr><th>Item</th><th>Category</th><th class="n">Price</th><th class="n">In stock</th><th class="n">Min level</th><th>Status</th><th>Issue / restock</th></tr></thead><tbody>
      @for (i of items(); track i.id) {
        <tr><td><b>{{ i.name }}</b></td><td>{{ i.category }}</td><td class="n">{{ i.price | inr }}</td><td class="n">{{ i.stock }}</td><td class="n">{{ i.minLevel }}</td>
          <td><span class="pill" [class.bad]="i.low" [class.good]="!i.low">{{ i.low ? 'Reorder' : 'OK' }}</span></td>
          <td><button class="btn sm" (click)="adjust(i, -1)">Issue 1</button> <button class="btn sm" (click)="adjust(i, 50)">+50</button></td></tr> }
    </tbody></table></div></section>
    <section class="panel"><div class="ph"><h2>Issue to a student</h2><span class="muted" style="font-size:13px">Records what the family bought and whether they have paid. Shows on the Statistics page.</span></div>
      <form class="form" (ngSubmit)="issue()">
        <label>Class<select name="ic" [(ngModel)]="ic" (change)="loadStudents()"><option value="">Choose class</option>@for (c of classes(); track c.code) { <option [value]="c.code">Class {{ c.code | cls }}</option> }</select></label>
        <label>Student<select name="is" [(ngModel)]="sale.studentId"><option [ngValue]="null">Choose student</option>@for (s of students(); track s.id) { <option [ngValue]="s.id">{{ s.roll }}. {{ s.name }}</option> }</select></label>
        <label>Item<select name="ii" [(ngModel)]="sale.itemId"><option [ngValue]="null">Choose item</option>@for (i of items(); track i.id) { <option [ngValue]="i.id" [disabled]="i.stock < 1">{{ i.name }} ({{ i.category }}) · {{ i.price | inr }} · {{ i.stock }} left</option> }</select></label>
        <label>Quantity<input type="number" name="iq" min="1" max="100" [(ngModel)]="sale.qty"></label>
        <label>Payment<select name="ip" [(ngModel)]="sale.paid"><option [ngValue]="false">Not paid yet</option><option [ngValue]="true">Paid now</option></select></label>
        <div><button class="btn pri" type="submit">Issue item</button></div></form></section>
    <section class="panel"><div class="ph"><h2>Issued to students</h2>
      <div class="bar" style="margin:0"><select [(ngModel)]="sp" (change)="loadSales()" aria-label="Payment filter"><option value="">All</option><option value="no">Not paid</option><option value="yes">Paid</option></select></div></div>
      @if (sales().length === 0) { <div class="empty">Nothing issued yet.</div> } @else {
      <div class="tw"><table><thead><tr><th>Date</th><th>Class</th><th>Student</th><th>Item</th><th class="n">Qty</th><th class="n">Amount</th><th>Status</th><th></th></tr></thead><tbody>
        @for (x of sales(); track x.id) {
          <tr><td class="mono">{{ x.date }}</td><td>{{ x.classCode | cls }}</td><td>{{ x.studentName }}</td><td>{{ x.itemName }} <span class="muted">· {{ x.category }}</span></td><td class="n">{{ x.qty }}</td><td class="n">{{ x.amount | inr }}</td>
            <td><span class="pill" [class.good]="x.paid" [class.bad]="!x.paid">{{ x.paid ? 'Paid' : 'Not paid' }}</span></td>
            <td><button class="btn sm" (click)="setPaid(x, !x.paid)">{{ x.paid ? 'Mark not paid' : 'Mark paid' }}</button> <button class="btn sm danger" (click)="cancel(x)">Cancel</button></td></tr> }
      </tbody></table></div> }</section>
    <section class="panel"><div class="ph"><h2>Add item</h2></div>
      <form class="form" (ngSubmit)="add()">
        <label>Item name<input type="text" name="name" [(ngModel)]="f.name" required placeholder="e.g. Drawing book"></label>
        <label>Category<select name="category" [(ngModel)]="f.category"><option>Stationery</option><option>Books</option><option>Uniform</option><option>Craft</option></select></label>
        <label>Stock<input type="number" name="stock" [(ngModel)]="f.stock"></label><label>Min level<input type="number" name="minLevel" [(ngModel)]="f.minLevel"></label>
        <label>Price (₹)<input type="number" name="price" [(ngModel)]="f.price"></label><div><button class="btn pri" type="submit">Add item</button></div></form></section>
  </div>`,
})
export class StoreComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  items = signal<any[]>([]); f: any = { name: '', category: 'Stationery', stock: 100, minLevel: 30, price: 60 };
  classes = signal<any[]>([]); students = signal<any[]>([]); sales = signal<any[]>([]); ic = ''; sp = '';
  sale: any = { studentId: null, itemId: null, qty: 1, paid: false };
  ngOnInit() { this.load(); this.loadSales(); this.api.get<any[]>('/school/classes').subscribe(c => this.classes.set(c)); }
  loadStudents() { this.sale.studentId = null; this.students.set([]); if (this.ic) this.api.get<any[]>('/school/students', { classCode: this.ic }).subscribe(s => this.students.set(s)); }
  loadSales() { this.api.get<any[]>('/store/sales', { paid: this.sp }).subscribe(r => this.sales.set(r)); }
  issue() {
    if (!this.sale.studentId || !this.sale.itemId) { this.toast.show('Choose a class, a student and an item.'); return; }
    this.api.post('/store/sales', this.sale).subscribe({ next: () => { this.toast.show('Item issued'); this.sale.itemId = null; this.sale.qty = 1; this.load(); this.loadSales(); }, error: e => this.toast.show(errText(e)) });
  }
  setPaid(x: any, paid: boolean) { this.api.patch('/store/sales/' + x.id + '/pay', { paid }).subscribe({ next: () => this.loadSales(), error: e => this.toast.show(errText(e)) }); }
  cancel(x: any) { if (!confirm('Cancel this issue? The stock goes back to the store.')) return; this.api.delete('/store/sales/' + x.id).subscribe({ next: () => { this.toast.show('Cancelled'); this.load(); this.loadSales(); }, error: e => this.toast.show(errText(e)) }); }
  load() { this.api.get<any[]>('/store').subscribe(r => this.items.set(r)); }
  adjust(i: any, delta: number) { this.api.patch('/store/' + i.id, { delta }).subscribe({ next: () => this.load(), error: e => this.toast.show(errText(e)) }); }
  add() { this.api.post('/store', this.f).subscribe({ next: () => { this.toast.show('Item added'); this.f.name = ''; this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
