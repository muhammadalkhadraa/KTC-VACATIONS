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
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }
    .balance-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: #D6F0FF; border-radius: 12px; padding: 10px 18px;
      font-weight: 700; color: #1A5F7A; font-size: .9rem; margin-bottom: 20px;
    }
    .days-preview {
      background: #D6F0FF; border-radius: 10px; padding: 10px 16px;
      font-weight: 700; color: #1A5F7A; font-size: .9rem; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .req-table td, .req-table th { font-size: .85rem; }
  `],
  template: `
    <div class="page-wrapper">
      <h1 class="page-title">✈️ {{ 'HOLIDAY_REQUEST.TITLE' | translate | slice:0:-8 }} <span>{{ 'HOLIDAY_REQUEST.REQUEST_SPAN' | translate }}</span></h1>

      <div class="two-col">
        <!-- Submit form -->
        <div class="card" *ngIf="!auth.isGeneralManager; else adminNote">
          <div class="card-title">{{ 'HOLIDAY_REQUEST.SUBMIT_TITLE' | translate }}</div>

          <div class="balance-pill">
            {{ 'HOLIDAY_REQUEST.REMAINING_BALANCE' | translate }} <strong>{{ remaining }} {{ 'DASHBOARD.COL_DAYS' | translate }}</strong>
          </div>

          <div class="form-group">
            <label for="startDate">{{ 'HOLIDAY_REQUEST.START_DATE' | translate }}</label>
            <input id="startDate" name="startDate" type="date" [(ngModel)]="startDate" [min]="today" (change)="calcPreview()" />
          </div>

          <div class="form-group">
            <label for="end_date">{{ 'HOLIDAY_REQUEST.END_DATE' | translate }}</label>
            <input id="end_date" name="end_date" type="date" [(ngModel)]="end_date" [min]="startDate || today" (change)="calcPreview()" />
          </div>

          <div class="days-preview" *ngIf="previewDays > 0">
            {{ 'HOLIDAY_REQUEST.DURATION' | translate }} <strong>{{ 'HOLIDAY_REQUEST.DAYS_COUNT' | translate:{count: previewDays} }}</strong>
          </div>

          <div class="form-group">
            <label for="reason">{{ 'HOLIDAY_REQUEST.REASON' | translate }}</label>
            <textarea id="reason" name="reason" [(ngModel)]="reason" [placeholder]="'HOLIDAY_REQUEST.REASON_PLACEHOLDER' | translate"></textarea>
          </div>

          <button class="btn-primary" (click)="submit()">{{ 'HOLIDAY_REQUEST.SUBMIT_BTN' | translate }}</button>
        </div>
        <ng-template #adminNote>
          <div class="card">
            <div class="card-title">{{ 'HOLIDAY_REQUEST.SUBMIT_TITLE' | translate }}</div>
            <div class="empty-state">
              <span class="emoji">ℹ️</span>
              {{ 'HOLIDAY_REQUEST.GM_NOTE' | translate }}
            </div>
          </div>
        </ng-template>

        <!-- My requests -->
        <div class="card">
          <div class="card-title">{{ 'HOLIDAY_REQUEST.MY_REQUESTS' | translate }}</div>
          <ng-container *ngIf="myRequests.length; else noReqs">
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
                  <td>{{ fmt(r.startDate) }} –<br>{{ fmt(r.end_date) }}</td>
                  <td>{{ r.days }}</td>
                  <td><span class="badge" [ngClass]="bc(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                  <td>{{ approvalText(r) }}</td>
                </tr>
              </tbody>
            </table>
          </ng-container>
          <ng-template #noReqs>
            <div class="empty-state"><span class="emoji">📭</span>{{ 'HOLIDAY_REQUEST.NO_REQUESTS' | translate }}</div>
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
