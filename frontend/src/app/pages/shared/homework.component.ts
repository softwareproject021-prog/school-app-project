import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe, SUBJECTS } from '../../core/format';
import { isoToday } from '../../core/dates';

@Component({
  selector: 'app-homework', standalone: true, imports: [FormsModule, ClassPipe],
  template: `
  <div class="head"><div><h1>Homework</h1><p class="sub">{{ isParent ? 'Homework for your child\\'s class.' : 'Post homework; parents see it in their app straight away.' }}</p></div></div>
  <div class="stack">
    @if (!isParent) {
      <section class="panel"><div class="ph"><h2>Post homework</h2></div>
        <form class="form" (ngSubmit)="post()">
          <label>Class<select name="classCode" [(ngModel)]="f.classCode">@for (c of classes(); track c) { <option [value]="c">{{ c | cls }}</option> }</select></label>
          <label>Subject<select name="subject" [(ngModel)]="f.subject">@for (s of subjects(); track s) { <option>{{ s }}</option> }</select></label>
          <label>Due<input type="date" name="due" [(ngModel)]="f.due"></label>
          <label style="grid-column:1/-1">Task<textarea name="text" [(ngModel)]="f.text" required placeholder="e.g. Read chapter 5 and answer questions 1–6"></textarea></label>
          <div><button class="btn pri" type="submit">Post & notify parents</button></div></form></section> }
    <section class="panel">
      @if (!isParent) { <div class="bar"><select [(ngModel)]="filter" (change)="load()" aria-label="Class"><option value="">All classes</option>@for (c of classes(); track c) { <option [value]="c">Class {{ c | cls }}</option> }</select></div> }
      @if (rows().length) { <div class="feed">@for (h of rows(); track h.id) {
        <div class="it"><div class="msg" style="font-size:14px"><span class="pill acc">{{ h.subject }}</span> <b>Class {{ h.classCode | cls }}</b><div>{{ h.text }}</div><div class="muted" style="font-size:12px">{{ h.postedBy }}</div></div>
          <span class="mono muted" style="font-size:12px;white-space:nowrap">Due {{ h.due }}</span></div> }</div> }
      @else { <div class="empty">No homework posted yet.</div> }
    </section>
  </div>`,
})
export class HomeworkComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast);
  isParent = this.auth.effectiveRole() === 'PARENT';
  rows = signal<any[]>([]); classes = signal<string[]>([]); subjects = signal<string[]>(SUBJECTS); filter = '';
  f: any = { classCode: '', subject: 'Maths', due: isoToday(), text: '' };
  ngOnInit() {
    if (!this.isParent) {
      const done = (list: string[]) => { this.classes.set(list); this.f.classCode = list[0] ?? ''; };
      if (this.auth.effectiveRole() === 'TEACHER') this.api.get('/portal/teacher').subscribe(p => { this.subjects.set([p.subject]); this.f.subject = p.subject; done(p.myClasses); });
      else this.api.get<any[]>('/school/classes').subscribe(c => done(c.map(x => x.code)));
    }
    this.load();
  }
  load() { this.api.get<any[]>('/homework', { classCode: this.filter }).subscribe(r => this.rows.set(r)); }
  post() { this.api.post('/homework', this.f).subscribe({ next: () => { this.toast.show('Homework posted · parents of ' + this.f.classCode + ' notified'); this.f.text = ''; this.load(); }, error: e => this.toast.show(errText(e)) }); }
}
