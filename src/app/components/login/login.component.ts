import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: var(--bg-primary);
      position: relative;
      overflow: hidden;
    }
    .bg-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(0, 163, 255, 0.08) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .card {
      background: var(--bg-surface);
      border: 1px solid var(--glass-border);
      border-radius: 32px;
      padding: 64px 48px;
      width: 480px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      text-align: center;
      z-index: 10;
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .logo span { color: var(--primary); }
    .subtitle {
      color: var(--text-muted);
      font-size: .85rem;
      margin-bottom: 48px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }
    h2 { 
      color: var(--text-main); 
      margin-bottom: 40px; 
      font-size: 1.6rem; 
      font-family: 'Outfit', sans-serif; 
      font-weight: 700;
    }
    .form-group { margin-bottom: 28px; text-align: left; }
    .form-group label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: .75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 12px;
    }
    .form-group i { color: var(--primary); width: 16px; }
    
    .divider { border: none; border-top: 1px solid var(--glass-border); margin: 40px 0; }
    
    .note { 
      font-size: .8rem; 
      color: var(--text-muted); 
      margin-top: 24px; 
      line-height: 1.6;
    }
    .register-link {
      color: var(--primary);
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .register-link:hover { text-decoration: underline; color: var(--primary-light); }
  `],
  template: `
    <div class="login-page">
      <div class="bg-circle" style="top: -20%; left: -10%;"></div>
      <div class="bg-circle" style="bottom: -20%; right: -10%;"></div>
      
      <div class="card">
        <div class="logo">
          <img src="assets/logo.png" alt="KTC Logo" class="brand-logo" style="height: 100px; margin: 0 auto 24px;">
        </div>
        <div class="subtitle">{{ 'LOGIN.SUBTITLE' | translate }}</div>
        <h2>{{ 'LOGIN.HEADER' | translate }}</h2>

        <div class="form-group">
          <label for="empId"><i data-lucide="user"></i> {{ 'LOGIN.EMP_ID' | translate }}</label>
          <input id="empId" name="empId" type="text" [(ngModel)]="empId" placeholder="e.g. EMP001" (keyup.enter)="login()" />
        </div>

        <div class="form-group">
          <label for="password"><i data-lucide="lock"></i> {{ 'LOGIN.PASSWORD' | translate }}</label>
          <input id="password" name="password" type="password" [(ngModel)]="password" placeholder="••••••••" (keyup.enter)="login()" />
        </div>

        <button class="btn-primary" (click)="login()" style="width: 100%; padding: 16px;">
          <i data-lucide="log-in"></i>
          {{ 'LOGIN.LOGIN_BTN' | translate }}
        </button>

        <hr class="divider">
        
        <p class="note">
          <strong>{{ 'LOGIN.NOTE_TITLE' | translate }}</strong> {{ 'LOGIN.NOTE_BODY' | translate }}
        </p>
        <p class="note">
          {{ 'LOGIN.NO_ACCOUNT' | translate }} <a class="register-link" (click)="gotoRegister()">{{ 'LOGIN.REGISTER_LINK' | translate }}</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  empId    = '';
  password = '';

  constructor(
    private auth:      AuthService,
    private toast:     ToastService,
    private router:    Router,
    private translate: TranslateService
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

  gotoRegister() { this.router.navigate(['/register']); }

  login(): void {
    if (!this.empId || !this.password) {
      this.toast.show(this.translate.instant('LOGIN.ERROR_FILL'), 'error'); return;
    }
    this.auth.login(this.empId.trim(), this.password.trim()).subscribe(res => {
      if (res) {
        this.toast.show(this.translate.instant('LOGIN.WELCOME') + ', ' + this.auth.currentUser!.name + '!');
        this.router.navigate(['/dashboard']);
      } else {
        this.toast.show(this.translate.instant('LOGIN.ERROR_INVALID'), 'error');
      }
    });
  }
}
