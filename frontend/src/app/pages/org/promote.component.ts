import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';

/** Promote session: move a class to the next class in the same section (6A to 7A). Principal / Main Admin only. */
@Component({
  selector: 'app-promote', standalone: true, imports: [ClassPipe, FormsModule, DatePipe],
  template: `
  <div class="head"><div><h1>Promote session</h1><p class="sub">Move all students of a class to the next class in the same section, for example 6-A to 7-A.</p></div></div>
  <div class="stack">
    <div class="note">Promoting the whole school? Start with the highest class (10 to 11, then 9 to 10, and so on) so every next class is empty.
      Attendance, marks and fees stay with each student.</div>

    <section class="panel"><div class="ph"><h2>Choose a class</h2></div>
      <form class="form" (ngSubmit)="loadPreview()">
        <label>Promote from<select name="fromClass" [(ngModel)]="fromClass" (ngModelChange)="loadPreview()">
          <option [ngValue]="''">Select a class</option>
          @for (c of classes(); track c.code) { <option [ngValue]="c.code">{{ c.code | cls }}</option> }
        </select></label>
      </form>
      @if (error()) { <div class="err" style="margin-top:10px">{{ error() }}</div> }
    </section>

    @if (p(); as p) {
      <section class="panel">
        @if (p.finalClass) {
          <div class="empty">Class {{ p.fromClass | cls }} is the final class and cannot be promoted.</div>
        } @else {
          <div class="ph"><h2>{{ p.fromClass | cls }} → {{ p.toClass | cls }}</h2>
            <span class="pill" [class.good]="p.targetExists && !p.targetStrength" [class.warn]="!p.targetExists || p.targetStrength">
              {{ !p.targetExists ? 'New class, will be created' : p.targetStrength ? p.targetStrength + ' students already there' : 'Empty, ready' }}</span></div>
          @if (p.students.length === 0) {
            <div class="empty">Class {{ p.fromClass | cls }} has no students to promote.</div>
          } @else {
            @if (p.targetStrength > 0) {
              <div class="note" style="margin-bottom:10px">Class {{ p.toClass | cls }} already has {{ p.targetStrength }} students. Promote {{ p.toClass | cls }} first, or tick below to add these students after them.
                <label style="display:block;margin-top:6px"><input type="checkbox" name="merge" [(ngModel)]="allowMerge"> Add them to {{ p.toClass | cls }} anyway</label></div>
            }
            <div class="bar" style="margin-bottom:8px"><span class="muted">{{ selectedCount() }} of {{ p.students.length }} students will move. Untick anyone who is held back.</span>
              <button class="btn sm" type="button" (click)="setAll(true)">Select all</button> <button class="btn sm" type="button" (click)="setAll(false)">Clear</button></div>
            <div class="tw"><table><thead><tr><th style="width:40px"></th><th class="n">Roll</th><th>Student</th><th>Moves to</th></tr></thead><tbody>
              @for (s of p.students; track s.id) {
                <tr><td><input type="checkbox" [checked]="!held().has(s.id)" (change)="toggle(s.id)" [attr.aria-label]="'Promote ' + s.name"></td>
                  <td class="n">{{ s.roll }}</td><td>{{ s.name }}</td>
                  <td>@if (held().has(s.id)) { <span class="pill warn">Stays in {{ p.fromClass | cls }}</span> } @else { {{ p.toClass | cls }} }</td></tr> }
            </tbody></table></div>
            <div class="bar" style="margin-top:12px">
              @if (confirm()) {
                <button class="btn sm danger" [disabled]="busy()" (click)="promote()">{{ busy() ? 'Promoting…' : 'Yes, promote ' + selectedCount() + ' students to ' + (p.toClass | cls) }}</button>
                <button class="btn sm" (click)="confirm.set(false)">Cancel</button>
              } @else {
                <button class="btn pri" [disabled]="selectedCount() === 0 || (p.targetStrength > 0 && !allowMerge)" (click)="confirm.set(true)">Promote to {{ p.toClass | cls }}</button>
              }
            </div>
          }
        }
      </section>
    }

    @if (history().length) {
      <section class="panel"><div class="ph"><h2>Recent promotions</h2></div>
        <div class="tw"><table><thead><tr><th>When</th><th>From</th><th>To</th><th class="n">Moved</th><th class="n">Held back</th><th>By</th></tr></thead><tbody>
          @for (h of history(); track h.id) {
            <tr><td>{{ h.createdAt | date:'d MMM y, h:mm a' }}</td><td><b>{{ h.fromClass | cls }}</b></td><td><b>{{ h.toClass | cls }}</b>@if (h.createdClass) { <span class="muted"> (new)</span> }</td>
              <td class="n">{{ h.promoted }}</td><td class="n">{{ h.heldBack }}</td><td>{{ h.promotedBy }}</td></tr> }
        </tbody></table></div></section>
    }
  </div>`,
})
export class PromoteComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  classes = signal<any[]>([]); history = signal<any[]>([]); p = signal<any | null>(null);
  held = signal<Set<number>>(new Set()); confirm = signal(false); busy = signal(false); error = signal('');
  fromClass = ''; allowMerge = false;
  selectedCount = computed(() => (this.p()?.students?.length ?? 0) - this.held().size);

  ngOnInit() { this.loadClasses(); this.loadHistory(); }
  loadClasses() { this.api.get<any[]>('/school/classes').subscribe(c => this.classes.set(c)); }
  loadHistory() { this.api.get<any[]>('/promotion/history').subscribe({ next: h => this.history.set(h), error: () => this.history.set([]) }); }

  loadPreview() {
    this.error.set(''); this.confirm.set(false); this.allowMerge = false; this.held.set(new Set());
    if (!this.fromClass) { this.p.set(null); return; }
    this.api.get('/promotion/preview', { fromClass: this.fromClass }).subscribe({ next: p => this.p.set(p), error: e => { this.p.set(null); this.error.set(errText(e)); } });
  }
  toggle(id: number) { const s = new Set(this.held()); s.has(id) ? s.delete(id) : s.add(id); this.held.set(s); this.confirm.set(false); }
  setAll(on: boolean) { this.held.set(on ? new Set() : new Set(this.p()?.students.map((s: any) => s.id) ?? [])); this.confirm.set(false); }

  promote() {
    const p = this.p(); if (!p) return;
    this.busy.set(true); this.error.set('');
    this.api.post<any>('/promotion', { fromClass: p.fromClass, excludeStudentIds: [...this.held()], allowMerge: this.allowMerge }).subscribe({
      next: r => {
        this.busy.set(false);
        this.toast.show(r.promoted + ' students promoted to ' + r.toClass + (r.heldBack ? ', ' + r.heldBack + ' held back' : '') + (r.createdClass ? '. Class ' + r.toClass + ' was created' : ''));
        this.loadClasses(); this.loadHistory(); this.loadPreview();
      },
      error: e => { this.busy.set(false); this.confirm.set(false); this.error.set(errText(e)); },
    });
  }
}
