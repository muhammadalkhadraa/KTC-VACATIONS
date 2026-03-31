import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styles: [`
    nav {
      background: white;
      padding: 0 32px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 12px rgba(137,207,240,.3);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 1.4rem;
      color: #1A5F7A;
      letter-spacing: 2px;
      text-decoration: none;
    }
    .logo span { color: #89CFF0; }

    .links { display: flex; gap: 4px; }
    .nav-link {
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 600;
      font-size: .88rem;
      color: #4a7a92;
      cursor: pointer;
      transition: .2s;
      border: none;
      background: none;
      text-decoration: none;
      font-family: 'Nunito', sans-serif;
      display: inline-block;
    }
    .nav-link:hover, .nav-link.active {
      background: #D6F0FF;
      color: #1A5F7A;
    }
    .user-area { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #89CFF0, #2E86AB);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: .95rem;
    }
    .user-name { font-weight: 700; color: #1e3a4a; font-size: .9rem; }
    .user-id { font-size: .75rem; color: #6c8aa3; }
    .btn-logout {
      padding: 7px 16px; border-radius: 10px; border: 2px solid #C5E8FB;
      background: none; color: #4a7a92; font-family: 'Nunito', sans-serif;
      font-weight: 700; font-size: .82rem; cursor: pointer; transition: .2s;
    }
    .btn-logout:hover { background: #D6F0FF; color: #E05C6A; border-color: #E05C6A; }

    @media (max-width: 768px) {
      .links { display: none; }
      nav { padding: 0 16px; }
    }
  `],
  template: `
    <nav *ngIf="auth.isLoggedIn">
      <a class="logo" routerLink="/dashboard">KT<span>C</span></a>

      <div class="links">
        <a class="nav-link" routerLink="/dashboard"       routerLinkActive="active">Dashboard</a>
        <a class="nav-link" routerLink="/attendance"      routerLinkActive="active">Attendance</a>
        <a class="nav-link" routerLink="/profile"         routerLinkActive="active">Profile</a>
        <a class="nav-link" routerLink="/holiday-request" routerLinkActive="active">Holiday Request</a>
        <a class="nav-link" routerLink="/admin"           routerLinkActive="active" *ngIf="auth.hasApprovalRights">
          {{ auth.isSystemAdmin ? 'Admin Panel' : 'Team Approvals' }}
        </a>
      </div>

      <div class="user-area">
        <div class="avatar">{{ initial }}</div>
        <div>
          <span class="user-name">{{ auth.currentUser?.name }}</span><br>
          <span class="user-id">ID: {{ auth.currentUser?.id }}</span>
        </div>
        <button class="btn-logout" (click)="logout()">Logout</button>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  constructor(public auth: AuthService, private router: Router) {}
  get initial() { return this.auth.currentUser?.name?.charAt(0) ?? '?'; }
  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}
