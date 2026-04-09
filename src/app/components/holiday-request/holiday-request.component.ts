import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { HolidayService } from '../../services/holiday.service';
import { ToastService } from '../../services/toast.service';
import { HolidayRequest } from '../../models/models';
import { DataStoreService } from '../../services/data-store.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-holiday-request',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  styles: [`
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    @media (max-width: 1200px) { .two-col { grid-template-columns: 1fr; } }
    
    .balance-pill {
      display: inline-flex; align-items: center; gap: 16px;
      background: rgba(0, 163, 255, 0.05); 
      border: 1px solid rgba(0, 163, 255, 0.1);
      border-radius: var(--radius-sm); padding: 16px 24px;
      font-weight: 700; color: var(--primary); font-size: 1.1rem; margin-bottom: 32px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .balance-pill i { color: var(--primary); }
    
    .days-preview {
      background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 20px;
      font-weight: 700; color: var(--text-main); font-size: 1rem; margin-bottom: 24px;
      display: flex; align-items: center; gap: 12px;
      border: 1px solid var(--primary);
      animation: glow 2s infinite alternate;
    }
    
    @keyframes glow {
      from { box-shadow: 0 0 5px rgba(0, 163, 255, 0.1); border-color: rgba(0, 163, 255, 0.3); }
      to { box-shadow: 0 0 15px rgba(0, 163, 255, 0.3); border-color: var(--primary); }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--text-muted);
      gap: 16px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: var(--radius);
      border: 1px dashed var(--glass-border);
    }
    .empty-state i { font-size: 3rem; color: var(--text-dim); }
  `],
  template: `
    <div class="page-wrapper">
      <h1 class="page-title"><i data-lucide="plane"></i> {{ 'HOLIDAY_REQUEST.TITLE' | translate }}</h1>

      <div class="two-col">
        <!-- Submit form -->
        <div class="card" *ngIf="!auth.isGeneralManager; else adminNote">
          <div class="card-title"><i data-lucide="send"></i>{{ 'HOLIDAY_REQUEST.SUBMIT_TITLE' | translate }}</div>

          <div class="balance-pill">
            <i data-lucide="wallet"></i>
            {{ 'HOLIDAY_REQUEST.REMAINING_BALANCE' | translate }} <strong>{{ remaining }} {{ 'DASHBOARD.COL_DAYS' | translate }}</strong>
          </div>

          <div class="form-group">
            <label for="startDate"><i data-lucide="calendar-plus" style="width: 14px; margin-right: 4px;"></i>{{ 'HOLIDAY_REQUEST.START_DATE' | translate }}</label>
            <input id="startDate" name="startDate" type="date" [(ngModel)]="startDate" [min]="today" (change)="calcPreview()" />
          </div>

          <div class="form-group">
            <label for="end_date"><i data-lucide="calendar-minus" style="width: 14px; margin-right: 4px;"></i>{{ 'HOLIDAY_REQUEST.END_DATE' | translate }}</label>
            <input id="end_date" name="end_date" type="date" [(ngModel)]="end_date" [min]="startDate || today" (change)="calcPreview()" />
          </div>

          <div class="days-preview" *ngIf="previewDays > 0">
            <i data-lucide="clock"></i>
            {{ 'HOLIDAY_REQUEST.DURATION' | translate }} <strong>{{ 'HOLIDAY_REQUEST.DAYS_COUNT' | translate:{count: previewDays} }}</strong>
          </div>

          <div class="form-group">
            <label for="reason"><i data-lucide="file-text" style="width: 14px; margin-right: 4px;"></i>{{ 'HOLIDAY_REQUEST.REASON' | translate }}</label>
            <textarea id="reason" name="reason" [(ngModel)]="reason" [placeholder]="'HOLIDAY_REQUEST.REASON_PLACEHOLDER' | translate"></textarea>
          </div>

          <button class="btn-primary" (click)="submit()" style="width: 100%;">
            <i data-lucide="check-square"></i>
            {{ 'HOLIDAY_REQUEST.SUBMIT_BTN' | translate }}
          </button>
        </div>
        
        <ng-template #adminNote>
          <div class="card">
            <div class="card-title"><i data-lucide="info"></i>{{ 'HOLIDAY_REQUEST.SUBMIT_TITLE' | translate }}</div>
            <div class="empty-state">
              <i data-lucide="shield-alert"></i>
              <p style="text-align: center;">{{ 'HOLIDAY_REQUEST.GM_NOTE' | translate }}</p>
            </div>
          </div>
        </ng-template>

        <!-- My requests -->
        <div class="card">
          <div class="card-title"><i data-lucide="history"></i>{{ 'HOLIDAY_REQUEST.MY_REQUESTS' | translate }}</div>
          <ng-container *ngIf="myRequests.length; else noReqs">
            <div class="table-container">
              <table class="req-table">
                <thead>
                  <tr>
                    <th>{{ 'DASHBOARD.COL_PERIOD' | translate }}</th>
                    <th>{{ 'DASHBOARD.COL_DAYS' | translate }}</th>
                    <th>{{ 'DASHBOARD.COL_STATUS' | translate }}</th>
                    <th>{{ 'DASHBOARD.COL_APPROVAL' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of myRequests">
                    <td style="font-weight: 600; line-height: 1.4;">{{ fmt(r.startDate) }} –<br><span style="color: var(--text-muted); font-size: 0.8rem;">{{ fmt(r.end_date) }}</span></td>
                    <td><span class="badge badge-pending" style="background: var(--sky); color: var(--primary);">{{ r.days }}</span></td>
                    <td><span class="badge" [ngClass]="bc(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">{{ approvalText(r) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
          <ng-template #noReqs>
            <div class="empty-state">
              <i data-lucide="inbox"></i>
              <p>{{ 'HOLIDAY_REQUEST.NO_REQUESTS' | translate }}</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `
})
export class HolidayRequestComponent implements OnInit, OnDestroy {
  startDate = '';
  start_date = '';
  end_date = '';
  reason = '';
  previewDays = 0;
  today = new Date().toISOString().slice(0, 10);
  private sub = new Subscription();

