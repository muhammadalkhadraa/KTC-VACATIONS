import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .toast {
      position: fixed; bottom: 30px; right: 30px;
      padding: 14px 24px; border-radius: 14px;
      font-weight: 700; font-size: .9rem;
      box-shadow: 0 8px 32px rgba(30,95,122,.2);
      z-index: 9999; animation: slideIn .3s ease;
      font-family: 'Nunito', sans-serif;
    }
    .toast-success { background: #1A5F7A; color: white; }
    .toast-error   { background: #E05C6A; color: white; }
    .toast-info    { background: #2E86AB; color: white; }
    @keyframes slideIn {
      from { opacity:0; transform:translateY(10px); }
      to   { opacity:1; transform:translateY(0); }
    }
  `],
  template: `
    <div *ngIf="toast$ | async as t"
         class="toast" [ngClass]="'toast-' + t.type">
      {{ t.message }}
    </div>
  `
})
export class ToastComponent {
  toast$ = this.svc.toast$;
  constructor(private svc: ToastService) {}
}
