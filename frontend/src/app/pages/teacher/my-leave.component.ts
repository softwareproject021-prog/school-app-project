import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { isoToday } from '../../core/dates';

@Component({
  selector: 'app-my-leave', standalone: true, imports: [FormsModule],
  template: `
  <div class="head"><div><h1>Leave requests</h1><p class="sub">Apply for leave. The principal approves it and arranges substitutes for your periods.</p></div></div>
  <div class="stack">
    <section class="panel"><form class="form" (ngSubmit)="send()">
      <label>Date<input type="date" name="date" [(ngModel)]="f.date" [min]="min"></label>
      <label>Type<select name="kind" [(ngModel)]="f.kind"><option>Full day</option><option>Half day</option></select></label>
      <label style="grid-column:1/-1">Reason<input type="text" name="reason" [(ngModel)]="f.reason" required placeholder="e.g. Medical appointment"></label>
      <div><button class="btn pri" type="submit">Send request</button></div></form></section>
    <section class="panel"><div class="ph"><h2>My requests</h2></div>
      @if (rows().length) { <div class="tw"><table><thead><tr><th>Date</th><th>Type</th><th>Reason</th><th>Status</th></tr></thead><tbody>
        @for (r of rows(); track r.id) { <tr><td class="mono">{{ r.date }}</td><td>{{ r.kind }}</td><td>{{ r.reason }}</td>
          <td><span class="pill" [class.good]="r.status==='APPROVED'" [class.bad]="r.status==='REJECTED'" [class.warn]="r.status==='PENDING'">{{ r.status.charAt(0) + r.status.slice(1).toLowerCase() }}</span></td></tr> }</tbody></table></div> }
      @else { <div class="empty">No requests yet.</div> }</section>
  </div>`,
})
export class MyLeaveComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  min = isoToday(); rows = signal<any[]>([]); f = { date: isoToday(), kind: 'Full day', reason: '' };
  ngOnInit() { this.load(); }
  load() { this.api.get<any[]>('/leave/requests').subscribe(r => this.rows.set(r)); }
  send() { this.api.post('/leave/requests', this.f).subscribe({ next: () => { this.toast.show('Leave request sent to the principal'); this.f.reason = ''; this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
