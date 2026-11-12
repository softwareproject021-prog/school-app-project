import { Component, computed, input, output } from '@angular/core';

export interface PieSlice { key: string; label: string; value: number; color: string; }

/** A large ring chart. Click a slice or a legend chip to pick it. With no slices it draws a full green ring and the "all clear" text. */
@Component({
  selector: 'app-absence-pie', standalone: true,
  template: `
  <figure class="pie">
    <svg viewBox="0 0 200 200" [attr.aria-label]="title()" role="group">
      <circle cx="100" cy="100" r="74" fill="none" stroke="var(--sunk)" stroke-width="34"/>
      @if (arcs().length === 0) { <circle cx="100" cy="100" r="74" fill="none" stroke="var(--good)" stroke-width="34" opacity=".85"/> }
      @for (a of arcs(); track a.key) {
        <circle class="seg" cx="100" cy="100" r="74" fill="none" [attr.stroke]="a.color" stroke-width="34" [attr.stroke-dasharray]="a.len + ' ' + (circ - a.len)" [attr.stroke-dashoffset]="-a.start"
          transform="rotate(-90 100 100)" tabindex="0" role="button" [attr.aria-label]="a.label + ': ' + a.value" (click)="pick.emit(a.key)" (keydown.enter)="pick.emit(a.key)" (keydown.space)="pick.emit(a.key)"/>
      }
      <text x="100" y="104" text-anchor="middle" class="big">{{ arcs().length ? centerText() : '✓' }}</text>
      <text x="100" y="128" text-anchor="middle" class="sm">{{ arcs().length ? sub() : emptyText() }}</text>
    </svg>
    <figcaption><b>{{ title() }}</b>
      <span class="lg">@for (s of slices(); track s.key) { <button type="button" (click)="pick.emit(s.key)" [style.--c]="s.color"><i></i>{{ s.label }} <span class="n">{{ s.value }}</span></button> }</span>
    </figcaption>
  </figure>`,
  styles: [`.pie{margin:0;display:flex;flex-direction:column;align-items:center;gap:12px}
    svg{width:min(100%,300px);height:auto;overflow:visible;filter:drop-shadow(0 8px 14px rgb(20 40 90/.12))}
    .seg{cursor:pointer;transition:stroke-width .15s,opacity .15s}.seg:hover,.seg:focus-visible{stroke-width:42;outline:none}
    .big{font:700 40px var(--mono,monospace);fill:var(--ink)}.sm{font:600 9.5px var(--body,sans-serif);fill:var(--muted);text-transform:uppercase;letter-spacing:.05em}
    figcaption{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
    .lg{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
    .lg button{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:4px 11px;border-radius:99px;cursor:pointer;font-size:13px}
    .lg button:hover{border-color:var(--c);background:color-mix(in srgb,var(--c) 12%,var(--surface))}
    .lg i{width:10px;height:10px;border-radius:99px;background:var(--c)}.lg .n{font-family:var(--mono,monospace);font-weight:700}`],
})
export class AbsencePieComponent {
  slices = input.required<PieSlice[]>(); title = input(''); centerText = input(''); sub = input(''); emptyText = input('All present');
  pick = output<string>();
  readonly circ = 2 * Math.PI * 74;
  arcs = computed(() => {
    const list = this.slices().filter(s => s.value > 0); const total = list.reduce((a, s) => a + s.value, 0);
    if (!total) return [];
    const gap = list.length > 1 ? 3 : 0; let acc = 0;
    return list.map(s => { const full = s.value / total * this.circ; const a = { ...s, start: acc + gap / 2, len: Math.max(1, full - gap) }; acc += full; return a; });
  });
}
