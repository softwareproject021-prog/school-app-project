import { Component, OnInit, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { EVENT_ART } from '../../core/event-art';
import { isoToday } from '../../core/dates';

/** Downscale a chosen photo to a JPEG data URL so it stays small enough to store. */
function shrink(file: File, cb: (url: string) => void, fail: () => void) {
  const r = new FileReader();
  r.onload = () => { const img = new Image(); img.onload = () => {
    const k = Math.min(1, 720 / img.width); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', 0.72)); }; img.onerror = fail; img.src = r.result as string; };
  r.readAsDataURL(file);
}

@Component({
  selector: 'app-events', standalone: true, imports: [FormsModule, NgTemplateOutlet],
  template: `
  <div class="head"><div><h1>Events</h1><p class="sub">{{ canEdit ? 'Add events with a photo and notify parents in one step.' : 'What\\'s happening at school.' }}</p></div>
    @if (canEdit) { <button class="btn acc" (click)="showForm.set(!showForm())">{{ showForm() ? 'Close form' : '+ Add event' }}</button> }</div>
  <div class="stack">
    @if (canEdit && showForm()) {
      <section class="panel"><div class="ph"><h2>Add event</h2></div>
        <form class="form" (ngSubmit)="add()">
          <label>Title<input type="text" name="title" [(ngModel)]="f.title" required placeholder="e.g. Annual Day rehearsal"></label>
          <label>Date<input type="date" name="date" [(ngModel)]="f.date"></label>
          <label>Type<select name="type" [(ngModel)]="f.type"><option>Academic</option><option>Cultural</option><option>Holiday</option><option>Meeting</option><option>Exam</option><option>Sports</option></select></label>
          <label>Photo (optional)<input type="file" accept="image/*" (change)="pick($event)"></label>
          <label>Notify parents<select name="notifyParents" [(ngModel)]="f.notifyParents"><option [ngValue]="true">Yes</option><option [ngValue]="false">No</option></select></label>
          <div><button class="btn pri" type="submit">Add event</button></div></form></section> }
    <section><div class="ph" style="margin-bottom:10px"><h2>Upcoming</h2></div><div class="evgrid">
      @for (e of upcoming(); track e.id) { <ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ e: e }" /> } @empty { <div class="empty">No upcoming events.</div> }</div></section>
    @if (past().length) { <section><div class="ph" style="margin:8px 0 10px"><h2>Past</h2></div><div class="evgrid">
      @for (e of past(); track e.id) { <ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ e: e }" /> }</div></section> }
  </div>
  <ng-template #card let-e="e">
    <article class="evc"><div class="art">@if (e.imageData) { <img [src]="e.imageData" [alt]="e.title"> } @else { <div [innerHTML]="art(e.type)"></div> }</div>
      <div class="bd"><span class="pill acc" style="align-self:flex-start">{{ e.type }}</span><h2 style="font-size:16px">{{ e.title }}</h2>
        <div class="ft"><span class="mono muted" style="font-size:13px">{{ e.date }}</span>
          @if (canEdit) { <span class="btn sm upl">{{ e.imageData ? 'Change photo' : 'Upload photo' }}<input type="file" accept="image/*" (change)="photo(e, $event)" [attr.aria-label]="'Upload photo for ' + e.title"></span> }</div></div></article>
  </ng-template>`,
})
export class EventsComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast); private san = inject(DomSanitizer);
  canEdit = inject(Auth).effectiveRole() === 'ORG_ADMIN';
  all = signal<any[]>([]); showForm = signal(false);
  f: any = { title: '', date: isoToday(), type: 'Academic', imageData: null, notifyParents: true };
  upcoming = () => this.all().filter(e => e.date >= isoToday());
  past = () => this.all().filter(e => e.date < isoToday());
  art(type: string): SafeHtml { return this.san.bypassSecurityTrustHtml(EVENT_ART[type] ?? EVENT_ART['Academic']); }
  ngOnInit() { this.load(); }
  load() { this.api.get<any[]>('/events').subscribe(r => this.all.set(r)); }
  pick(ev: Event) { const file = (ev.target as HTMLInputElement).files?.[0]; if (file) shrink(file, u => this.f.imageData = u, () => this.toast.show('That file is not an image. Choose a JPG or PNG.')); }
  add() { this.api.post('/events', this.f).subscribe({ next: () => { this.toast.show('Event added' + (this.f.notifyParents ? ' · parents notified' : '')); this.f = { title: '', date: isoToday(), type: 'Academic', imageData: null, notifyParents: true }; this.showForm.set(false); this.load(); }, error: e => this.toast.show(errText(e)) }); }
  photo(e: any, ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0]; if (!file) return;
    shrink(file, url => this.api.put(`/events/${e.id}/photo`, { imageData: url }).subscribe({ next: () => { this.toast.show('Photo added'); this.load(); }, error: x => this.toast.show(errText(x)) }), () => this.toast.show('That file is not an image. Choose a JPG or PNG.'));
  }
}
