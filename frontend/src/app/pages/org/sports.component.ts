import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { EVENT_ART } from '../../core/event-art';
import { isoToday } from '../../core/dates';

@Component({
  selector: 'app-sports', standalone: true, imports: [FormsModule],
  template: `
  <div class="head"><div><h1>Sports</h1><p class="sub">Teams, fixtures and results.</p></div></div>
  <div class="stack">
    <div class="banner" [innerHTML]="art"></div>
    <div class="grid2">
      <section class="panel"><div class="ph"><h2>Teams</h2></div><div class="tw"><table><thead><tr><th>Team</th><th>Coach</th><th class="n">Players</th></tr></thead><tbody>
        @for (t of teams(); track t.id) { <tr><td><b>{{ t.name }}</b></td><td>{{ t.coach }}</td><td class="n">{{ t.players }}</td></tr> }</tbody></table></div></section>
      <section class="panel"><div class="ph"><h2>Fixtures</h2></div><div class="tw"><table><thead><tr><th>Date</th><th>Team</th><th>Opponent</th><th>Venue</th><th>Result</th></tr></thead><tbody>
        @for (f of fixtures(); track f.id) {
          <tr><td class="mono">{{ f.date }}</td><td>{{ f.team }}</td><td>{{ f.opponent }}</td><td>{{ f.venue }}</td>
            <td>@if (f.result) { <span class="pill good">{{ f.result }}</span> } @else if (canEdit && f.date <= today) { <button class="btn sm" (click)="record(f)">Record result</button> } @else { <span class="muted">Upcoming</span> }</td></tr> }</tbody></table></div></section>
    </div>
    @if (canEdit) {
      <section class="panel"><div class="ph"><h2>Add fixture</h2></div>
        <form class="form" (ngSubmit)="add()">
          <label>Team<select name="team" [(ngModel)]="f.team">@for (t of teams(); track t.id) { <option>{{ t.name }}</option> }</select></label>
          <label>Opponent<input type="text" name="opponent" [(ngModel)]="f.opponent" required placeholder="e.g. Oakridge International"></label>
          <label>Date<input type="date" name="date" [(ngModel)]="f.date"></label><label>Venue<input type="text" name="venue" [(ngModel)]="f.venue"></label>
          <div><button class="btn pri" type="submit">Add fixture</button></div></form></section> }
  </div>`,
})
export class SportsComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast); private auth = inject(Auth);
  art = inject(DomSanitizer).bypassSecurityTrustHtml(EVENT_ART['Cricket']);
  teams = signal<any[]>([]); fixtures = signal<any[]>([]); today = isoToday();
  canEdit = this.auth.effectiveRole() === 'ORG_ADMIN';
  f: any = { team: '', opponent: '', date: isoToday(), venue: 'Home' };
  ngOnInit() { this.load(); }
  load() { this.api.get('/sports').subscribe(r => { this.teams.set(r.teams); this.fixtures.set(r.fixtures); if (!this.f.team && r.teams.length) this.f.team = r.teams[0].name; }); }
  add() { this.api.post('/sports/fixtures', this.f).subscribe({ next: () => { this.toast.show('Fixture added'); this.f.opponent = ''; this.load(); }, error: e => this.toast.show(errText(e)) }); }
  record(f: any) { this.api.patch('/sports/fixtures/' + f.id, { result: 'Won' }).subscribe({ next: () => { this.toast.show('Result recorded'); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
