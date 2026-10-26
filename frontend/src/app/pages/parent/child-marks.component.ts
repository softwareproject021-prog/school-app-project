import { Component, OnInit, inject, signal } from '@angular/core';
import { Api } from '../../core/api.service';

@Component({
  selector: 'app-child-marks', standalone: true,
  template: `
  <div class="head"><div><h1>Marks · Unit Test 1</h1><p class="sub">{{ d()?.name }} · out of 50 · pass mark 18</p></div></div>
  <section class="panel"><div class="cbars" style="gap:12px">
    @for (m of d()?.marks ?? []; track m.subject) {
      <div class="mbar"><b>{{ m.subject }}</b><div class="track"><div class="fill" [style.width.%]="m.marks * 2" [style.background]="m.belowPass ? 'var(--bad)' : 'var(--brand)'"></div></div><span class="mono">{{ m.marks }}/{{ m.max }}</span></div>
      <div class="muted" style="font-size:12px;margin:-8px 0 0 90px">Class average {{ m.classAverage }}@if (m.belowPass) { · <b style="color:var(--bad)">below pass mark</b> }</div> }</div></section>`,
})
export class ChildMarksComponent implements OnInit {
  private api = inject(Api); d = signal<any>(null);
  ngOnInit() { this.api.get('/portal/parent').subscribe(r => this.d.set(r)); }
}
