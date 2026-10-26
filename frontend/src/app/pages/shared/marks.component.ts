import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe, CORE } from '../../core/format';

@Component({
  selector: 'app-marks', standalone: true, imports: [FormsModule, ClassPipe],
  template: `
  <div class="head"><div><h1>Marks · Unit Test 1</h1><p class="sub">Out of 50, pass mark 18. Students below the pass mark are highlighted.</p></div></div>
  <section class="panel">
    <div class="ph"><div class="bar" style="margin:0">
      <select [(ngModel)]="classCode" (change)="load()" aria-label="Class">@for (c of classes(); track c) { <option [value]="c">Class {{ c | cls }}</option> }</select>
      <select [(ngModel)]="subject" (change)="load()" aria-label="Subject">@for (s of subjects(); track s) { <option>{{ s }}</option> }</select></div>
      @if (d(); as d) { <div class="bar" style="margin:0"><span class="mono">Avg {{ d.average }} · <b style="color:var(--bad)">{{ d.belowPass }}</b> below pass</span>
        <button class="btn acc" (click)="alert()">Alert parents of {{ d.belowPass }} student{{ d.belowPass === 1 ? '' : 's' }}</button></div> }</div>
    @if (error()) { <div class="err">{{ error() }}</div> }
    @if (d(); as d) {
      <div class="tw"><table><thead><tr><th class="n">Roll</th><th>Name</th><th class="n">{{ subject }} / 50</th><th>Result</th></tr></thead><tbody>
        @for (r of d.rows; track r.studentId) {
          <tr><td class="n">{{ r.roll }}</td><td>{{ r.name }}</td>
            <td class="n"><input type="number" min="0" max="50" [ngModel]="r.marks" (change)="save(r, $any($event.target).value)" style="width:70px;text-align:right" [attr.aria-label]="'Marks for ' + r.name"></td>
            <td><span class="pill" [class.bad]="r.marks < 18" [class.good]="r.marks >= 45">{{ r.marks < 18 ? 'Below pass' : r.marks >= 45 ? 'Distinction' : 'Pass' }}</span></td></tr> }</tbody></table></div> }
  </section>`,
})
export class MarksComponent implements OnInit {
  private api = inject(Api); private auth = inject(Auth); private toast = inject(Toast);
  classes = signal<string[]>([]); subjects = signal<string[]>(CORE); classCode = ''; subject = 'Maths';
  d = signal<any>(null); error = signal('');
  ngOnInit() {
    const done = (list: string[]) => { this.classes.set(list); this.classCode = list[0] ?? ''; this.load(); };
    if (this.auth.effectiveRole() === 'TEACHER') this.api.get('/portal/teacher').subscribe({ next: p => { if (CORE.includes(p.subject)) { this.subjects.set([p.subject]); this.subject = p.subject; } done(p.myClasses); }, error: e => this.error.set(errText(e)) });
    else this.api.get<any[]>('/school/classes').subscribe(c => done(c.map(x => x.code)));
  }
  load() { if (this.classCode) this.api.get('/marks', { classCode: this.classCode, subject: this.subject }).subscribe({ next: r => { this.d.set(r); this.error.set(''); }, error: e => this.error.set(errText(e)) }); }
  save(r: any, v: string) {
    const n = Math.max(0, Math.min(50, Math.round(+v || 0)));
    this.api.put('/marks', { studentId: r.studentId, marks: n }, { subject: this.subject }).subscribe({ next: () => this.load(), error: e => this.toast.show(errText(e)) });
  }
  alert() { this.api.post('/marks/alert', {}, { classCode: this.classCode, subject: this.subject }).subscribe({ next: (r: any) => this.toast.show(`${r.alerted} parent(s) alerted about low ${this.subject} marks`), error: e => this.toast.show(errText(e)) }); }
}
