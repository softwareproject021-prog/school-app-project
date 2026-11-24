import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Toast } from '../../core/toast.service';

/** Pop-up with the documents of one teacher or of a school's principal: open a document, add a link to a new one, remove one. */
@Component({
  selector: 'app-staff-docs', standalone: true, imports: [FormsModule],
  styles: [`.dr{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}.dr .t{flex:1;min-width:0}.dr .t b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dr .t span{font-size:12px;color:var(--muted)}
    .df{display:grid;gap:8px;margin-top:12px}.dh{display:flex;align-items:center;justify-content:space-between;gap:10px}.dh h2{margin:0}`],
  template: `
  <div class="ov" (click)="closed.emit()" (keydown.escape)="closed.emit()"><div class="dlg" role="dialog" aria-modal="true" [attr.aria-label]="'Documents of ' + who()" (click)="$event.stopPropagation()">
    <div class="dh"><h2>Documents · {{ who() }}</h2><button class="btn sm" type="button" (click)="closed.emit()">Close</button></div>
    @if (loaded()) {
      @for (d of rows(); track d.id) {
        <div class="dr"><div class="t"><b>{{ d.title }}</b><span>Added {{ d.date }}{{ d.addedBy ? ' by ' + d.addedBy : '' }}</span></div>
          <a class="btn sm acc" [href]="d.link" target="_blank" rel="noopener noreferrer">Open</a>
          @if (confirmId() === d.id) { <button class="btn sm danger" type="button" (click)="remove(d)">Confirm</button> } @else { <button class="btn sm" type="button" (click)="confirmId.set(d.id)">Remove</button> }</div>
      } @empty { <div class="empty">No documents yet. Add the first one below.</div> }
    } @else { <div class="muted" style="padding:12px 0">Loading…</div> }
    <form class="df" (ngSubmit)="add()">
      <label>Document name<input type="text" name="title" [(ngModel)]="title" maxlength="100" placeholder="e.g. Aadhaar, B.Ed certificate, appointment letter"></label>
      <label>Link to the file<input type="url" name="link" [(ngModel)]="link" placeholder="https://drive.google.com/…"></label>
      @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
      <div><button class="btn pri" type="submit" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Add document' }}</button></div>
      <p class="muted" style="margin:0;font-size:12.5px">Upload the file to Google Drive (or similar), set sharing so the school can open it, and paste the link here.</p>
    </form>
  </div></div>`,
})
export class StaffDocsComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  who = input.required<string>(); ownerType = input.required<'TEACHER' | 'PRINCIPAL'>(); ownerId = input<number | null>(null); schoolId = input<number | null>(null);
  closed = output<void>(); changed = output<number>();
  rows = signal<any[]>([]); loaded = signal(false); error = signal(''); busy = signal(false); confirmId = signal<number | null>(null);
  title = ''; link = '';
  private q() { const q: any = { ownerType: this.ownerType() }; if (this.ownerId() != null) q.ownerId = this.ownerId(); if (this.schoolId() != null) q.schoolId = this.schoolId(); return q; }
  ngOnInit() { this.load(); }
  load() { this.api.get<any[]>('/documents', this.q()).subscribe({ next: r => { this.rows.set(r); this.loaded.set(true); this.changed.emit(r.length); }, error: e => { this.loaded.set(true); this.error.set(errText(e)); } }); }
  add() {
    this.error.set(''); this.busy.set(true);
    this.api.post<any>('/documents', { ...this.q(), title: this.title, link: this.link }).subscribe({
      next: () => { this.busy.set(false); this.title = ''; this.link = ''; this.toast.show('Document added'); this.load(); },
      error: e => { this.busy.set(false); this.error.set(errText(e)); } });
  }
  remove(d: any) {
    const q: any = this.schoolId() != null ? { schoolId: this.schoolId() } : undefined;
    this.api.delete('/documents/' + d.id, q).subscribe({ next: () => { this.confirmId.set(null); this.toast.show('Document removed'); this.load(); }, error: e => this.error.set(errText(e)) });
  }
}
