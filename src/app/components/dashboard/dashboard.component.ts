import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter, merge } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { HolidayService } from '../../services/holiday.service';
import { ToastService } from '../../services/toast.service';
import { HolidayRequest, AttendanceRecord, Employee } from '../../models/models';
import { DataStoreService } from '../../services/data-store.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
      <h1 class="page-title">Good Morning, <span>{{ firstName }}</span> 👋</h1>

      <!-- ─── EMPLOYEE DASHBOARD ─── -->
      <ng-container *ngIf="!isAdmin">
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card green">
            <div class="stat-num">{{ summary.present }}</div>
            <div class="stat-label">Present Days</div>
          </div>
          <div class="stat-card red">
            <div class="stat-num">{{ summary.absent }}</div>
            <div class="stat-label">Absent Days</div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-num">{{ summary.late }}</div>
            <div class="stat-label">Late Days</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{{ remainingHolidays }}</div>
            <div class="stat-label">Holidays Left</div>
          </div>
        </div>

        <!-- Recent Attendance + Holiday Requests -->
        <div class="two-col">
          <div class="card">
            <div class="card-title">📅 Recent Attendance</div>
            <table class="recent-table">
              <thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of recentAtt">
                  <td>{{ formatDate(r.date) }}</td>
                  <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ r.status }}</span></td>
                  <td>{{ r.checkIn }}</td>
                  <td>{{ r.checkOut }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-title">🏖️ My Holiday Requests</div>
            <ng-container *ngIf="myRequests.length; else noReqs">
              <table class="recent-table">
                <thead><tr><th>Period</th><th>Days</th><th>Status</th><th>Approval</th></tr></thead>
                <tbody>
                  <tr *ngFor="let r of myRequests">
                    <td>{{ formatDate(r.startDate) }} – {{ formatDate(r.end_date) }}</td>
                    <td>{{ r.days }}</td>
                    <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ r.status }}</span></td>
                    <td>{{ approvalText(r) }}</td>
                  </tr>
                </tbody>
              </table>
            </ng-container>
            <ng-template #noReqs>
              <div class="empty-state"><span class="emoji">🏖️</span>No requests yet</div>
            </ng-template>
          </div>
        </div>

        <!-- Quick links -->
        <div class="card">
          <div class="card-title">⚡ Quick Actions</div>
          <a class="quick-link" routerLink="/attendance">📋 View Attendance</a>
          <a class="quick-link" routerLink="/holiday-request">✈️ Request Holiday</a>
          <a class="quick-link" routerLink="/profile">👤 My Profile</a>
        </div>
      </ng-container>

      <!-- ─── ADMIN DASHBOARD ─── -->
      <ng-container *ngIf="isAdmin">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-num">{{ totalEmployees }}</div>
            <div class="stat-label">Total Employees</div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-num">{{ pendingCount }}</div>
            <div class="stat-label">Pending Requests</div>
          </div>
          <div class="stat-card green">
            <div class="stat-num">{{ totalEmployees - 1 }}</div>
            <div class="stat-label">Present Today</div>
          </div>
          <div class="stat-card red">
            <div class="stat-num">1</div>
            <div class="stat-label">Absent Today</div>
          </div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-title">👥 All Employees</div>
            <table class="admin-emp">
              <thead><tr><th>Name</th><th>Department</th><th>Status</th></tr></thead>
              <tbody>
                <tr *ngFor="let e of allEmployees; let i = index">
                  <td>{{ e.name }}</td>
                  <td>{{ e.department }}</td>
                  <td>
                    <span class="badge" [ngClass]="i === 2 ? 'badge-absent' : 'badge-present'">
                      {{ i === 2 ? 'Absent' : 'Present' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-title">🏖️ Pending Holiday Requests</div>
            <ng-container *ngIf="pendingRequests.length; else noPending">
              <table class="recent-table">
                <thead><tr><th>Employee</th><th>Dates</th><th>Days</th></tr></thead>
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
              <div class="empty-state"><span class="emoji">🎉</span>No pending requests</div>
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
    public store: DataStoreService
  ) { }

  get isAdmin() { return this.auth.isAdmin; }
  get firstName() { return this.auth.currentUser?.name.split(' ')[0] ?? ''; }
  totalEmployees = 0;
  allEmployees: Employee[] = [];
  pendingCount = 0;

  ngOnInit(): void {
    this.today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    // Refetch on navigation if needed, though signals should keep it synced
    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.store.refresh();
      })
    );
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

  formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

  approvalText(req: HolidayRequest): string {
    console.log(req)
    if (req.managerStatus === 'rejected') return `Rejected by manager (ID: ${req.managerId})`;
    if (req.gmStatus === 'rejected') return `Rejected by general manager (ID: ${req.gmId})`;
    if (req.managerStatus === 'pending') return 'Waiting for manager approval';
    if (req.managerStatus === 'approved' && req.gmStatus === 'pending') return `Approved by manager (ID: ${req.managerId}), waiting for general manager`;
    if (req.managerStatus === 'approved' && req.gmStatus === 'approved') return `Approved by manager (ID: ${req.managerId}) and general manager (ID: ${req.gmId})`;
    return '';
  }

  badgeClass(status: string) {
    const map: Record<string, string> = {
      Present: 'badge-present', Absent: 'badge-absent', Late: 'badge-late',
      Weekend: 'badge-weekend', pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected'
    };
    return map[status] ?? 'badge-pending';
  }
}
