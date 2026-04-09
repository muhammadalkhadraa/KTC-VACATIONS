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
      background: var(--bg-secondary);
      border-right: 1px solid var(--glass-border);
      padding: 32px 16px;
      width: var(--sidebar-width);
      height: 100vh;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      transition: all 0.3s ease;
    }
    
    /* Brand Area */
    .brand-area {
      padding: 0 12px 32px;
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.8rem;
      color: var(--text-main);
      letter-spacing: -0.02em;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .logo i { color: var(--primary); }
    .logo span { color: var(--primary); }

    .lang-toggle {
      width: 100%;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      padding: 10px 16px;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.25s ease;
      font-family: 'Outfit', sans-serif;
    }
    .lang-toggle:hover { 
      background: rgba(255, 255, 255, 0.08); 
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Links Area */
    .links { 
      display: flex; 
      flex-direction: column;
      gap: 8px; 
      margin: 24px 0;
      flex: 1;
    }
    
    .nav-link {
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: .95rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
    }
    
    .nav-link i {
      width: 20px;
      height: 20px;
      transition: all 0.3s ease;
    }
    
    .nav-link:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.03);
    }
    
    .nav-link.active {
      background: var(--accent-soft);
      color: var(--primary);
    }
    
    .nav-link.active::before {
      content: '';
      position: absolute;
      left: -16px;
      top: 15%;
      height: 70%;
      width: 4px;
      background: var(--primary);
      border-radius: 0 4px 4px 0;
      box-shadow: 0 0 15px var(--primary);
    }
    
    /* User Area */
    .user-area { 
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid var(--glass-border);
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: var(--radius-sm);
      margin-bottom: 16px;
    }
    
    .avatar {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 1rem;
      flex-shrink: 0;
    }
    
    .user-info { display: flex; flex-direction: column; overflow: hidden; }
    .user-name { 
      font-weight: 700; 
      color: var(--text-main); 
      font-size: .9rem; 
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .user-id { font-size: .7rem; color: var(--text-muted); font-weight: 500; }
    
    .btn-logout {
      width: 100%;
      padding: 12px; 
      border-radius: var(--radius-sm); 
      border: 1px solid rgba(255, 75, 92, 0.2);
      background: rgba(255, 75, 92, 0.05); 
      color: var(--danger); 
      font-family: 'Outfit', sans-serif;
      font-weight: 700; 
      font-size: .85rem; 
      cursor: pointer; 
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .btn-logout:hover { 
      background: var(--danger); 
      color: white; 
      border-color: var(--danger);
    }

    /* RTL Handling */
    [dir="rtl"] nav { 
      left: auto; 
      right: 0; 
      border-right: none; 
      border-left: 1px solid var(--glass-border); 
    }
    [dir="rtl"] .nav-link.active::before { left: auto; right: -16px; border-radius: 4px 0 0 4px; }
    
    @media (max-width: 1024px) {
      nav { width: 80px; padding: 32px 12px; }
      .brand-area, .nav-link span, .user-info, .btn-logout span { display: none; }
      .logo { margin-bottom: 40px; justify-content: center; }
      .nav-link { justify-content: center; padding: 16px; }
      .user-profile { justify-content: center; padding: 12px 0; }
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
          {{ langService.currentLang() === 'en' ? 'Arabic' : 'English' }}
          <span>{{ langService.currentLang() === 'en' ? '🇦🇪' : '🇺🇸' }}</span>
        </button>
      </div>

      <div class="links">
        <a class="nav-link" routerLink="/dashboard"       routerLinkActive="active"><i data-lucide="home"></i> <span>{{ 'NAVBAR.DASHBOARD' | translate }}</span></a>
        <a class="nav-link" routerLink="/attendance"      routerLinkActive="active"><i data-lucide="calendar"></i> <span>{{ 'NAVBAR.ATTENDANCE' | translate }}</span></a>
        <a class="nav-link" routerLink="/profile"         routerLinkActive="active"><i data-lucide="user"></i> <span>{{ 'NAVBAR.PROFILE' | translate }}</span></a>
        <a class="nav-link" routerLink="/holiday-request" routerLinkActive="active"><i data-lucide="plane"></i> <span>{{ 'NAVBAR.HOLIDAY_REQUEST' | translate }}</span></a>
        <a class="nav-link" routerLink="/admin"           routerLinkActive="active" *ngIf="auth.isAdmin || auth.isManager"><i data-lucide="shield"></i> <span>{{ 'NAVBAR.ADMIN_PANEL' | translate }}</span></a>
      </div>

      <div class="user-area">
        <div class="user-profile">
          <div class="avatar">{{ initial }}</div>
          <div class="user-info">
            <span class="user-name">{{ auth.currentUser?.name }}</span>
            <span class="user-id">#{{ auth.currentUser?.id }}</span>
          </div>
        </div>
        <button class="btn-logout" (click)="logout()">
          <i data-lucide="log-out"></i>
          <span>{{ 'NAVBAR.LOGOUT' | translate }}</span>
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
