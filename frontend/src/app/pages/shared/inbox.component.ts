import { Component, OnInit, inject, signal } from '@angular/core';
import { Api } from '../../core/api.service';
import { Auth } from '../../core/auth.service';

@Component({
  selector: 'app-inbox', standalone: true,
  template: `
  <div class="head"><div><h1>Messages</h1><p class="sub">{{ isTeacher ? 'Substitute duties, leave decisions and staff notices.' : 'Every SMS and WhatsApp message the school has sent you.' }}</p></div></div>
  <section class="panel">
    @if (rows().length) { <div class="feed">@for (n of rows(); track n.id) {
      <div class="it"><div class="msg" style="font-size:14px"><span class="pill" [class.bad]="n.type==='Absence'" [class.acc]="n.type!=='Absence'">{{ n.type }}</span> <span class="muted">{{ n.channel }}</span><div>{{ n.message }}</div></div>
        <span class="mono muted" style="font-size:12px">{{ n.createdAt.replace('T', ' ').slice(5, 16) }}</span></div> }</div> }
    @else { <div class="empty">No messages yet.{{ isTeacher ? ' Substitute duties and leave decisions will appear here.' : ' Alerts about attendance, marks, fees and events will appear here.' }}</div> }
  </section>`,
})
export class InboxComponent implements OnInit {
  private api = inject(Api);
  isTeacher = inject(Auth).effectiveRole() === 'TEACHER';
  rows = signal<any[]>([]);
  ngOnInit() { this.api.get<any[]>('/notifications/inbox').subscribe(r => this.rows.set(r)); }
}