  constructor(
    public auth: AuthService,
    private holSvc: HolidayService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public store: DataStoreService,
    private translate: TranslateService
  ) { }

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

  get remaining() { return this.emp ? this.emp.totalHolidays - this.emp.usedHolidays : 0; }
  ngOnInit(): void {
    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.store.refresh();
      })
    );
  }

  get myRequests() { return this.store.myRequests(); }
  get emp() { return this.auth.currentUser!; }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }


  calcPreview(): void {
    if (this.startDate && this.end_date && this.end_date >= this.startDate) {
      this.previewDays = this.calcDays(this.startDate, this.end_date);
    } else {
      this.previewDays = 0;
    }
  }

  submit(): void {
    if (!this.startDate || !this.end_date) { 
      this.toast.show(this.translate.instant('HOLIDAY_REQUEST.MSG_SELECT_DATES'), 'error'); 
      return; 
    }
    if (this.end_date < this.startDate) { 
      this.toast.show(this.translate.instant('HOLIDAY_REQUEST.MSG_DATE_ERROR'), 'error'); 
      return; 
    }
    if (!this.reason.trim()) { 
      this.toast.show(this.translate.instant('HOLIDAY_REQUEST.MSG_ENTER_REASON'), 'error'); 
      return; 
    }

    const payload: Partial<HolidayRequest> = {
      empId: this.emp.id,
      emp_name: this.emp.name,
      startDate: this.startDate,
      end_date: this.end_date,
      days: this.calcDays(this.startDate, this.end_date),
      reason: this.reason.trim()
    };

    this.holSvc.submit(payload).subscribe({
      next: () => {
        this.toast.show(this.translate.instant('HOLIDAY_REQUEST.MSG_SUCCESS'));
        this.startDate = ''; this.end_date = ''; this.reason = ''; this.previewDays = 0;
        this.store.refresh();
      },
      error: () => this.toast.show(this.translate.instant('HOLIDAY_REQUEST.MSG_ERROR'), 'error')
    });
  }

  fmt(d: string) { 
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }); 
  }

  approvalText(req: HolidayRequest): string {
    if (req.manager_status === 'rejected') {
      return this.translate.instant('DASHBOARD.APPROVAL_REJECTED_MGR', { id: req.manager_id });
    }
    if (req.gm_status === 'rejected') {
      return this.translate.instant('DASHBOARD.APPROVAL_REJECTED_GM', { id: req.gm_id });
    }
    if (req.manager_status === 'pending') {
      return this.translate.instant('DASHBOARD.APPROVAL_WAITING_MGR');
    }
    if (req.manager_status === 'approved' && req.gm_status === 'pending') {
      return this.translate.instant('DASHBOARD.APPROVAL_WAITING_GM', { id: req.manager_id });
    }
    if (req.manager_status === 'approved' && req.gm_status === 'approved') {
      return this.translate.instant('HOLIDAY_REQUEST.FULLY_APPROVED');
    }
    return '';
  }

  getStatusLabel(status: string) {
    const key = `DASHBOARD.STATUS_${status.toUpperCase()}`;
    return this.translate.instant(key);
  }

  bc(s: string) { return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[s] ?? ''; }

  private calcDays(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }
}
