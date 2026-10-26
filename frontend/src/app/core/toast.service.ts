import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Toast {
  readonly msg = signal<string | null>(null);
  private h: any;
  show(m: string) { this.msg.set(m); clearTimeout(this.h); this.h = setTimeout(() => this.msg.set(null), 3200); }
}
