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
      background: var(--sky);
      position: relative;
      overflow: hidden;
    }
    .bg-circle {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
      opacity: 0.1;
      z-index: 0;
    }
    .card {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: 32px;
      padding: 48px 40px;
      width: 440px;
      box-shadow: var(--shadow-xl);
      text-align: center;
      z-index: 10;
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .logo span { color: var(--accent); }
    .subtitle {
      color: var(--text-muted);
      font-size: .85rem;
      margin-bottom: 40px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h2 { 
      color: var(--primary); 
      margin-bottom: 32px; 
      font-size: 1.5rem; 
      font-family: 'Outfit', sans-serif; 
      font-weight: 700;
    }
    .form-group { margin-bottom: 24px; text-align: left; }
    .form-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: .8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 10px;
    }
    .form-group i { color: var(--accent); width: 16px; }
    
    .divider { border: none; border-top: 1px solid var(--glass-border); margin: 32px 0; }
    
    .note { 
      font-size: .8rem; 
      color: var(--text-muted); 
      margin-top: 20px; 
      line-height: 1.6;
    }
    .register-link {
      color: var(--primary-light);
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s;
    }
    .register-link:hover { color: var(--accent); }
  `],
  template: `
    <div class="login-page">
      <div class="bg-circle" style="top: -20%; left: -10%;"></div>
      <div class="bg-circle" style="bottom: -20%; right: -10%;"></div>
      
      <div class="card">
        <div class="logo">KT<span>C</span></div>
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
