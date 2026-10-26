import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth.service';
import { Toast } from '../core/toast.service';

interface NavItem { path?: string; label: string; section?: boolean; }
const DOTS = ['#1e5fc6', '#0a8fd6', '#6a4fc9', '#e2603f', '#d98f22', '#2b8a55'];

@Component({
  selector: 'app-shell', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <header class="top">
    <div class="logo"><i>C</i>Campus1Cloud</div>
    <div class="role who">
      @if (auth.viewing(); as v) {
        <span class="badge">Viewing as {{ v.name }}</span>
        <button class="btn sm" (click)="auth.backToPlatform()">Back to Main Admin</button>
      } @else {
        <span class="badge">{{ roleLabel() }}</span>
        <span>{{ auth.user()?.name }}@if (auth.user()?.schoolName) { · <span class="muted">{{ auth.user()?.schoolName }}</span> }</span>
      }
      <button class="btn sm" (click)="auth.logout()">Log out</button>
    </div>
  </header>
  <div class="shell">
    <nav class="rail" aria-label="Main">
      @for (n of nav(); track $index) {
        @if (n.section) { <div class="sec">{{ n.label }}</div> }
        @else { <a [routerLink]="n.path" routerLinkActive="on" class="navlink" [style.--dot]="dot($index)">{{ n.label }}</a> }
      }
    </nav>
    <main><router-outlet /></main>
  </div>
  @if (toast.msg(); as m) { <div class="toast" role="status">{{ m }}</div> }`,
  styles: [`.navlink{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;text-decoration:none;color:var(--ink)}
    .navlink::before{content:"";width:8px;height:8px;border-radius:99px;background:var(--dot,var(--line));flex:none}
    .navlink:hover{background:var(--sunk)}
    .navlink.on{background:var(--grad);color:#fff;box-shadow:0 4px 12px rgb(29 49 96/.25)}.navlink.on::before{background:#fff}
    @media (max-width:860px){.navlink{white-space:nowrap;flex:none}}`],
})
export class ShellComponent {
  auth = inject(Auth);
  toast = inject(Toast);
  roleLabel = computed(() => ({ MAIN_ADMIN: 'Main Admin', ORG_ADMIN: 'Principal', TEACHER: 'Teacher', PARENT: 'Parent' }[this.auth.role() ?? 'PARENT']));
  dot = (i: number) => DOTS[i % DOTS.length];

  nav = computed<NavItem[]>(() => {
    switch (this.auth.effectiveRole()) {
      case 'MAIN_ADMIN': return [
        { section: true, label: 'Platform' }, { path: '/schools', label: 'Schools' }, { path: '/platform-stats', label: 'Statistics' }, { path: '/explorer', label: 'Data explorer' }, { path: '/add-school', label: 'Add school' }, { path: '/invites', label: 'Principal invites' }];
      case 'ORG_ADMIN': return [
        { section: true, label: 'Today' }, { path: '/dashboard', label: 'Dashboard' }, { path: '/statistics', label: 'Statistics' }, { path: '/attendance', label: 'Attendance' }, { path: '/leave', label: 'Leave & substitutes' },
        { section: true, label: 'School' }, { path: '/classes', label: 'Classes' }, { path: '/teachers', label: 'Teachers' }, { path: '/students', label: 'Students' }, { path: '/invites', label: 'Invites' },
        { path: '/timetable', label: 'Timetable' }, { path: '/marks', label: 'Marks' }, { path: '/homework', label: 'Homework' }, { path: '/fees', label: 'Fees' },
        { section: true, label: 'Campus' }, { path: '/store', label: 'Stationery store' }, { path: '/events', label: 'Events' }, { path: '/sports', label: 'Sports' },
        { path: '/transport', label: 'Transport' }, { path: '/notifications', label: 'Notifications' }];
      case 'TEACHER': return [
        { section: true, label: 'My day' }, { path: '/today', label: 'Today' }, { path: '/attendance', label: 'Attendance' }, { path: '/marks', label: 'Marks' },
        { path: '/homework', label: 'Homework' }, { path: '/timetable', label: 'My timetable' },
        { path: '/my-students', label: 'My students' }, { section: true, label: 'Me' }, { path: '/my-leave', label: 'Leave requests' }, { path: '/inbox', label: 'Messages' }, { path: '/events', label: 'Events' }];
      case 'PARENT': return [
        { section: true, label: 'My child' }, { path: '/home', label: 'Home' }, { path: '/child-marks', label: 'Marks' }, { path: '/child-fees', label: 'Fees' },
        { path: '/homework', label: 'Homework' }, { path: '/timetable', label: 'Timetable' },
        { section: true, label: 'School' }, { path: '/events', label: 'Events' }, { path: '/transport', label: 'School bus' }, { path: '/inbox', label: 'Messages' }];
      default: return [];
    }
  });
}
