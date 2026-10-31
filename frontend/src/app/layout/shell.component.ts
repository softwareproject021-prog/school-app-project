import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Auth } from '../core/auth.service';
import { Toast } from '../core/toast.service';
import { CardifyDirective } from '../core/cardify.directive';
import { ICONS } from './icons';

interface Item { path: string; label: string; icon: string; tab?: string; group: string; }
const I = (group: string, path: string, label: string, icon: string, tab?: string): Item => ({ group, path, label, icon, tab });

const MAIN: Item[] = [
  I('Platform', '/schools', 'Schools', 'building', 'Schools'), I('Platform', '/platform-stats', 'Statistics', 'chart', 'Stats'),
  I('Platform', '/add-school', 'Add school', 'plus', 'Add'), I('Platform', '/invites', 'Principal invites', 'mail', 'Invites'), I('Platform', '/explorer', 'Data explorer', 'db')];
const ORG: Item[] = [
  I('Today', '/dashboard', 'Home', 'home', 'Home'), I('Today', '/attendance', 'Attendance', 'check', 'Attendance'), I('Today', '/statistics', 'Statistics', 'chart', 'Stats'),
  I('Today', '/leave', 'Leave & substitutes', 'leave'),
  I('School', '/fees', 'Fees', 'rupee', 'Fees'), I('School', '/classes', 'Classes', 'school'), I('School', '/teachers', 'Teachers', 'user'), I('School', '/students', 'Students', 'users'), I('School', '/promote', 'Promote session', 'swap'),
  I('School', '/timetable', 'Timetable', 'calendar'), I('School', '/marks', 'Marks', 'book'), I('School', '/homework', 'Homework', 'clipboard'), I('School', '/invites', 'Invites', 'mail'),
  I('Campus', '/store', 'Store', 'box'), I('Campus', '/events', 'Events', 'calendar'), I('Campus', '/sports', 'Sports', 'trophy'), I('Campus', '/transport', 'Transport', 'bus'), I('Campus', '/notifications', 'Notifications', 'bell')];
const TEACHER: Item[] = [
  I('My day', '/today', 'Today', 'today', 'Today'), I('My day', '/attendance', 'Attendance', 'check', 'Attendance'), I('My day', '/marks', 'Marks', 'book', 'Marks'), I('My day', '/my-students', 'My students', 'users', 'Students'),
  I('My day', '/homework', 'Homework', 'clipboard'), I('My day', '/timetable', 'My timetable', 'calendar'),
  I('Me', '/my-leave', 'Leave requests', 'leave'), I('Me', '/inbox', 'Messages', 'mail'), I('Me', '/events', 'Events', 'calendar')];
const PARENT: Item[] = [
  I('My child', '/home', 'Home', 'home', 'Home'), I('My child', '/child-marks', 'Marks', 'book', 'Marks'), I('My child', '/child-fees', 'Fees', 'rupee', 'Fees'), I('My child', '/timetable', 'Timetable', 'calendar', 'Timetable'),
  I('My child', '/homework', 'Homework', 'clipboard'),
  I('School', '/events', 'Events', 'calendar'), I('School', '/transport', 'School bus', 'bus'), I('School', '/inbox', 'Messages', 'mail')];

