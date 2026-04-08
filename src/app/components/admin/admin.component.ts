import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { HolidayService } from '../../services/holiday.service';
import { RoleService } from '../../services/role.service';
import { ToastService } from '../../services/toast.service';
import { HolidayRequest, Employee, Role } from '../../models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  styles: [`
    .action-btn {
      padding: 6px 14px; border-radius: 8px;
      font-family: 'Nunito',sans-serif; font-weight: 700; font-size: .78rem;
      cursor: pointer; border: none; transition: .2s; margin: 0 3px;
    }
    .btn-approve { background: #E8F8F0; color: #4CAF82; }
    .btn-approve:hover { background: #4CAF82; color: white; }
    .btn-reject  { background: #FDEAEA; color: #E05C6A; }
    .btn-reject:hover  { background: #E05C6A; color: white; }
    .admin-table td, .admin-table th { font-size: .86rem; }
    .tab-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .tab {
      padding: 10px 22px; border-radius: 12px; border: 2px solid #C5E8FB;
      background: white; color: #4a7a92; font-family: 'Nunito',sans-serif;
      font-weight: 700; font-size: .88rem; cursor: pointer; transition: .2s;
    }
    .tab.active { background: #2E86AB; color: white; border-color: #2E86AB; }
    .emp-row td:first-child { font-weight: 700; }
    .reason-cell { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .btn-toggle-on { background: #4CAF82; color: white; }
    .btn-toggle-off { background: #E05C6A; color: white; }
  `],
  template: `
    <div class="page-wrapper">
      <h1 class="page-title">⚙️ {{ 'ADMIN.TITLE' | translate | slice:0:-8 }} <span>{{ 'ADMIN.SPAN' | translate }}</span></h1>

      <!-- Role Badge -->
      <div style="margin-bottom:16px;">
        <span class="badge" [ngClass]="{
          'badge-approved': approverRole === 'admin',
          'badge-pending':  approverRole === 'manager',
          'badge-rejected': approverRole === 'employee'
        }" style="font-size:.88rem; padding:6px 14px;">
          {{ approverRole === 'admin' ? ('ADMIN.ACTING_ADMIN' | translate)
           : approverRole === 'manager' ? ('ADMIN.ACTING_MGR' | translate)
           : ('ADMIN.EMP_VIEW' | translate) }}
        </span>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card yellow"><div class="stat-num">{{ pending.length }}</div><div class="stat-label">{{ 'ADMIN.STAT_PENDING' | translate }}</div></div>
        <div class="stat-card green"><div class="stat-num">{{ approved.length }}</div><div class="stat-label">{{ 'ADMIN.STAT_APPROVED' | translate }}</div></div>
        <div class="stat-card red"><div class="stat-num">{{ rejected.length }}</div><div class="stat-label">{{ 'ADMIN.STAT_REJECTED' | translate }}</div></div>
        <div class="stat-card" *ngIf="auth.isAdmin"><div class="stat-num">{{ employees.length }}</div><div class="stat-label">{{ 'ADMIN.STAT_TOTAL_EMP' | translate }}</div></div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab" [class.active]="tab==='requests'" (click)="tab='requests'">
          🏖️ {{ 'ADMIN.TAB_REQUESTS' | translate }} <span *ngIf="pending.length">({{ pending.length }})</span>
        </button>
        <button class="tab" [class.active]="tab==='history'" (click)="tab='history'">
          📜 {{ 'ADMIN.TAB_HISTORY' | translate }}
        </button>
        <button class="tab" [class.active]="tab==='attendance'" (click)="tab='attendance'" *ngIf="auth.isAdmin">
          📋 {{ 'ADMIN.TAB_ATTENDANCE' | translate }}
        </button>
        <button class="tab" [class.active]="tab==='employees'" (click)="tab='employees'" *ngIf="auth.isAdmin">
          👥 {{ 'ADMIN.TAB_USERS' | translate }}
        </button>
        <button class="tab" [class.active]="tab==='roles'" (click)="tab='roles'" *ngIf="auth.isAdmin">
          🛠️ {{ 'ADMIN.TAB_ROLES' | translate }}
        </button>
      </div>

      <!-- ─── Pending Requests Tab ─── -->
      <div *ngIf="tab==='requests'">
        <div class="card">
          <div class="card-title">{{ 'ADMIN.PENDING_TITLE' | translate }}</div>
          <ng-container *ngIf="pending.length; else noPending">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>{{ 'DASHBOARD.COL_NAME' | translate: {defaultValue: 'Employee'} }}</th>
                  <th>ID</th>
                  <th>{{ 'DASHBOARD.COL_PERIOD' | translate }}</th>
                  <th>{{ 'DASHBOARD.COL_DAYS' | translate }}</th>
                  <th>{{ 'HOLIDAY_REQUEST.REASON' | translate }}</th>
                  <th>{{ 'ADMIN.SPAN' | translate: {defaultValue: 'Action'} }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of pending">
                  <td>{{ r.emp_name }}</td>
                  <td>{{ r.empId }}</td>
                  <td>{{ fmt(r.startDate) }} – {{ fmt(r.end_date) }}</td>
                  <td>{{ r.days }}</td>
                  <td class="reason-cell">{{ r.reason }}</td>
                  <td>
                    <button class="action-btn btn-approve" (click)="approve(r.requestId)">{{ 'ADMIN.BTN_APPROVE' | translate: {defaultValue: '✅ Approve'} }}</button>
                    <button class="action-btn btn-reject"  (click)="reject(r.requestId)">{{ 'ADMIN.BTN_REJECT' | translate: {defaultValue: '❌ Reject'} }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </ng-container>
          <ng-template #noPending>
            <div class="empty-state"><span class="emoji">🎉</span>{{ 'ADMIN.NO_PENDING' | translate }}</div>
          </ng-template>
        </div>
      </div>

      <!-- ─── History Tab ─── -->
      <div *ngIf="tab==='history'" class="card">
        <div class="card-title">{{ 'ADMIN.HISTORY_TITLE' | translate }}</div>
        <ng-container *ngIf="allRequests.length; else noHistory">
          <table class="admin-table">
            <thead>
              <tr>
                <th>{{ 'DASHBOARD.COL_NAME' | translate: {defaultValue: 'Employee'} }}</th>
                <th>{{ 'DASHBOARD.COL_PERIOD' | translate }}</th>
                <th>{{ 'DASHBOARD.COL_DAYS' | translate }}</th>
                <th>{{ 'DASHBOARD.COL_STATUS' | translate }}</th>
                <th>{{ 'ADMIN.COL_SUBMITTED' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of allRequests">
                <td>{{ r.emp_name }}</td>
                <td>{{ fmt(r.startDate) }} – {{ fmt(r.end_date) }}</td>
                <td>{{ r.days }}</td>
                <td><span class="badge" [ngClass]="bc(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                <td>{{ r.submittedAt ? fmt(r.submittedAt.slice(0,10)) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </ng-container>
        <ng-template #noHistory>
          <div class="empty-state"><span class="emoji">📭</span>{{ 'ADMIN.NO_HISTORY' | translate }}</div>
        </ng-template>
      </div>

      <!-- ─── Attendance Tab (Admin only) ─── -->
      <div *ngIf="tab==='attendance' && auth.isAdmin" class="card">
        <div class="card-title">📋 {{ 'ADMIN.TAB_ATTENDANCE' | translate }}</div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ 'DASHBOARD.COL_NAME' | translate }}</th>
              <th>ID</th>
              <th>{{ 'DASHBOARD.COL_DEPT' | translate }}</th>
              <th>{{ 'DASHBOARD.COL_STATUS' | translate }}</th>
              <th>{{ 'DASHBOARD.COL_IN' | translate }}</th>
              <th>{{ 'DASHBOARD.COL_OUT' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of todayAttendance" class="emp-row">
              <td>{{ row.name }}</td>
              <td>{{ row.id }}</td>
              <td>{{ row.dept }}</td>
              <td><span class="badge" [ngClass]="'badge-' + row.status.toLowerCase()">{{ getStatusLabel(row.status) }}</span></td>
              <td>{{ row.in }}</td>
              <td>{{ row.out }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── Roles Tab (Admin only) ─── -->
      <div *ngIf="tab==='roles' && auth.isAdmin" class="card">
        <div class="card-title">{{ 'ADMIN.ROLES_TITLE' | translate }}</div>
        <div class="form-group" style="margin-bottom:16px;">
          <label for="newRoleName">{{ 'ADMIN.LBL_NEW_ROLE' | translate }}</label>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <input id="newRoleName" name="newRoleName" type="text" [(ngModel)]="newRoleName" placeholder="e.g. supervisor" style="flex:1;" />
            <button class="btn-primary" (click)="createRole()">{{ 'ADMIN.BTN_ADD_ROLE' | translate }}</button>
          </div>
        </div>

        <table class="admin-table" *ngIf="roles.length; else noRoles">
          <thead><tr><th>{{ 'PROFILE.ROLE' | translate }}</th><th>{{ 'ADMIN.SPAN' | translate: {defaultValue: 'Action'} }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of roles">
              <td>{{ r.name }}</td>
              <td>
                <button class="action-btn btn-reject" (click)="deleteRole(r)">🗑️ {{ 'ADMIN.BTN_DELETE' | translate }}</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noRoles>
          <div class="empty-state"><span class="emoji">📦</span>{{ 'ADMIN.NO_ROLES' | translate }}</div>
        </ng-template>
      </div>

      <!-- ─── Employees Tab (Admin only) ─── -->
      <div *ngIf="tab==='employees' && auth.isAdmin" class="card">
        <div class="card-title">{{ 'ADMIN.USERS_TITLE' | translate }}</div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ 'DASHBOARD.COL_NAME' | translate }}</th>
              <th>ID</th>
              <th>{{ 'DASHBOARD.COL_DEPT' | translate }}</th>
              <th>{{ 'ADMIN.USERS_TITLE' | translate | slice:0:1 }} {{ 'ADMIN.COL_POSITION' | translate: {defaultValue: 'Position'} }}</th>
              <th>{{ 'PROFILE.ROLE' | translate }}</th>
              <th>{{ 'ADMIN.COL_USED' | translate }}</th>
              <th>{{ 'PROFILE.REMAINING' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of employees" class="emp-row">
              <td>{{ e.name }}</td>
              <td>{{ e.id }}</td>
              <td>{{ e.department }}</td>
              <td>
                <select id="userPosition-{{e.id}}" name="userPosition-{{e.id}}" aria-label="Job Position" [ngModel]="e.position" (ngModelChange)="changeUserPosition(e, $event)">
                  <option *ngFor="let pos of jobPositions" [value]="pos">{{ pos }}</option>
                </select>
              </td>
              <td style="display:flex; gap:8px; align-items:center;">
                <button class="action-btn" [ngClass]="{ 'btn-toggle-on': e.role === 'admin', 'btn-toggle-off': e.role !== 'admin' }" (click)="toggleAdmin(e)">
                  {{ e.role === 'admin' ? ('ADMIN.BTN_ADMIN_ON' | translate) : ('ADMIN.BTN_ADMIN_OFF' | translate) }}
                </button>
                <select id="userRole-{{e.id}}" name="userRole-{{e.id}}" aria-label="Access Role" [ngModel]="e.role" (ngModelChange)="changeUserRole(e, $event)">
                  <option *ngFor="let r of accessRoles" [value]="r">{{ r }}</option>
                </select>
              </td>
              <td>{{ e.usedHolidays }} / {{ e.totalHolidays }}</td>
              <td><strong style="color:#1A5F7A">{{ e.totalHolidays - e.usedHolidays }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit, OnDestroy {
  tab = 'requests';
  employees: Employee[] = [];
  roles: Role[] = [];
  accessRoles = ['employee', 'manager', 'general manager', 'admin'];
  jobPositions = ['employee', 'manager', 'general manager'];
  newRoleName = '';
  allRequests: HolidayRequest[] = [];
  pending: HolidayRequest[] = [];
  approved: HolidayRequest[] = [];
  rejected: HolidayRequest[] = [];
  todayAttendance: any[] = [];
  approverRole = 'employee';
  private sub = new Subscription();

  constructor(
    public auth: AuthService,
    private attSvc: AttendanceService,
    private holSvc: HolidayService,
    private roleSvc: RoleService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.approverRole = this.getApproverRole();

    // Only load employee list and attendance for admins
    if (this.auth.isAdmin) {
      this.auth.getAllEmployees().subscribe(list => {
        this.employees = list;
        this.attSvc.getToday().subscribe(statuses => {
          const map = new Map(statuses.map(s => [s.empId, s]));
          this.todayAttendance = this.employees.map(e => {
            const stat = map.get(e.id);
            return {
              name: e.name, id: e.id, dept: e.department,
              status: stat?.state === 'out' ? 'Present' : stat?.state === 'in' ? 'Present' : 'Absent',
              in: stat?.checkInTime ?? '—',
              out: stat?.checkOutTime ?? '—'
            };
          });
        });
      });
      this.roleSvc.getAll().subscribe(roles => { this.roles = roles; });
    }

    this.holSvc.getPending(this.approverRole).subscribe(reqs => {
      this.pending = reqs;
      this.cdr.detectChanges();
    });
    this.holSvc.getAll().subscribe(reqs => {
      this.allRequests = reqs;
      this.approved = reqs.filter(r => r.status === 'approved');
      this.rejected = reqs.filter(r => r.status === 'rejected');
      this.cdr.detectChanges();
    });

    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.ngOnInit();
      })
    );
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  approve(id: number): void {
    const { id: approverId } = this.auth.currentUser!;
    const approverRole = this.getApproverRole();
    this.holSvc.approve(id, approverId, approverRole).subscribe({
      next: (updatedReq) => {
        this.toast.show(this.translate.instant('ADMIN.MSG_REQ_APPROVED'));
        if (updatedReq.status === 'approved') {
          this.auth.addUsedHolidays(updatedReq.empId, updatedReq.days).subscribe();
        }
        this.refreshRequests();
      },
      error: err => {
        console.error('Approve failed', err);
        const msg = err?.error ? err.error : (err?.message ?? 'Unknown error');
        this.toast.show(`${this.translate.instant('DASHBOARD.MSG_ERROR')}. ${msg}`, 'error');
      }
    });
  }
  reject(id: number): void {
    const { id: approverId } = this.auth.currentUser!;
    const approverRole = this.getApproverRole();
    this.holSvc.reject(id, approverId, approverRole).subscribe({
      next: () => {
        this.toast.show(this.translate.instant('ADMIN.MSG_REQ_REJECTED'), 'error');
        this.refreshRequests();
      },
      error: err => {
        console.error('Reject failed', err);
        const msg = err?.error ? err.error : (err?.message ?? 'Unknown error');
        this.toast.show(`${this.translate.instant('DASHBOARD.MSG_ERROR')}. ${msg}`, 'error');
      }
    });
  }

  createRole(): void {
    const name = this.newRoleName.trim();
    if (!name) {
      this.toast.show(this.translate.instant('ADMIN.MSG_ROLE_REQ'), 'error');
      return;
    }

    this.roleSvc.create(name).subscribe({
      next: role => {
        this.roles = [...this.roles, role];
        this.newRoleName = '';
        this.toast.show(this.translate.instant('ADMIN.MSG_ROLE_CREATED', { name: role.name }));
      },
      error: () => this.toast.show(this.translate.instant('DASHBOARD.MSG_ERROR'), 'error')
    });
  }

  deleteRole(role: Role): void {
    this.roleSvc.delete(role.id).subscribe({
      next: () => {
        this.roles = this.roles.filter(r => r.id !== role.id);
        this.toast.show(this.translate.instant('ADMIN.MSG_ROLE_DELETED', { name: role.name }));
      },
      error: () => this.toast.show(this.translate.instant('DASHBOARD.MSG_ERROR'), 'error')
    });
  }

  changeUserRole(emp: Employee, newRole: string): void {
    if (emp.role === newRole) return;

    this.auth.updateUserRole(emp.id, newRole).subscribe({
      next: updated => {
        emp.role = updated.role;
        this.toast.show(this.translate.instant('ADMIN.MSG_UPDATE_SUCCESS', { type: 'Role', name: emp.name }));
      },
      error: () => {
        this.toast.show(this.translate.instant('DASHBOARD.MSG_ERROR'), 'error');
      }
    });
  }

  changeUserPosition(emp: Employee, newPosition: string): void {
    if (emp.position === newPosition) return;

    this.auth.updateUserPosition(emp.id, newPosition).subscribe({
      next: updated => {
        emp.position = updated.position;
        this.toast.show(this.translate.instant('ADMIN.MSG_UPDATE_SUCCESS', { type: 'Position', name: emp.name }));
      },
      error: () => {
        this.toast.show(this.translate.instant('DASHBOARD.MSG_ERROR'), 'error');
      }
    });
  }

  toggleAdmin(emp: Employee): void {
    const newRole = emp.role === 'admin' ? 'employee' : 'admin';
    this.changeUserRole(emp, newRole);
  }

  private refreshRequests() {
    this.holSvc.getPending(this.approverRole).subscribe(reqs => {
      this.pending = reqs;
    });
    this.holSvc.getAll().subscribe(reqs => {
      this.allRequests = reqs;
      this.approved = reqs.filter(r => r.status === 'approved');
      this.rejected = reqs.filter(r => r.status === 'rejected');
    });
  }

  private getApproverRole(): string {
    const position = (this.auth.currentUser?.position ?? '').toLowerCase();
    if (this.auth.isAdmin || position === 'general manager') {
      return 'admin';
    } else if (position === 'manager') {
      return 'manager';
    }
    return 'employee';
  }

  fmt(d: string) {
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }
  
  getStatusLabel(status: string) {
    const key = `DASHBOARD.STATUS_${status.toUpperCase()}`;
    return this.translate.instant(key);
  }

  bc(s: string) { return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[s] ?? ''; }
}
