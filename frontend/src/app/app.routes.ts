import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';

const M = roleGuard('MAIN_ADMIN');
const O = roleGuard('ORG_ADMIN');
const OT = roleGuard('ORG_ADMIN', 'TEACHER');
const OTP = roleGuard('ORG_ADMIN', 'TEACHER', 'PARENT');
const OP = roleGuard('ORG_ADMIN', 'PARENT');
const T = roleGuard('TEACHER');
const MOT = roleGuard('MAIN_ADMIN', 'ORG_ADMIN', 'TEACHER');
const TP = roleGuard('TEACHER', 'PARENT');
const P = roleGuard('PARENT');

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent) },
  { path: 'forgot', loadComponent: () => import('./pages/forgot.component').then(m => m.ForgotComponent) },
  { path: 'join/:token', loadComponent: () => import('./pages/join.component').then(m => m.JoinComponent) },
  {
    path: '', canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      // Main Admin (platform owner)
      { path: 'schools', canActivate: [M], loadComponent: () => import('./pages/platform/schools.component').then(m => m.SchoolsComponent) },
      { path: 'explorer', canActivate: [M], loadComponent: () => import('./pages/platform/explorer.component').then(m => m.ExplorerComponent) },
      { path: 'add-school', canActivate: [M], loadComponent: () => import('./pages/platform/add-school.component').then(m => m.AddSchoolComponent) },
      { path: 'invites', canActivate: [MOT], loadComponent: () => import('./pages/shared/invites.component').then(m => m.InvitesComponent) },
      { path: 'platform-stats', canActivate: [M], loadComponent: () => import('./pages/platform/platform-stats.component').then(m => m.PlatformStatsComponent) },
      // Org Admin (principal)
      { path: 'dashboard', canActivate: [O], loadComponent: () => import('./pages/org/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'statistics', canActivate: [O], loadComponent: () => import('./pages/org/statistics.component').then(m => m.StatisticsComponent) },
      { path: 'leave', canActivate: [O], loadComponent: () => import('./pages/org/leave.component').then(m => m.LeaveComponent) },
      { path: 'classes', canActivate: [O], loadComponent: () => import('./pages/org/classes.component').then(m => m.ClassesComponent) },
      { path: 'teachers', canActivate: [O], loadComponent: () => import('./pages/org/teachers.component').then(m => m.TeachersComponent) },
      { path: 'students', canActivate: [O], loadComponent: () => import('./pages/org/students.component').then(m => m.StudentsComponent) },
      { path: 'fees', canActivate: [O], loadComponent: () => import('./pages/org/fees.component').then(m => m.FeesComponent) },
      { path: 'store', canActivate: [O], loadComponent: () => import('./pages/org/store.component').then(m => m.StoreComponent) },
      { path: 'sports', canActivate: [OTP], loadComponent: () => import('./pages/org/sports.component').then(m => m.SportsComponent) },
      { path: 'notifications', canActivate: [O], loadComponent: () => import('./pages/org/notifications.component').then(m => m.NotificationsComponent) },
      // Teacher
      { path: 'today', canActivate: [T], loadComponent: () => import('./pages/teacher/today.component').then(m => m.TodayComponent) },
      { path: 'my-students', canActivate: [T], loadComponent: () => import('./pages/teacher/my-students.component').then(m => m.MyStudentsComponent) },
      { path: 'my-leave', canActivate: [T], loadComponent: () => import('./pages/teacher/my-leave.component').then(m => m.MyLeaveComponent) },
      // Parent
      { path: 'home', canActivate: [P], loadComponent: () => import('./pages/parent/home.component').then(m => m.ParentHomeComponent) },
      { path: 'child-marks', canActivate: [P], loadComponent: () => import('./pages/parent/child-marks.component').then(m => m.ChildMarksComponent) },
      { path: 'child-fees', canActivate: [P], loadComponent: () => import('./pages/parent/child-fees.component').then(m => m.ChildFeesComponent) },
      // Shared between roles
      { path: 'attendance', canActivate: [OT], loadComponent: () => import('./pages/shared/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'marks', canActivate: [OT], loadComponent: () => import('./pages/shared/marks.component').then(m => m.MarksComponent) },
      { path: 'homework', canActivate: [OTP], loadComponent: () => import('./pages/shared/homework.component').then(m => m.HomeworkComponent) },
      { path: 'timetable', canActivate: [OTP], loadComponent: () => import('./pages/shared/timetable.component').then(m => m.TimetableComponent) },
      { path: 'events', canActivate: [OTP], loadComponent: () => import('./pages/shared/events.component').then(m => m.EventsComponent) },
      { path: 'transport', canActivate: [OP], loadComponent: () => import('./pages/shared/transport.component').then(m => m.TransportComponent) },
      { path: 'inbox', canActivate: [TP], loadComponent: () => import('./pages/shared/inbox.component').then(m => m.InboxComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
