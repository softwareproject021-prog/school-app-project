import { Component, OnInit, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { isoToday } from '../../core/dates';

@Component({
  selector: 'app-holidays', standalone: true, imports: [FormsModule, NgTemplateOutlet],
  styles: [`.hl{display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line,#e5e9f0)}.hl:last-child{border:0}
    .hd{min-width:64px;text-align:center;border-radius:12px;padding:8px 6px;background:#fdecea;color:#b3261e}.hd b{display:block;font-size:22px;line-height:1}.hd span{font-size:11px;text-transform:uppercase;letter-spacing:.04em}
    .hl.now .hd{background:#e7f6ee;color:#14693d}.hl.past{opacity:.6}.hm{flex:1;min-width:0}.hm h3{margin:0;font-size:16px}.hm p{margin:2px 0 0;font-size:13px}`],
  template: `
  <div class="head"><div><h1>Holidays</h1><p class="sub">{{ canEdit ? 'Declare a holiday and every parent and teacher is messaged.' : 'School holidays and the day school reopens.' }}</p></div>
    @if (canEdit) { <button class="btn acc" (click)="showForm.set(!showForm())">{{ showForm() ? 'Close form' : '+ Declare holiday' }}</button> }</div>
  <div class="stack">
    @if (canEdit && showForm()) {
      <section class="panel"><div class="ph"><h2>Declare a holiday</h2></div>
        <form class="form" (ngSubmit)="add()">
          <label>Holiday name *<input type="text" name="title" [(ngModel)]="f.title" required maxlength="80" placeholder="e.g. Diwali holidays"></label>
          <label>First day *<input type="date" name="from" [(ngModel)]="f.from" required></label>
          <label>Last day (leave empty for one day)<input type="date" name="to" [(ngModel)]="f.to" [min]="f.from"></label>
          <label>Reason (optional)<input type="text" name="reason" [(ngModel)]="f.reason" maxlength="300" placeholder="e.g. Festival, heavy rain, election duty"></label>
          <label>Message parents and teachers<select name="notifyParents" [(ngModel)]="f.notifyParents"><option [ngValue]="true">Yes, send now</option><option [ngValue]="false">No</option></select></label>
          <div><button class="btn pri" type="submit" [disabled]="busy() || !f.title.trim() || !f.from">Declare holiday</button></div></form>
        @if (error()) { <div class="err" style="margin-top:10px">{{ error() }}</div> }</section> }
    <section class="panel"><div class="ph"><h2>Upcoming and current</h2></div>
      @for (h of coming(); track h.id) { <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ h: h }" /> } @empty { <div class="empty">No holidays declared.</div> }</section>
    @if (past().length) { <section class="panel"><div class="ph"><h2>Past</h2></div>
      @for (h of past(); track h.id) { <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ h: h }" /> }</section> }
  </div>
  <ng-template #row let-h="h">
    <div class="hl" [class.now]="h.status === 'ONGOING'" [class.past]="h.status === 'PAST'">
      <div class="hd"><b>{{ h.from.slice(8) }}</b><span>{{ month(h.from) }}</span></div>
      <div class="hm"><h3>{{ h.title }} @if (h.status === 'ONGOING') { <span class="pill good">On now</span> }</h3>
        <p class="muted">{{ range(h) }} · {{ h.days }} {{ h.days === 1 ? 'day' : 'days' }}@if (h.reason) { · {{ h.reason }} }</p>
        @if (h.status !== 'PAST') { <p><b>School reopens {{ h.reopens }}</b></p> }</div>
      @if (canEdit) { @if (confirmId() === h.id) { <button class="btn sm danger" (click)="remove(h)">Confirm delete</button> <button class="btn sm" (click)="confirmId.set(null)">Cancel</button> }
        @else { <button class="btn sm" (click)="confirmId.set(h.id)" [attr.aria-label]="'Delete ' + h.title">Delete</button> } }
    </div>
  </ng-template>`,
})
export class HolidaysComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast);
  canEdit = this.auth.effectiveRole() === 'ORG_ADMIN';
  rows = signal<any[]>([]); showForm = signal(false); error = signal(''); busy = signal(false); confirmId = signal<number | null>(null);
  f: any = { title: '', from: isoToday(), to: '', reason: '', notifyParents: true };
  coming = () => this.rows().filter(h => h.status !== 'PAST');
  past = () => this.rows().filter(h => h.status === 'PAST').reverse();
  ngOnInit() { this.load(); }
  load() { this.api.get<any[]>('/holidays').subscribe(r => this.rows.set(r)); }
  month(iso: string) { return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' }); }
  range(h: any) { const d = (x: string) => new Date(x + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); return h.from === h.to ? d(h.from) : d(h.from) + ' to ' + d(h.to); }
  add() {
    this.error.set(''); this.busy.set(true);
    const body = { title: this.f.title.trim(), from: this.f.from, to: this.f.to || null, reason: this.f.reason, notifyParents: this.f.notifyParents };
    this.api.post<any>('/holidays', body).subscribe({
      next: r => { this.busy.set(false); this.toast.show(r.notified ? 'Holiday declared and parents messaged' : 'Holiday declared'); this.f = { title: '', from: isoToday(), to: '', reason: '', notifyParents: true }; this.showForm.set(false); this.load(); },
      error: e => { this.busy.set(false); this.error.set(errText(e)); } });
  }
  remove(h: any) { this.api.delete('/events/' + h.id).subscribe({ next: () => { this.toast.show('Holiday removed'); this.confirmId.set(null); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
