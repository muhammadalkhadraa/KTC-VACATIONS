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
      width: 480px;
      box-shadow: var(--shadow-xl);
      text-align: center;
      z-index: 10;
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .logo span { color: var(--accent); }
    .subtitle {
      color: var(--text-muted);
      font-size: .8rem;
      margin-bottom: 32px;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      text-align: left;
    }
    .form-group { margin-bottom: 20px; text-align: left; }
    .form-group.full { grid-column: span 2; }
    .form-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: .75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 8px;
    }
    .form-group i { color: var(--accent); width: 14px; }
    
    .divider { border: none; border-top: 1px solid var(--glass-border); margin: 32px 0; }
    
    .note { 
      font-size: .85rem; 
      color: var(--text-muted); 
      margin-top: 20px; 
    }
    .link-btn {
      color: var(--primary-light);
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s;
    }
    .link-btn:hover { color: var(--accent); }
  `],
  template: `
    <div class="login-page">
      <div class="bg-circle" style="top: -20%; right: -10%;"></div>
      <div class="bg-circle" style="bottom: -20%; left: -10%;"></div>

      <div class="card">
        <div class="logo">KT<span>C</span></div>
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
