import { Directive, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';

/**
 * Phones are too narrow for wide tables. This turns every table inside the host into a list of cards
 * by copying each column title onto its cells (data-label); the stylesheet does the rest.
 * Tables that must stay a grid (timetable) opt out with class "grid".
 */
@Directive({ selector: '[cardify]', standalone: true })
export class CardifyDirective implements OnInit, OnDestroy {
  private mo?: MutationObserver; private queued = false;
  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}
  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.mo = new MutationObserver(() => this.schedule());
      this.mo.observe(this.host.nativeElement, { childList: true, subtree: true });
      this.schedule();
    });
  }
  ngOnDestroy() { this.mo?.disconnect(); }
  private schedule() { if (this.queued) return; this.queued = true; requestAnimationFrame(() => { this.queued = false; this.apply(); }); }
  private apply() {
    this.host.nativeElement.querySelectorAll('table').forEach(t => {
      if (t.classList.contains('grid') || t.classList.contains('tt') || !t.tHead || !t.tHead.rows[0]) return;
      const heads = Array.from(t.tHead.rows[0].cells).map(c => (c.textContent ?? '').trim());
      t.classList.add('cards');
      Array.from(t.tBodies).forEach(b => Array.from(b.rows).forEach(r => {
        if (r.cells.length !== heads.length) return;
        Array.from(r.cells).forEach((c, i) => { if (c.dataset['label'] !== heads[i]) c.dataset['label'] = heads[i]; });
      }));
    });
  }
}
