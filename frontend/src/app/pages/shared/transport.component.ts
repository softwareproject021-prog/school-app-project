import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, errText } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { Toast } from '../../core/toast.service';
import { ClassPipe } from '../../core/format';

/** Parents see their child's bus. The principal adds buses with their stops, edits them, and chooses which students ride each one. */
@Component({
  selector: 'app-transport', standalone: true, imports: [FormsModule, ClassPipe],
  template: `
  <div class="head"><div><h1>Transport</h1><p class="sub">{{ isParent ? 'Your child\\'s school bus.' : 'Buses, their stops, and who rides each one.' }}</p></div>
    @if (!isParent) { <button class="btn pri" (click)="openForm(null)">Add a bus</button> }</div>
  <div class="stack">
    @if (error()) { <div class="err">{{ error() }}</div> }

    @if (open()) {
      <section class="panel"><div class="ph"><h2>{{ f.id ? 'Edit bus ' + f.code : 'Add a bus' }}</h2></div>
        <form class="form" (ngSubmit)="save()">
          <label>Route code<input name="code" [(ngModel)]="f.code" maxlength="10" placeholder="R4" required></label>
          <label>Route name<input name="name" [(ngModel)]="f.name" maxlength="60" placeholder="Kukatpally - School" required></label>
          <label>Bus number<input name="bus" [(ngModel)]="f.bus" maxlength="30" placeholder="TS 09 UB 4521" required></label>
          <label>Driver<input name="driver" [(ngModel)]="f.driver" maxlength="40" required></label>
          <label>Driver phone<input name="phone" [(ngModel)]="f.phone" maxlength="20" inputmode="tel"></label>
          <div><b>Stops</b> <span class="muted">({{ f.stops.length }} {{ f.stops.length === 1 ? 'stop' : 'stops' }}, in the order the bus visits them)</span>
            @for (s of f.stops; track $index) {
              <div class="bar" style="margin-top:6px"><span class="muted" style="width:22px">{{ $index + 1 }}</span>
                <input [name]="'sn' + $index" [(ngModel)]="s.name" maxlength="40" placeholder="Stop name" [attr.aria-label]="'Stop ' + ($index + 1) + ' name'" style="flex:1">
                <input [name]="'st' + $index" [(ngModel)]="s.time" maxlength="8" placeholder="7:10" [attr.aria-label]="'Stop ' + ($index + 1) + ' time'" style="width:84px">
                <button class="btn sm" type="button" (click)="removeStop($index)" [disabled]="f.stops.length === 1" [attr.aria-label]="'Remove stop ' + ($index + 1)">Remove</button></div> }
            <button class="btn sm" type="button" style="margin-top:8px" (click)="addStop()" [disabled]="f.stops.length >= 30">Add a stop</button></div>
          <div class="bar"><button class="btn pri" type="submit" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save bus' }}</button><button class="btn" type="button" (click)="open.set(false)">Cancel</button></div>
        </form></section>
    }

    @if (!routes().length && loaded()) {
      <div class="empty">{{ isParent ? 'No bus is assigned to your child yet. Please ask the school office.' : 'No buses yet. Use “Add a bus”.' }}</div>
    }

    <div class="grid2">@for (r of routes(); track r.id) {
      <section class="panel"><div class="ph"><div><h2>{{ r.code }} · {{ r.name }}</h2><p class="sub mono" style="font-size:13px">{{ r.bus }}</p></div>
        <span class="pill good">{{ r.stopCount }} {{ r.stopCount === 1 ? 'stop' : 'stops' }}</span></div>
        @if (r.fee) { <p class="muted" style="margin:0 0 6px">Bus fee {{ r.fee }} rupees a year</p> }
        <p style="margin:0">Driver {{ r.driver }}@if (r.phone) { · <span class="mono">{{ r.phone }}</span> }@if (!isParent) { · {{ r.riders }} {{ r.riders === 1 ? 'student' : 'students' }} ride }</p>
        <div class="route">@for (s of r.stops; track $index) { <div><i></i><span>{{ s.name }}</span><span class="mono muted">{{ s.time }}</span></div> }</div>
        @if (!isParent) {
          <div class="bar" style="margin-top:10px">
            <button class="btn sm" (click)="openForm(r)">Edit</button>
            <button class="btn sm" (click)="openRiders(r)">Choose students</button>
            @if (confirmDel() === r.id) {
              <button class="btn sm danger" (click)="remove(r)">Yes, remove {{ r.code }}</button><button class="btn sm" (click)="confirmDel.set(null)">Cancel</button>
            } @else { <button class="btn sm danger" (click)="confirmDel.set(r.id)">Remove</button> }
          </div>
        }</section> }</div>

    @if (ridersFor(); as rf) {
      <section class="panel"><div class="ph"><h2>Students on {{ rf.code }} · {{ rf.name }}</h2><span class="pill">{{ picked().size }} selected</span></div>
        <div class="bar" style="margin-bottom:8px">
          <select aria-label="Show class" (change)="rClass.set($any($event.target).value)"><option value="">All classes</option>@for (c of classCodes(); track c) { <option [value]="c">{{ c | cls }}</option> }</select>
          <button class="btn sm" type="button" (click)="pickAll(true)">Select shown</button><button class="btn sm" type="button" (click)="pickAll(false)">Clear shown</button></div>
        <div class="tw" style="max-height:340px;overflow:auto"><table><thead><tr><th style="width:40px"></th><th>Class</th><th>Student</th><th>Now</th></tr></thead><tbody>
          @for (s of shown(); track s.id) {
            <tr><td><input type="checkbox" [checked]="picked().has(s.id)" (change)="toggle(s.id)" [attr.aria-label]="'Put ' + s.name + ' on this bus'"></td>
              <td>{{ s.classCode | cls }}</td><td>{{ s.name }}</td><td class="muted">{{ s.otherBus && !picked().has(s.id) ? 'On bus ' + s.otherBus : s.otherBus ? 'Moves from bus ' + s.otherBus : '' }}</td></tr> }
        </tbody></table></div>
        <div class="bar" style="margin-top:10px"><button class="btn pri" [disabled]="busy()" (click)="saveRiders()">{{ busy() ? 'Saving…' : 'Save students' }}</button><button class="btn" (click)="ridersFor.set(null)">Close</button></div>
      </section>
    }
  </div>`,
})
export class TransportComponent implements OnInit {
  private api = inject(Api); private toast = inject(Toast);
  isParent = inject(Auth).effectiveRole() === 'PARENT';
  routes = signal<any[]>([]); loaded = signal(false); error = signal(''); busy = signal(false);
  open = signal(false); confirmDel = signal<number | null>(null);
  f: any = this.blank();
  ridersFor = signal<any | null>(null); riders = signal<any[]>([]); picked = signal<Set<number>>(new Set()); rClass = signal('');
  classCodes = computed(() => [...new Set(this.riders().map(s => s.classCode))]);
  shown = computed(() => this.riders().filter(s => !this.rClass() || s.classCode === this.rClass()));

