import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/login/register.component').then(m => m.RegisterComponent) },
  { path: 'dashboard',      canActivate: [authGuard], loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'attendance',     canActivate: [authGuard], loadComponent: () => import('./components/attendance/attendance.component').then(m => m.AttendanceComponent) },
  { path: 'profile',        canActivate: [authGuard], loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'holiday-request',canActivate: [authGuard], loadComponent: () => import('./components/holiday-request/holiday-request.component').then(m => m.HolidayRequestComponent) },
  { path: 'admin',          canActivate: [authGuard, adminGuard], loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent) },
  { path: '**', redirectTo: 'login' }
];
