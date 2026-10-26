import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';

@Component({
  selector: 'app-notifications', standalone: true, imports: [FormsModule, ClassPipe],
  template: `
  <div class="head"><div><h1>Notifications</h1><p class="sub">Send a message to parents or teachers, and see every message the school has sent. Messages are delivered by email to the parent's or teacher's login email. SMS and WhatsApp are not connected yet.</p></div></div>
  <div class="stack">
    <section class="panel"><div class="ph"><h2>Compose</h2></div>
      <form class="form" (ngSubmit)="send()">
        <label>Audience<select name="audience" [(ngModel)]="audience"><option value="all">All parents</option>@for (c of classes(); track c.code) { <option [value]="c.code">Parents of Class {{ c.code | cls }}</option> }<option value="teachers">All teachers</option></select></label>
        <label style="grid-column:1/-1">Message<textarea name="message" [(ngModel)]="message"></textarea></label>
        <div><button class="btn pri" type="submit">Send</button></div></form></section>
    <section class="panel">
      <div class="bar"><select [(ngModel)]="type" (change)="load()" aria-label="Type"><option value="">All types</option>@for (t of types; track t) { <option>{{ t }}</option> }</select><span class="muted">{{ rows().length }} messages</span></div>
      <div class="note" style="margin-bottom:10px"><b>NOT SENT</b> means the person has no email login yet (parents must accept their invite) or email is not set up on the server.</div>
      @if (rows().length === 0) { <div class="empty">No messages yet. Absence, marks, fee, substitution and broadcast messages all land here.</div> } @else {
      <div class="tw"><table><thead><tr><th>Time</th><th>Type</th><th>To</th><th>Phone</th><th>Channel</th><th>Status</th><th>Message</th></tr></thead><tbody>
        @for (n of rows(); track n.id) {
          <tr><td class="mono">{{ n.createdAt.replace('T', ' ').slice(5, 16) }}</td><td><span class="pill" [class.bad]="n.type==='Absence'" [class.warn]="n.type==='Marks'" [class.acc]="n.type!=='Absence' && n.type!=='Marks'">{{ n.type }}</span></td>
            <td>{{ n.toName }}</td><td class="mono">{{ n.phone }}</td><td>{{ n.channel }}</td><td><span class="pill" [class.good]="n.status==='SENT'" [class.bad]="n.status==='FAILED'" [class.warn]="n.status==='NOT SENT'">{{ n.status }}</span></td>
            <td style="white-space:normal;min-width:280px">{{ n.message }}</td></tr> }</tbody></table></div> }
    </section>
  </div>`,
})
export class NotificationsComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  rows = signal<any[]>([]); classes = signal<any[]>([]); type = ''; audience = 'all';
  types = ['Absence', 'Marks', 'Fee', 'Substitution', 'Leave', 'Homework', 'Broadcast', 'Event'];
  message = 'School will close at 12:30 pm tomorrow due to the district sports meet. Buses will run at 12:45 pm.';
  ngOnInit() { this.api.get<any[]>('/school/classes').subscribe(c => this.classes.set(c)); this.load(); }
  load() { this.api.get<any[]>('/notifications', { type: this.type }).subscribe(r => this.rows.set(r)); }
  send() { this.api.post('/notifications/broadcast', { audience: this.audience, message: this.message }).subscribe({ next: (r: any) => { this.toast.show(`Message sent to ${r.recipients} recipients`); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
