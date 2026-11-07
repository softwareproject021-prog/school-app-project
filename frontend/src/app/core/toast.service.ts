import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Toast {
  readonly msg = signal<string | null>(null);
  private h: any;
  /** Shows a short message. Errors pass a longer time so they can be read. */
  show(m: string, ms = 3200) { this.msg.set(m); clearTimeout(this.h); this.h = setTimeout(() => this.msg.set(null), ms); }
}
