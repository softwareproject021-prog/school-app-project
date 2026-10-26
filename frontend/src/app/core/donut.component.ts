import { Component, input, output, computed } from '@angular/core';

export interface Slice { key: string; label: string; value: number; color: string; }

/** Ring chart. Click a slice, a legend item or the percentage in the middle to pick it. */
@Component({
  selector: 'app-donut', standalone: true,
  template: `
  <div class="dn">
    <svg viewBox="0 0 120 120" [attr.width]="size()" [attr.height]="size()" role="group" [attr.aria-label]="title()">
      <circle cx="60" cy="60" r="48" fill="none" stroke="var(--sunk)" stroke-width="14"/>
      @for (a of arcs(); track a.key) {
        <circle cx="60" cy="60" r="48" fill="none" [attr.stroke]="a.color" [attr.stroke-width]="selected() === a.key ? 18 : 14" class="seg"
          [attr.stroke-dasharray]="a.len + ' ' + (circ - a.len)" [attr.stroke-dashoffset]="-a.start" transform="rotate(-90 60 60)"
          tabindex="0" role="button" [attr.aria-label]="a.label + ': ' + a.value" (click)="pick.emit(a.key)" (keydown.enter)="pick.emit(a.key)"/>
      }
      <g class="mid" tabindex="0" role="button" [attr.aria-label]="'Show ' + title()" (click)="center()" (keydown.enter)="center()">
        <text x="60" y="63" text-anchor="middle" class="pc">{{ centerText() }}</text>
        <text x="60" y="80" text-anchor="middle" class="sb">{{ sub() }}</text>
      </g>
    </svg>
    <div class="lg">
      <b>{{ title() }}</b>
      @for (s of slices(); track s.key) {
        <button type="button" [class.on]="selected() === s.key" (click)="pick.emit(s.key)"><i [style.background]="s.color"></i>{{ s.label }} <span class="mono">{{ s.value }}</span></button>
      }
    </div>
  </div>`,
  styles: [`.dn{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.seg{cursor:pointer;transition:stroke-width .15s}.seg:hover{opacity:.85}
    .mid{cursor:pointer}.pc{font:700 22px var(--mono,monospace);fill:var(--ink)}.sb{font:600 9px sans-serif;fill:var(--muted,#667)}
    svg:focus,.seg:focus,.mid:focus{outline:none}.seg:focus-visible,.mid:focus-visible{outline:2px solid var(--brand,#1d4ed8);outline-offset:2px}
    .lg{display:flex;flex-direction:column;gap:4px;align-items:flex-start}
    .lg button{border:1px solid transparent;background:none;cursor:pointer;display:flex;align-items:center;gap:6px;padding:3px 8px;border-radius:99px;color:var(--ink);font:inherit}
    .lg button:hover,.lg button.on{background:var(--sunk);border-color:var(--line)}.lg i{width:10px;height:10px;border-radius:99px;display:inline-block}`],
})
export class DonutComponent {
  slices = input.required<Slice[]>(); title = input(''); centerText = input(''); sub = input(''); size = input(130); selected = input<string | null>(null);
  pick = output<string>();
  circ = 2 * Math.PI * 48;
  arcs = computed(() => {
    const t = this.slices().reduce((a, s) => a + s.value, 0); let at = 0;
    return t === 0 ? [] : this.slices().filter(s => s.value > 0).map(s => { const len = s.value / t * this.circ; const r = { ...s, len, start: at }; at += len; return r; });
  });
  center() { const s = this.slices(); if (s.length) this.pick.emit(s[0].key); }
}
