import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { HolidayService } from '../../services/holiday.service';
import { ToastService } from '../../services/toast.service';
import { HolidayRequest, AttendanceRecord, Employee } from '../../models/models';
import { DataStoreService } from '../../services/data-store.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  styles: [`
    .greeting { font-size: .95rem; color: #4a7a92; margin-bottom: 4px; }
    .recent-table td, .recent-table th { font-size: .85rem; padding: 10px 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }
    .quick-link {
      display: inline-block; padding: 10px 20px;
      background: #D6F0FF; color: #1A5F7A; border-radius: 10px;
      font-weight: 700; font-size: .85rem; text-decoration: none;
      margin: 4px; transition: .2s;
    }
    .quick-link:hover { background: #89CFF0; color: white; }
    .admin-emp td { font-size: .88rem; }
  `],
  template: `
    <div class="page-wrapper">
      <!-- Title -->
      <p class="greeting">{{ today }}</p>
      <h1 class="page-title">{{ 'DASHBOARD.GREETING' | translate }}, <span>{{ firstName }}</span> 👋</h1>

      <!-- ─── EMPLOYEE DASHBOARD ─── -->
      <ng-container *ngIf="!isAdmin">
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card green">
            <div class="stat-num">{{ summary.present }}</div>
            <div class="stat-label">{{ 'DASHBOARD.PRESENT_DAYS' | translate }}</div>
          </div>
          <div class="stat-card red">
            <div class="stat-num">{{ summary.absent }}</div>
            <div class="stat-label">{{ 'DASHBOARD.ABSENT_DAYS' | translate }}</div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-num">{{ summary.late }}</div>
            <div class="stat-label">{{ 'DASHBOARD.LATE_DAYS' | translate }}</div>
          </div>
          <div class="stat-card" [ngClass]="{'red': remainingHolidays < 0}">
            <div class="stat-num">{{ remainingHolidays }}</div>
            <div class="stat-label">
              {{ remainingHolidays < 0 ? ('DASHBOARD.DAYS_EXCEEDED' | translate) : ('DASHBOARD.HOLIDAYS_LEFT' | translate) }}
            </div>
          </div>
        </div>

        <!-- Recent Attendance + Holiday Requests -->
        <div class="two-col">
          <div class="card">
            <div class="card-title">{{ 'DASHBOARD.RECENT_ATTENDANCE' | translate }}</div>
            <table class="recent-table">
              <thead>
                <tr>
                  <th>{{ 'DASHBOARD.COL_DATE' | translate }}</th>
                  <th>{{ 'DASHBOARD.COL_STATUS' | translate }}</th>
                  <th>{{ 'DASHBOARD.COL_IN' | translate }}</th>
                  <th>{{ 'DASHBOARD.COL_OUT' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of recentAtt">
                  <td>{{ formatDate(r.date) }}</td>
                  <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                  <td>{{ r.checkIn }}</td>
                  <td>{{ r.checkOut }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-title">{{ 'DASHBOARD.MY_REQUESTS' | translate }}</div>
            <ng-container *ngIf="myRequests.length; else noReqs">
              <table class="recent-table">
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
                    <td>{{ formatDate(r.startDate) }} – {{ formatDate(r.end_date) }}</td>
                    <td>{{ r.days }}</td>
                    <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                    <td>{{ approvalText(r) }}</td>
                  </tr>
                </tbody>
              </table>
            </ng-container>
            <ng-template #noReqs>
              <div class="empty-state"><span class="emoji">🏖️</span>{{ 'DASHBOARD.NO_REQUESTS' | translate }}</div>
            </ng-template>
          </div>
        </div>

        <!-- Quick links -->
        <div class="card">
          <div class="card-title">{{ 'DASHBOARD.QUICK_ACTIONS' | translate }}</div>
          <a class="quick-link" routerLink="/attendance">{{ 'DASHBOARD.VIEW_ATTENDANCE' | translate }}</a>
          <a class="quick-link" routerLink="/holiday-request">{{ 'DASHBOARD.REQUEST_HOLIDAY' | translate }}</a>
          <a class="quick-link" routerLink="/profile">{{ 'DASHBOARD.MY_PROFILE' | translate }}</a>
        </div>
      </ng-container>

      <!-- ─── ADMIN DASHBOARD ─── -->
      <ng-container *ngIf="isAdmin">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-num">{{ totalEmployees }}</div>
            <div class="stat-label">{{ 'DASHBOARD.TOTAL_EMPLOYEES' | translate }}</div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-num">{{ pendingCount }}</div>
            <div class="stat-label">{{ 'DASHBOARD.PENDING_REQUESTS' | translate }}</div>
          </div>
          <div class="stat-card green">
            <div class="stat-num">{{ totalEmployees > 0 ? totalEmployees - 1 : 0 }}</div>
            <div class="stat-label">{{ 'DASHBOARD.PRESENT_TODAY' | translate }}</div>
          </div>
          <div class="stat-card red">
            <div class="stat-num">{{ totalEmployees > 0 ? 1 : 0 }}</div>
            <div class="stat-label">{{ 'DASHBOARD.ABSENT_TODAY' | translate }}</div>
          </div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-title">{{ 'DASHBOARD.ALL_EMPLOYEES' | translate }}</div>
            <table class="admin-emp">
              <thead>
                <tr>
                  <th>{{ 'DASHBOARD.COL_NAME' | translate }}</th>
                  <th>{{ 'DASHBOARD.COL_DEPT' | translate }}</th>
                  <th>{{ 'DASHBOARD.COL_STATUS' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let e of allEmployees; let i = index">
                  <td>{{ e.name }}</td>
                  <td>{{ e.department }}</td>
                  <td>
                    <span class="badge" [ngClass]="i === 2 ? 'badge-absent' : 'badge-present'">
                      {{ i === 2 ? ('DASHBOARD.STATUS_ABSENT' | translate) : ('DASHBOARD.STATUS_PRESENT' | translate) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-title">{{ 'DASHBOARD.PENDING_HOLIDAY_REQS' | translate }}</div>
            <ng-container *ngIf="pendingRequests.length; else noPending">
              <table class="recent-table">
                <thead>
                  <tr>
                    <th>{{ 'DASHBOARD.COL_EMPLOYEE' | translate }}</th>
                    <th>{{ 'DASHBOARD.COL_DATES' | translate }}</th>
                    <th>{{ 'DASHBOARD.COL_DAYS' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of pendingRequests">
                    <td>{{ r.emp_name }}</td>
                    <td>{{ formatDate(r.startDate) }}</td>
                    <td>{{ r.days }}</td>
                  </tr>
                </tbody>
              </table>
            </ng-container>
            <ng-template #noPending>
              <div class="empty-state"><span class="emoji">🎉</span>{{ 'DASHBOARD.NO_PENDING' | translate }}</div>
            </ng-template>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  pendingRequests: HolidayRequest[] = [];
  today = '';
  private sub = new Subscription();

  constructor(
    public auth: AuthService,
    private attSvc: AttendanceService,
    private holSvc: HolidayService,
    private toast: ToastService,
    private router: Router,
    public store: DataStoreService,
    private translate: TranslateService,
    private langService: LanguageService
  ) { }

  get isAdmin() { return this.auth.isAdmin; }
  get firstName() { return this.auth.currentUser?.name.split(' ')[0] ?? ''; }
  totalEmployees = 0;
  allEmployees: Employee[] = [];
  pendingCount = 0;

  ngOnInit(): void {
    this.updateToday();
    
    // Update "today" string when language changes
    this.sub.add(
      this.translate.onLangChange.subscribe(() => {
        this.updateToday();
      })
    );

    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.store.refresh();
      })
    );
  }

  private updateToday() {
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    this.today = new Date().toLocaleDateString(locale, { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  get myRequests() { return this.store.myRequests(); }
  get recentAtt() { return this.store.attendanceHistory().slice().reverse().slice(0, 5); }
  get summary() { return this.attSvc.getSummary(this.store.attendanceHistory()); }
  get remainingHolidays() {
    const u = this.store.user();
    return u ? u.totalHolidays - u.usedHolidays : 0;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  formatDate(d: string) { 
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
      return this.translate.instant('DASHBOARD.APPROVAL_DONE', { mid: req.manager_id, gid: req.gm_id });
    }
    return '';
  }

  getStatusLabel(status: string) {
    const key = `DASHBOARD.STATUS_${status.toUpperCase()}`;
    return this.translate.instant(key);
  }

  badgeClass(status: string) {
    const map: Record<string, string> = {
      Present: 'badge-present', Absent: 'badge-absent', Late: 'badge-late',
      Weekend: 'badge-weekend', pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected'
    };
    return map[status] ?? 'badge-pending';
  }
}
