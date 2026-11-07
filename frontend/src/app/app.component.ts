import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Busy } from './core/busy.service';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet],
  host: { '[class.is-busy]': 'busy.active()' },
  template: `@if (busy.active()) { <div class="topbar" role="progressbar" aria-label="Loading" aria-busy="true"></div> }<router-outlet />`,
})
export class AppComponent { busy = inject(Busy); }
