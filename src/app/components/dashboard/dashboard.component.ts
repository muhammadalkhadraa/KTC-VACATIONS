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
    .greeting { font-size: 1rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 500; }
    .page-title { margin-bottom: 40px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }
    
    .stat-card i { font-size: 1.5rem; margin-bottom: 16px; color: var(--primary-light); }
    .stat-card.green i { color: var(--success); }
    .stat-card.red i { color: var(--danger); }
    .stat-card.yellow i { color: var(--warning); }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .quick-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      background: var(--white);
      color: var(--primary);
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: .9rem;
      text-decoration: none;
      border: 1px solid var(--glass-border);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: var(--shadow-sm);
    }
    .quick-link i { color: var(--accent); }
    .quick-link:hover { 
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--accent);
      background: var(--accent-soft);
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--text-muted);
      gap: 16px;
    }
    .empty-state i { font-size: 3rem; color: var(--accent); opacity: 0.5; }
  `],
  template: `
    <div class="page-wrapper">
      <p class="greeting">{{ today }}</p>
      <h1 class="page-title">{{ 'DASHBOARD.GREETING' | translate }}, <span>{{ firstName }}</span> 👋</h1>

      <!-- ─── EMPLOYEE DASHBOARD ─── -->
      <ng-container *ngIf="!isAdmin">
        <div class="stats-grid">
          <div class="card stat-card green">
            <i data-lucide="check-circle-2"></i>
            <div class="stat-num">{{ summary.present }}</div>
            <div class="stat-label">{{ 'DASHBOARD.PRESENT_DAYS' | translate }}</div>
          </div>
          <div class="card stat-card red">
            <i data-lucide="x-circle"></i>
            <div class="stat-num">{{ summary.absent }}</div>
            <div class="stat-label">{{ 'DASHBOARD.ABSENT_DAYS' | translate }}</div>
          </div>
          <div class="card stat-card yellow">
            <i data-lucide="clock"></i>
            <div class="stat-num">{{ summary.late }}</div>
            <div class="stat-label">{{ 'DASHBOARD.LATE_DAYS' | translate }}</div>
          </div>
          <div class="card stat-card" [ngClass]="{'red': remainingHolidays < 0}">
            <i [attr.data-lucide]="remainingHolidays < 0 ? 'alert-triangle' : 'palm-tree'"></i>
            <div class="stat-num">{{ remainingHolidays }}</div>
            <div class="stat-label">
              {{ remainingHolidays < 0 ? ('DASHBOARD.DAYS_EXCEEDED' | translate) : ('DASHBOARD.HOLIDAYS_LEFT' | translate) }}
            </div>
          </div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-title"><i data-lucide="activity"></i>{{ 'DASHBOARD.RECENT_ATTENDANCE' | translate }}</div>
            <div class="table-container">
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
                    <td style="font-weight: 600;">{{ formatDate(r.date) }}</td>
                    <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                    <td>{{ r.checkIn }}</td>
                    <td>{{ r.checkOut }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-title"><i data-lucide="calendar-days"></i>{{ 'DASHBOARD.MY_REQUESTS' | translate }}</div>
            <ng-container *ngIf="myRequests.length; else noReqs">
              <div class="table-container">
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
                      <td style="font-weight: 600;">{{ formatDate(r.startDate) }} – {{ formatDate(r.end_date) }}</td>
                      <td>{{ r.days }}</td>
                      <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                      <td style="font-size: 0.8rem; color: var(--text-muted);">{{ approvalText(r) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ng-container>
            <ng-template #noReqs>
              <div class="empty-state">
                <i data-lucide="plane-landing"></i>
                <p>{{ 'DASHBOARD.NO_REQUESTS' | translate }}</p>
              </div>
            </ng-template>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><i data-lucide="zap"></i>{{ 'DASHBOARD.QUICK_ACTIONS' | translate }}</div>
          <div class="quick-actions">
            <a class="quick-link" routerLink="/attendance"><i data-lucide="calendar"></i>{{ 'DASHBOARD.VIEW_ATTENDANCE' | translate }}</a>
            <a class="quick-link" routerLink="/holiday-request"><i data-lucide="plus-circle"></i>{{ 'DASHBOARD.REQUEST_HOLIDAY' | translate }}</a>
            <a class="quick-link" routerLink="/profile"><i data-lucide="user-cog"></i>{{ 'DASHBOARD.MY_PROFILE' | translate }}</a>
          </div>
        </div>
      </ng-container>

      <!-- ─── ADMIN DASHBOARD ─── -->
      <ng-container *ngIf="isAdmin">
        <div class="stats-grid">
          <div class="card stat-card">
            <i data-lucide="users"></i>
            <div class="stat-num">{{ totalEmployees }}</div>
            <div class="stat-label">{{ 'DASHBOARD.TOTAL_EMPLOYEES' | translate }}</div>
          </div>
          <div class="card stat-card yellow">
            <i data-lucide="clock-4"></i>
            <div class="stat-num">{{ pendingCount }}</div>
            <div class="stat-label">{{ 'DASHBOARD.PENDING_REQUESTS' | translate }}</div>
          </div>
          <div class="card stat-card green">
            <i data-lucide="user-check"></i>
            <div class="stat-num">{{ totalEmployees > 0 ? totalEmployees - 1 : 0 }}</div>
            <div class="stat-label">{{ 'DASHBOARD.PRESENT_TODAY' | translate }}</div>
          </div>
          <div class="card stat-card red">
            <i data-lucide="user-minus"></i>
            <div class="stat-num">{{ totalEmployees > 0 ? 1 : 0 }}</div>
            <div class="stat-label">{{ 'DASHBOARD.ABSENT_TODAY' | translate }}</div>
          </div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-title"><i data-lucide="users-2"></i>{{ 'DASHBOARD.ALL_EMPLOYEES' | translate }}</div>
            <div class="table-container">
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
                    <td style="font-weight: 600;">{{ e.name }}</td>
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
          </div>

          <div class="card">
            <div class="card-title"><i data-lucide="glasses"></i>{{ 'DASHBOARD.PENDING_HOLIDAY_REQS' | translate }}</div>
            <ng-container *ngIf="pendingRequests.length; else noPending">
              <div class="table-container">
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
                      <td style="font-weight: 600;">{{ r.emp_name }}</td>
                      <td>{{ formatDate(r.startDate) }}</td>
                      <td><span class="badge badge-pending">{{ r.days }} {{ 'DASHBOARD.DAYS' | translate }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ng-container>
            <ng-template #noPending>
              <div class="empty-state">
                <i data-lucide="party-popper"></i>
                <p>{{ 'DASHBOARD.NO_PENDING' | translate }}</p>
              </div>
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
