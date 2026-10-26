import { Component, OnInit, inject, signal } from '@angular/core';
import { Api } from '../../core/api.service';
import { Auth } from '../../core/auth.service';

@Component({
  selector: 'app-transport', standalone: true,
  template: `
  <div class="head"><div><h1>Transport</h1><p class="sub">{{ isParent ? 'Your child\\'s school bus.' : 'Bus routes, stops and drivers.' }}</p></div></div>
  <div class="grid2">@for (r of routes(); track r.id) {
    <section class="panel"><div class="ph"><div><h2>{{ r.code }} · {{ r.name }}</h2><p class="sub mono" style="font-size:13px">{{ r.bus }}</p></div><span class="pill good">On route</span></div>
      <p style="margin:0">Driver {{ r.driver }} · <span class="mono">{{ r.phone }}</span></p>
      <div class="route">@for (s of r.stops; track s.name) { <div><i></i><span>{{ s.name }}</span><span class="mono muted">{{ s.time }}</span></div> }</div></section> }</div>`,
})
export class TransportComponent implements OnInit {
  private api = inject(Api);
  isParent = inject(Auth).effectiveRole() === 'PARENT';
  routes = signal<any[]>([]);
  ngOnInit() { this.api.get<any[]>('/transport').subscribe(r => this.routes.set(r)); }
}
