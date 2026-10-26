import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { InrPipe } from '../../core/format';

@Component({
  selector: 'app-schools', standalone: true, imports: [FormsModule, RouterLink, InrPipe],
  template: `
  <div class="head"><div><h1>Schools on Campus1Cloud</h1><p class="sub">Every school you have sold access to. Search, filter, and open any school's data.</p></div>
    <a class="btn acc" routerLink="/add-school">+ Add school</a></div>
  <div class="stack">
    @if (sum(); as s) {
      <div class="kpis">
        <div class="kpi"><div class="l">Schools</div><div class="v">{{ s.schools }}</div></div>
        <div class="kpi good"><div class="l">Active</div><div class="v">{{ s.active }}</div></div>
        <div class="kpi warn"><div class="l">Trial</div><div class="v">{{ s.trial }}</div></div>
        <div class="kpi bad"><div class="l">Suspended</div><div class="v">{{ s.suspended }}</div></div>
        <div class="kpi"><div class="l">Students</div><div class="v">{{ s.students }}</div></div>
        <div class="kpi"><div class="l">Monthly revenue</div><div class="v">{{ s.monthlyRevenue | inr }}</div></div>
        <div class="kpi warn"><div class="l">Renewals ≤ 30 days</div><div class="v">{{ s.renewalsDue }}</div></div>
      </div>
    }
    <section class="panel">
      <div class="bar">
        <input type="search" [(ngModel)]="q" (ngModelChange)="typed()" placeholder="Search school, city or admin…" aria-label="Search schools">
        <select [(ngModel)]="state" (change)="load()" aria-label="State"><option value="">All states</option>@for (x of states; track x) { <option>{{ x }}</option> }</select>
        <select [(ngModel)]="plan" (change)="load()" aria-label="Plan"><option value="">All plans</option><option>Basic</option><option>Standard</option><option>Premium</option></select>
        <select [(ngModel)]="status" (change)="load()" aria-label="Status"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="TRIAL">Trial</option><option value="SUSPENDED">Suspended</option></select>
      </div>
      @if (error()) { <div class="err">{{ error() }}</div> }
      @if (rows().length === 0 && !loading()) { <div class="empty">No schools match. Clear the search or change a filter.</div> }
      @else {
      <div class="tw"><table><thead><tr><th>School</th><th>City</th><th>Org admin</th><th>Plan</th><th class="n">Students</th><th class="n">Teachers</th><th>Status</th><th>Renewal</th><th>Actions</th></tr></thead><tbody>
        @for (s of rows(); track s.id) {
          <tr><td><b>{{ s.name }}</b></td><td>{{ s.city }}, <span class="muted">{{ s.state }}</span></td><td>{{ s.adminName }}</td>
            <td>{{ s.plan }} <span class="muted mono">{{ s.monthly | inr }}/mo</span></td><td class="n">{{ s.students }}</td><td class="n">{{ s.teachers }}</td>
            <td><span class="pill" [class.good]="s.status==='ACTIVE'" [class.warn]="s.status==='TRIAL'" [class.bad]="s.status==='SUSPENDED'">{{ label(s.status) }}</span></td>
            <td class="mono">{{ s.renewDate }}</td>
            <td><button class="btn sm pri" (click)="auth.viewAs(s.id, s.name)">View as school</button>
              <button class="btn sm" [class.danger]="s.status!=='SUSPENDED'" (click)="toggle(s)">{{ s.status === 'SUSPENDED' ? 'Activate' : 'Suspend' }}</button></td></tr>
        }
      </tbody></table></div>
      }
    </section>
  </div>`,
})
export class SchoolsComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast); auth = inject(Auth);
  rows = signal<any[]>([]); sum = signal<any>(null); loading = signal(true); error = signal('');
  q = ''; state = ''; plan = ''; status = '';
  states = ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra'];
  private t: any;
  ngOnInit() { this.load(); this.summary(); }
  summary() { this.api.get('/platform/summary').subscribe(s => this.sum.set(s)); }
  typed() { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 250); }
  label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase(); }
  load() {
    this.loading.set(true);
    this.api.get<any[]>('/platform/schools', { q: this.q, state: this.state, plan: this.plan, status: this.status }).subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); this.error.set(''); }, error: e => { this.error.set(errText(e)); this.loading.set(false); } });
  }
  toggle(s: any) {
    const next = s.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    this.api.patch(`/platform/schools/${s.id}/status`, { status: next }).subscribe({
      next: () => { this.toast.show(`${s.name} ${next === 'SUSPENDED' ? 'suspended. Its users can no longer log in' : 'activated'}`); this.load(); this.summary(); },
      error: e => this.toast.show(errText(e)) });
  }
}