@Component({
  selector: 'app-shell', standalone: true, imports: [RouterOutlet, RouterLink, CardifyDirective],
  template: `
  <header class="appbar">
    <div class="ttl"><h1>{{ title() }}</h1><span>{{ subtitle() }}</span></div>
    <button class="avatar-btn" (click)="sheet.set('me')" aria-label="Account">{{ initials() }}</button>
  </header>
  @if (offline()) { <div class="offline" role="status">You are offline. Showing what is already loaded.</div> }
  @if (auth.viewing(); as v) { <div class="viewing"><span>Viewing {{ v.name }}</span><button (click)="auth.backToPlatform()">Back to Main Admin</button></div> }
  <div class="content" cardify><router-outlet /></div>

  <nav class="tabbar" aria-label="Main">
    @for (t of tabs(); track t.path) {
      <a [routerLink]="t.path" class="tab" [class.on]="active(t.path)"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="ic(t.icon)"/></svg><span>{{ t.tab }}</span></a>
    }
    <button class="tab" [class.on]="moreActive()" (click)="sheet.set('more')"><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="ic('grid')"/></svg><span>More</span></button>
  </nav>

  @if (sheet(); as s) {
    <div class="scrim" (click)="sheet.set(null)"></div>
    <section class="sheet" role="dialog" [attr.aria-label]="s === 'more' ? 'Menu' : 'Account'">
      <div class="grab"></div>
      @if (s === 'more') {
        @for (g of groups(); track g.name) {
          <h2>{{ g.name }}</h2>
          <div class="tiles">@for (t of g.items; track t.path) {
            <a class="tile" [routerLink]="t.path" [class.on]="active(t.path)" (click)="sheet.set(null)"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="ic(t.icon)"/></svg></i><span>{{ t.label }}</span></a> }</div>
        }
      } @else {
        <div class="me"><div class="big">{{ initials() }}</div><div><b>{{ auth.user()?.name }}</b><span>{{ roleLabel() }}@if (auth.user()?.schoolName) { · {{ auth.user()?.schoolName }} }</span></div></div>
        @if (auth.viewing()) { <button class="row" (click)="sheet.set(null); auth.backToPlatform()"><svg viewBox="0 0 24 24"><path [attr.d]="ic('swap')"/></svg>Back to Main Admin</button> }
        <button class="row out" (click)="sheet.set(null); auth.logout()"><svg viewBox="0 0 24 24"><path [attr.d]="ic('logout')"/></svg>Log out</button>
      }
    </section>
  }
  @if (toast.msg(); as m) { <div class="toast" role="status">{{ m }}</div> }`,
})
export class ShellComponent {
  auth = inject(Auth);
  toast = inject(Toast);
  private router = inject(Router);
  sheet = signal<'more' | 'me' | null>(null);
  offline = signal(typeof navigator !== 'undefined' && navigator.onLine === false);
  private url = toSignal(this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url)), { initialValue: this.router.url });

  @HostListener('window:offline') off() { this.offline.set(true); }
  @HostListener('window:online') on() { this.offline.set(false); }

  ic = (n: string) => ICONS[n] ?? ICONS['grid'];
  roleLabel = computed(() => ({ MAIN_ADMIN: 'Main Admin', ORG_ADMIN: 'Principal', TEACHER: 'Teacher', PARENT: 'Parent' }[this.auth.role() ?? 'PARENT']));
  initials = computed(() => (this.auth.user()?.name ?? '?').split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?');
  items = computed<Item[]>(() => {
    switch (this.auth.effectiveRole()) { case 'MAIN_ADMIN': return MAIN; case 'ORG_ADMIN': return ORG; case 'TEACHER': return TEACHER; case 'PARENT': return PARENT; default: return []; }
  });
  tabs = computed(() => this.items().filter(i => i.tab));
  groups = computed(() => {
    const out: { name: string; items: Item[] }[] = [];
    for (const i of this.items()) { let g = out.find(x => x.name === i.group); if (!g) out.push(g = { name: i.group, items: [] }); g.items.push(i); }
    return out;
  });
  private path = computed(() => this.url().split('?')[0].split('#')[0]);
  active = (p: string) => this.path() === p || this.path().startsWith(p + '/');
  moreActive = computed(() => !!this.path() && !this.tabs().some(t => this.active(t.path)));
  current = computed(() => this.items().find(i => this.active(i.path)));
  title = computed(() => this.current()?.label ?? 'Campus1Cloud');
  subtitle = computed(() => this.auth.viewing()?.name ?? this.auth.user()?.schoolName ?? this.roleLabel());
}
