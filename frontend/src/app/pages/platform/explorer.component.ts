import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';

const COLUMNS: Record<string, { key: string; label: string }[]> = {
  students: [{ key: 'name', label: 'Name' }, { key: 'classCode', label: 'Class' }, { key: 'roll', label: 'Roll' }, { key: 'parentName', label: 'Parent' }, { key: 'phone', label: 'Phone' }, { key: 'feePaid', label: 'Fee paid' }],
  teachers: [{ key: 'name', label: 'Name' }, { key: 'subject', label: 'Subject' }, { key: 'phone', label: 'Phone' }],
  classes: [{ key: 'code', label: 'Class' }, { key: 'room', label: 'Room' }, { key: 'classTeacherId', label: 'Class teacher id' }],
  store: [{ key: 'name', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'stock', label: 'Stock' }, { key: 'minLevel', label: 'Min' }],
  events: [{ key: 'title', label: 'Event' }, { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }],
  alerts: [{ key: 'type', label: 'Type' }, { key: 'toName', label: 'To' }, { key: 'message', label: 'Message' }, { key: 'createdAt', label: 'Time' }],
};

@Component({
  selector: 'app-explorer', standalone: true, imports: [FormsModule],
  template: `
  <div class="head"><div><h1>Data explorer</h1><p class="sub">Pick a school and a dataset from the dropdowns, then search across every row.</p></div></div>
  <section class="panel">
    <div class="bar">
      <select [(ngModel)]="schoolId" (change)="load()" aria-label="School"><option value="">All schools</option>@for (s of schools(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }</select>
      <select [(ngModel)]="dataset" (change)="load()" aria-label="Dataset">
        <option value="students">Students</option><option value="teachers">Teachers</option><option value="classes">Classes</option>
        <option value="store">Stationery store</option><option value="events">Events</option><option value="alerts">Parent alerts sent</option></select>
      <input type="search" [(ngModel)]="q" (ngModelChange)="typed()" placeholder="Search within results…" aria-label="Search">
    </div>
    @if (error()) { <div class="err">{{ error() }}</div> }
    @if (total() === 0) { <div class="empty">Nothing found.</div> } @else {
      <p class="muted" style="margin:0 0 8px">{{ total() }} rows@if (total() > 50) { · showing the first 50, narrow with search }</p>
      <div class="tw"><table><thead><tr><th>School</th>@for (c of cols(); track c.key) { <th>{{ c.label }}</th> }</tr></thead><tbody>
        @for (r of rows(); track $index) { <tr><td>{{ schoolName(r.schoolId) }}</td>@for (c of cols(); track c.key) { <td>{{ r[c.key] }}</td> }</tr> }
      </tbody></table></div>
    }
  </section>`,
})
export class ExplorerComponent implements OnInit {
  private api = inject(Api);
  schools = signal<any[]>([]); rows = signal<any[]>([]); total = signal(0); error = signal('');
  schoolId = ''; dataset = 'students'; q = ''; private t: any;
  cols = () => COLUMNS[this.dataset];
  ngOnInit() { this.api.get<any[]>('/platform/schools').subscribe(s => this.schools.set(s)); this.load(); }
  schoolName(id: number) { return this.schools().find(s => s.id === id)?.name ?? id; }
  typed() { clearTimeout(this.t); this.t = setTimeout(() => this.load(), 250); }
  load() {
    this.api.get('/platform/explorer', { schoolId: this.schoolId, dataset: this.dataset, q: this.q, size: 50 }).subscribe({
      next: r => { this.rows.set(r.rows); this.total.set(r.total); this.error.set(''); }, error: e => this.error.set(errText(e)) });
  }
}
