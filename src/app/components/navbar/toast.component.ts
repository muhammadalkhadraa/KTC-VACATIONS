import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .toast {
      position: fixed; bottom: 32px; right: 32px;
      padding: 16px 32px; border-radius: 12px;
      font-weight: 700; font-size: .95rem;
      z-index: 10000; animation: toastIn .4s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: 'Outfit', sans-serif;
      border: 1px solid var(--glass-border);
      background: var(--bg-surface);
      color: var(--text-main);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .toast-success { color: var(--success); border-color: rgba(52, 211, 153, 0.2); }
    .toast-error   { color: var(--danger); border-color: rgba(255, 75, 92, 0.2); }
    .toast-info    { color: var(--primary); border-color: rgba(0, 163, 255, 0.2); }
    @keyframes toastIn {
      from { opacity:0; transform: translateY(20px) scale(0.95); }
      to   { opacity:1; transform: translateY(0) scale(1); }
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
