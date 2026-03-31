import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    // reuse same css as login for simplicity
    `.login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #D6F0FF 0%, #89CFF0 50%, #2E86AB 100%);
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 48px 40px;
      width: 390px;
      box-shadow: 0 8px 32px rgba(30,95,122,.18);
      text-align: center;
    }
    .logo {
      font-family: 'Poppins', sans-serif;
      font-size: 2.6rem;
      font-weight: 700;
      color: #1A5F7A;
      letter-spacing: 4px;
    }
    .logo span { color: #89CFF0; }
    .subtitle {
      color: #4a7a92;
      font-size: .82rem;
      margin-bottom: 32px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    h2 { color: #1e3a4a; margin-bottom: 24px; font-size: 1.2rem; font-family: 'Poppins', sans-serif; }
    .form-group { margin-bottom: 16px; text-align: left; }
    .form-group label {
      display: block;
      font-size: .78rem;
      font-weight: 700;
      color: #4a7a92;
      text-transform: uppercase;
      letter-spacing: .5px;
      margin-bottom: 6px;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #C5E8FB;
      border-radius: 12px;
      font-family: 'Nunito', sans-serif;
      font-size: .95rem;
      color: #1e3a4a;
      background: #F8FCFF;
      outline: none;
      transition: .2s;
    }
    .form-group input:focus,
    .form-group select:focus { border-color: #89CFF0; background: white; }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #2E86AB, #1A5F7A);
      color: white;
      border: none;
      border-radius: 12px;
      font-family: 'Nunito', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 8px;
      transition: .2s;
      letter-spacing: .5px;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(46,134,171,.4); }
    .note { font-size: .72rem; color: #8ab4c8; margin-top: 18px; line-height: 1.6; }
    .divider { border: none; border-top: 1px solid #D6F0FF; margin: 20px 0; }
  `],
  template: `
    <div class="login-page">
      <div class="card">
        <div class="logo">KT<span>C</span></div>
        <div class="subtitle">Kazareen Textile Company</div>
        <h2>Create an Account</h2>

        <div class="form-group">
          <label>Employee ID</label>
          <input type="text" [(ngModel)]="id" placeholder="EMP001" />
        </div>
        <div class="form-group">
          <label>Name</label>
          <input type="text" [(ngModel)]="name" placeholder="John Doe" />
        </div>
        <div class="form-group">
          <label>Department</label>
          <input type="text" [(ngModel)]="department" placeholder="Production" />
        </div>
        <div class="form-group">
          <label>Position</label>
          <input type="text" [(ngModel)]="position" placeholder="Operator" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" [(ngModel)]="password" placeholder="Choose a password" />
        </div>

        <button class="btn" (click)="register()">Register →</button>
        <hr class="divider" />
        <p class="note">
          Already have an account? <a (click)="gotoLogin()">Login here</a>.
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
    private router: Router
  ) {}

  register(): void {
    if (!this.id || !this.name || !this.department || !this.position || !this.password) {
      this.toast.show('⚠️ Please fill in all fields', 'error');
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
        this.toast.show('✅ Registration successful – you can now log in');
        this.router.navigate(['/login']);
      },
      error: err => {
        if (err.status === 409) {
          this.toast.show('❌ Employee ID already exists', 'error');
        } else {
          this.toast.show('❌ Registration failed', 'error');
        }
      }
    });
  }

  gotoLogin() { this.router.navigate(['/login']); }}
