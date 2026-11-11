import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';

/** The parent's view of their child's published results, one exam at a time. */
@Component({
  selector: 'app-child-marks', standalone: true, imports: [FormsModule],
  template: `
  <div class="head"><div><h1>Marks and results</h1><p class="sub">{{ d()?.studentName }}@if (d()) { · class {{ d().classCode }} · academic year {{ d().year }} }</p></div></div>
  @if (error()) { <div class="err">{{ error() }}</div> }
  @if (loaded() && !(d()?.results?.length)) { <div class="empty">No results have been published yet. You will see them here as soon as the school publishes them.</div> }
  @if (cur(); as r) {
    <div class="bar" style="margin-bottom:12px"><select [ngModel]="code" (ngModelChange)="code = $event" aria-label="Examination">@for (x of d().results; track x.exam) { <option [value]="x.exam">{{ x.examName }}</option> }</select></div>
    <section class="panel">
      <div class="ph"><h2>{{ r.examName }}</h2><span class="pill" [class.good]="r.result === 'PASS'" [class.bad]="r.result === 'FAIL'">{{ r.result === 'PASS' ? 'Pass' : r.result === 'FAIL' ? 'Fail' : 'Incomplete' }}</span></div>
      <div class="kpis" style="margin-bottom:14px">
        <div class="kpi"><div class="l">Total</div><div class="v">{{ r.total }}/{{ r.maxTotal }}</div></div>
        <div class="kpi"><div class="l">Percentage</div><div class="v">{{ r.percentage }}%</div></div>
        <div class="kpi"><div class="l">Grade</div><div class="v">{{ r.grade || '–' }}</div></div></div>
      <div class="cbars" style="gap:12px">
        @for (m of r.subjects; track m.subject) {
          <div class="mbar"><b>{{ m.subject }}</b><div class="track"><div class="fill" [style.width.%]="m.marks === null ? 0 : m.marks * 100 / m.max" [style.background]="m.belowPass ? 'var(--bad)' : 'var(--brand)'"></div></div><span class="mono">{{ m.marks ?? '–' }}/{{ m.max }}</span></div>
          <div class="muted" style="font-size:12px;margin:-8px 0 0 90px">Class average {{ m.classAverage }}@if (m.belowPass) { · <b style="color:var(--bad)">below pass mark of {{ r.pass }}</b> }</div> }</div>
    </section>
  }`,
})
export class ChildMarksComponent implements OnInit {
  private api = inject(Api);
  d = signal<any>(null); error = signal(''); loaded = signal(false);
  code = '';
  cur() { const r: any[] = this.d()?.results ?? []; return r.find(x => x.exam === this.code) ?? r[r.length - 1] ?? null; }
  ngOnInit() {
    this.api.get('/results/mine').subscribe({
      next: r => { this.d.set(r); const l: any[] = r.results; this.code = l.length ? l[l.length - 1].exam : ''; this.loaded.set(true); },
      error: e => { this.loaded.set(true); this.error.set(errText(e)); },
    });
  }
}