  ngOnInit() { this.load(); }
  load() { this.api.get<any[]>('/transport').subscribe({ next: r => { this.routes.set(r); this.loaded.set(true); }, error: () => this.loaded.set(true) }); }
  blank() { return { id: null, code: '', name: '', bus: '', driver: '', phone: '', stops: [{ name: '', time: '' }] }; }

  openForm(r: any | null) {
    this.error.set(''); this.ridersFor.set(null);
    this.f = r ? { id: r.id, code: r.code, name: r.name, bus: r.bus, driver: r.driver, phone: r.phone, stops: r.stops.map((s: any) => ({ name: s.name, time: s.time })) } : this.blank();
    this.open.set(true);
  }
  addStop() { this.f.stops = [...this.f.stops, { name: '', time: '' }]; }
  removeStop(i: number) { this.f.stops = this.f.stops.filter((_: any, k: number) => k !== i); }
  save() {
    this.error.set(''); this.busy.set(true);
    const body = { code: this.f.code, name: this.f.name, bus: this.f.bus, driver: this.f.driver, phone: this.f.phone, stops: this.f.stops };
    const req = this.f.id ? this.api.put('/transport/' + this.f.id, body) : this.api.post('/transport', body);
    req.subscribe({ next: () => { this.busy.set(false); this.open.set(false); this.toast.show('Bus saved'); this.load(); }, error: e => { this.busy.set(false); this.error.set(errText(e)); } });
  }
  remove(r: any) {
    this.confirmDel.set(null);
    this.api.delete<any>('/transport/' + r.id).subscribe({ next: x => { this.toast.show('Bus ' + r.code + ' removed' + (x.studentsCleared ? ', ' + x.studentsCleared + ' students are no longer on a bus' : '')); this.load(); }, error: e => this.error.set(errText(e)) });
  }

  openRiders(r: any) {
    this.error.set(''); this.open.set(false); this.rClass.set('');
    this.api.get<any[]>('/transport/' + r.id + '/riders').subscribe({
      next: list => { this.riders.set(list); this.picked.set(new Set(list.filter(s => s.onThisBus).map(s => s.id))); this.ridersFor.set(r); },
      error: e => this.error.set(errText(e)),
    });
  }
  toggle(id: number) { const s = new Set(this.picked()); s.has(id) ? s.delete(id) : s.add(id); this.picked.set(s); }
  pickAll(on: boolean) { const s = new Set(this.picked()); for (const x of this.shown()) on ? s.add(x.id) : s.delete(x.id); this.picked.set(s); }
  saveRiders() {
    const r = this.ridersFor(); if (!r) return;
    this.busy.set(true);
    this.api.put<any>('/transport/' + r.id + '/riders', { studentIds: [...this.picked()] }).subscribe({
      next: x => { this.busy.set(false); this.ridersFor.set(null); this.toast.show(x.riders + ' students on bus ' + r.code); this.load(); },
      error: e => { this.busy.set(false); this.error.set(errText(e)); },
    });
  }
}
