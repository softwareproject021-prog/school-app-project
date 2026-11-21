import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';
import { isoToday } from '../../core/dates';

@Component({
  selector: 'app-recordings', standalone: true, imports: [FormsModule, ClassPipe],
  styles: [`.rc{display:flex;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line,#e5e9f0)}.rc:last-child{border:0}
    .rp{width:42px;height:42px;border-radius:12px;background:var(--grad);color:#fff;display:grid;place-items:center;font-size:17px;flex:none}
    .rm{flex:1;min-width:0}.rm h3{margin:0;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rm p{margin:2px 0 0;font-size:12.5px}`],
  template: `
  <div class="head"><div><h1>Recorded classes</h1><p class="sub">{{ sub }}</p></div>
    @if (canAdd) { <button class="btn acc" (click)="show.set(!show())">{{ show() ? 'Close form' : '+ Add recording' }}</button> }</div>
  <div class="stack">
    @if (canAdd && show()) {
      <section class="panel"><div class="ph"><h2>Add a recorded class</h2></div>
        <form class="form" (ngSubmit)="add()">
          <label>Class *<select name="classCode" [(ngModel)]="f.classCode" required><option value="">Choose class</option>@for (c of classes(); track c.code) { <option [value]="c.code">{{ c.code | cls }}</option> }</select></label>
          <label>Subject *<input type="text" name="subject" [(ngModel)]="f.subject" required maxlength="40" placeholder="e.g. Maths"></label>
          <label>Title *<input type="text" name="title" [(ngModel)]="f.title" required maxlength="100" placeholder="e.g. Algebra - chapter 3"></label>
          <label>Video link *<input type="url" name="link" [(ngModel)]="f.link" required placeholder="https://youtu.be/... or Google Drive link"></label>
          <label>Class date<input type="date" name="date" [(ngModel)]="f.date" [max]="today"></label>
          <label>Note (optional)<input type="text" name="note" [(ngModel)]="f.note" maxlength="300" placeholder="e.g. Please watch before Monday"></label>
          <label>Message the parents<select name="notify" [(ngModel)]="f.notifyParents"><option [ngValue]="true">Yes, send now</option><option [ngValue]="false">No</option></select></label>
          <div><button class="btn pri" type="submit" [disabled]="busy() || !f.classCode || !f.title.trim() || !f.subject.trim() || !f.link.trim()">Save recording</button></div></form>
        <p class="muted" style="margin:8px 0 0;font-size:12px">Upload the video to YouTube (set it to Unlisted), Google Drive or Vimeo first, then paste its link here. Check the link opens for people who are not signed in to your account.</p>
        @if (error()) { <div class="err" style="margin-top:10px">{{ error() }}</div> }</section> }
    <section class="panel">
      <div class="ph"><h2>All recordings</h2>
        @if (canAdd) { <select [ngModel]="filter()" (ngModelChange)="filter.set($event); load()" name="filter"><option value="">All classes</option>@for (c of classes(); track c.code) { <option [value]="c.code">{{ c.code | cls }}</option> }</select> }</div>
      @for (r of rows(); track r.id) {
        <div class="rc"><div class="rp" aria-hidden="true">▶</div>
          <div class="rm"><h3>{{ r.title }}</h3><p class="muted">{{ r.subject }} · {{ r.classCode | cls }} · {{ r.date }}@if (r.postedBy) { · {{ r.postedBy }} }@if (r.note) { · {{ r.note }} }</p></div>
          <a class="btn sm acc" [href]="r.link" target="_blank" rel="noopener noreferrer">Watch</a>
          @if (r.canDelete) { @if (confirmId() === r.id) { <button class="btn sm danger" (click)="remove(r)">Confirm delete</button> <button class="btn sm" (click)="confirmId.set(null)">Cancel</button> } @else { <button class="btn sm" (click)="confirmId.set(r.id)" [attr.aria-label]="'Delete ' + r.title">Delete</button> } }
        </div>
      } @empty { <div class="empty">No recorded classes yet.</div> }
    </section>
  </div>`,
})
export class RecordingsComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast);
  canAdd = ['ORG_ADMIN', 'TEACHER'].includes(this.auth.effectiveRole() as string);
  today = isoToday();
  sub = this.canAdd ? 'Add a link to a class recording and the parents of that class are told.' : 'Watch past classes again, any time.';
  rows = signal<any[]>([]); classes = signal<any[]>([]); show = signal(false); error = signal(''); busy = signal(false); confirmId = signal<number | null>(null); filter = signal('');
  f: any = this.blank();
  blank() { return { classCode: '', subject: '', title: '', link: '', date: isoToday(), note: '', notifyParents: true }; }
  ngOnInit() { if (this.canAdd) this.api.get<any[]>('/school/classes').subscribe(c => this.classes.set(c)); this.load(); }
  load() { this.api.get<any[]>('/recordings', this.filter() ? { classCode: this.filter() } : {}).subscribe(r => this.rows.set(r)); }
  add() {
    this.error.set('');
    const link = this.f.link.trim();
    if (!/^https?:\/\/\S+$/i.test(link)) { this.error.set('Enter the full video link, starting with https://'); return; }
    this.busy.set(true);
    this.api.post<any>('/recordings', { ...this.f, title: this.f.title.trim(), subject: this.f.subject.trim(), link }).subscribe({
      next: r => { this.busy.set(false); this.toast.show(r.notified ? 'Recording added and parents messaged' : 'Recording added'); this.f = this.blank(); this.show.set(false); this.load(); },
      error: e => { this.busy.set(false); this.error.set(errText(e)); } });
  }
  remove(r: any) { this.api.delete('/recordings/' + r.id).subscribe({ next: () => { this.toast.show('Recording removed'); this.confirmId.set(null); this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
