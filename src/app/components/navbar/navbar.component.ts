import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  styles: [`
    nav {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border-bottom: 1px solid var(--glass-border);
      padding: 0 40px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: var(--shadow-md);
    }
    .brand-area { display: flex; align-items: center; gap: 24px; }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.6rem;
      color: var(--primary);
      letter-spacing: -0.01em;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo i { color: var(--accent); }
    .logo span { color: var(--accent); }

    .lang-toggle {
      background: var(--accent-soft);
      border: 1px solid var(--accent);
      border-radius: var(--radius-full);
      padding: 6px 16px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: 'Outfit', sans-serif;
    }
    .lang-toggle:hover { 
      background: var(--accent); 
      color: white;
      transform: translateY(-1px);
    }
    .lang-toggle .flag { font-size: 1.1rem; }

    .links { 
      display: flex; 
      gap: 8px; 
      background: rgba(137, 207, 240, 0.08);
      padding: 6px;
      border-radius: var(--radius-sm);
    }
    .nav-link {
      padding: 10px 20px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: .9rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.25s ease;
      text-decoration: none;
      font-family: 'Inter', sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-link:hover {
      color: var(--primary);
      background: rgba(255,255,255,0.5);
    }
    .nav-link.active {
      background: var(--white);
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }
    
    .user-area { display: flex; align-items: center; gap: 16px; }
    .avatar-wrapper {
      position: relative;
      cursor: pointer;
    }
    .avatar {
      width: 42px; height: 42px; border-radius: 12px;
      background: linear-gradient(135deg, var(--accent), var(--primary-light));
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 1rem;
      box-shadow: 0 4px 10px rgba(137, 207, 240, 0.4);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .avatar-wrapper:hover .avatar { transform: scale(1.05) rotate(5deg); }
    
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 700; color: var(--primary); font-size: .95rem; line-height: 1.2; }
    .user-id { font-size: .75rem; color: var(--text-muted); font-weight: 500; }
    
    .btn-logout {
      padding: 10px 18px; 
      border-radius: var(--radius-sm); 
      border: 1px solid #fed7d7;
      background: #fff5f5; 
      color: #e53e3e; 
      font-family: 'Outfit', sans-serif;
      font-weight: 700; 
      font-size: .85rem; 
      cursor: pointer; 
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-logout:hover { 
      background: #e53e3e; 
      color: white; 
      border-color: #e53e3e;
      transform: translateY(-1px);
    }

    @media (max-width: 1024px) {
      .links { display: none; }
      nav { padding: 0 20px; }
    }
  `],
  template: `
    <nav *ngIf="auth.isLoggedIn">
      <div class="brand-area">
        <a class="logo" routerLink="/dashboard">
          <i data-lucide="layout-dashboard"></i>
          KT<span>C</span>
        </a>
        <button class="lang-toggle" (click)="langService.toggleLanguage()">
          <span class="flag">{{ langService.currentLang() === 'en' ? '🇦🇪' : '🇺🇸' }}</span>
          {{ langService.currentLang() === 'en' ? 'Arabic' : 'English' }}
        </button>
      </div>

      <div class="links">
        <a class="nav-link" routerLink="/dashboard"       routerLinkActive="active"><i data-lucide="home"></i>{{ 'NAVBAR.DASHBOARD' | translate }}</a>
        <a class="nav-link" routerLink="/attendance"      routerLinkActive="active"><i data-lucide="calendar"></i>{{ 'NAVBAR.ATTENDANCE' | translate }}</a>
        <a class="nav-link" routerLink="/profile"         routerLinkActive="active"><i data-lucide="user"></i>{{ 'NAVBAR.PROFILE' | translate }}</a>
        <a class="nav-link" routerLink="/holiday-request" routerLinkActive="active"><i data-lucide="plane"></i>{{ 'NAVBAR.HOLIDAY_REQUEST' | translate }}</a>
        <a class="nav-link" routerLink="/admin"           routerLinkActive="active" *ngIf="auth.isAdmin || auth.isManager"><i data-lucide="shield"></i>{{ 'NAVBAR.ADMIN_PANEL' | translate }}</a>
      </div>

      <div class="user-area">
        <div class="avatar-wrapper">
          <div class="avatar">{{ initial }}</div>
        </div>
        <div class="user-info">
          <span class="user-name">{{ auth.currentUser?.name }}</span>
          <span class="user-id">{{ 'NAVBAR.USER_ID' | translate }}: {{ auth.currentUser?.id }}</span>
        </div>
        <button class="btn-logout" (click)="logout()">
          <i data-lucide="log-out"></i>
          {{ 'NAVBAR.LOGOUT' | translate }}
        </button>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  constructor(
    public auth: AuthService, 
    private router: Router,
    public langService: LanguageService
  ) {}

  ngAfterViewInit() {
    this.refreshIcons();
  }

  refreshIcons() {
    setTimeout(() => {
      if ((window as any).lucide) {
        (window as any).lucide.createIcons();
      }
    }, 100);
  }

  get initial() { return this.auth.currentUser?.name?.charAt(0) ?? '?'; }
  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}
