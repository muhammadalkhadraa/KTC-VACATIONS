import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
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
      width: 520px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      text-align: center;
      z-index: 10;
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .logo span { color: var(--primary); }
    .subtitle {
      color: var(--text-muted);
      font-size: .8rem;
      margin-bottom: 40px;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      text-align: left;
    }
    .form-group { margin-bottom: 24px; text-align: left; }
    .form-group.full { grid-column: span 2; }
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
    .form-group i { color: var(--primary); width: 14px; }
    
    .divider { border: none; border-top: 1px solid var(--glass-border); margin: 40px 0; }
    
    .note { 
      font-size: .85rem; 
      color: var(--text-muted); 
      margin-top: 24px; 
    }
    .link-btn {
      color: var(--primary);
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .link-btn:hover { text-decoration: underline; color: var(--primary-light); }
  `],
  template: `
    <div class="login-page">
      <div class="bg-circle" style="top: -20%; right: -10%;"></div>
      <div class="bg-circle" style="bottom: -20%; left: -10%;"></div>

      <div class="card">
        <div class="logo">
          <img src="assets/logo.png" alt="KTC Logo" class="brand-logo" style="height: 80px; margin: 0 auto 20px;">
        </div>
        <div class="subtitle">Kazareen Textile Company</div>
        <h2><i data-lucide="user-plus"></i> {{ 'REGISTER.TITLE' | translate }}</h2>

        <div class="form-grid">
          <div class="form-group">
            <label for="regId"><i data-lucide="hash"></i> {{ 'LOGIN.EMP_ID' | translate }}</label>
            <input id="regId" name="regId" type="text" [(ngModel)]="id" placeholder="EMP001" />
          </div>
          <div class="form-group">
            <label for="regName"><i data-lucide="user"></i> {{ 'REGISTER.NAME' | translate }}</label>
            <input id="regName" name="regName" type="text" [(ngModel)]="name" placeholder="John Doe" />
          </div>
          <div class="form-group">
            <label for="regDept"><i data-lucide="building"></i> {{ 'DASHBOARD.COL_DEPT' | translate }}</label>
            <input id="regDept" name="regDept" type="text" [(ngModel)]="department" placeholder="Production" />
          </div>
          <div class="form-group">
            <label for="regPos"><i data-lucide="briefcase"></i> {{ 'PROFILE.ROLE' | translate: {defaultValue: 'Position'} }}</label>
            <input id="regPos" name="regPos" type="text" [(ngModel)]="position" placeholder="Operator" />
          </div>
          <div class="form-group full">
            <label for="regPass"><i data-lucide="lock"></i> {{ 'LOGIN.PASSWORD' | translate }}</label>
            <input id="regPass" name="regPass" type="password" [(ngModel)]="password" [placeholder]="'REGISTER.PASS_PLACEHOLDER' | translate" />
          </div>
        </div>

        <button class="btn-primary" (click)="register()" style="width: 100%; padding: 16px; margin-top: 16px;">
          <i data-lucide="user-plus"></i>
          {{ 'REGISTER.BTN_REGISTER' | translate }}
        </button>
        
        <hr class="divider" />
        
        <p class="note">
          {{ 'REGISTER.ALREADY_HAVE' | translate }} <a class="link-btn" (click)="gotoLogin()">{{ 'REGISTER.LOGIN_HERE' | translate }}</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  id = '';
  name = '';
  department = '';
  position = '';
  password = '';

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
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

  register(): void {
    if (!this.id || !this.name || !this.department || !this.position || !this.password) {
      this.toast.show(this.translate.instant('REGISTER.MSG_FILL_ALL'), 'error');
      return;
    }
    this.auth.register({
      id: this.id.trim(),
      password: this.password,
      name: this.name.trim(),
      department: this.department.trim(),
      position: this.position.trim()
    }).subscribe({
      next: () => {
        this.toast.show(this.translate.instant('REGISTER.MSG_SUCCESS'));
        this.router.navigate(['/login']);
      },
      error: err => {
        if (err.status === 409) {
          this.toast.show(this.translate.instant('REGISTER.MSG_EXISTS'), 'error');
        } else {
          this.toast.show(this.translate.instant('REGISTER.MSG_FAILED'), 'error');
        }
      }
    });
  }

  gotoLogin() { this.router.navigate(['/login']); }
}
