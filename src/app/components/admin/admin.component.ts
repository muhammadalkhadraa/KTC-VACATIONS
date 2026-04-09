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
    .tab-bar { 
      display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; 
      background: var(--accent-soft); padding: 8px; border-radius: var(--radius-sm);
    }
    .tab {
      padding: 12px 24px; border-radius: var(--radius-sm); border: 1px solid transparent;
      background: transparent; color: var(--text-muted); font-family: 'Outfit', sans-serif;
      font-weight: 700; font-size: .95rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex; align-items: center; gap: 10px;
    }
    .tab:hover { color: var(--primary); background: rgba(255,255,255,0.4); }
    .tab.active { background: var(--white); color: var(--primary); border-color: var(--glass-border); box-shadow: var(--shadow-sm); }
    .tab i { width: 18px; }

    .action-btn {
      padding: 8px 16px; border-radius: var(--radius-sm);
      font-family: 'Inter', sans-serif; font-weight: 700; font-size: .8rem;
      cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-approve { background: #ECFDF5; color: #10B981; border-color: #D1FAE5; }
    .btn-approve:hover { background: #10B981; color: white; transform: translateY(-1px); }
    .btn-reject  { background: #FEF2F2; color: #EF4444; border-color: #FEE2E2; }
    .btn-reject:hover  { background: #EF4444; color: white; transform: translateY(-1px); }
    
    .role-badge-top {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: var(--radius-sm);
      font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;
      margin-bottom: 24px; box-shadow: var(--shadow-sm);
    }
    
    .emp-row td:first-child { font-weight: 700; color: var(--primary); }
    
    select {
      background: var(--sky); border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm); padding: 8px 12px;
      font-family: 'Inter'; font-size: 0.85rem; color: var(--text-main); font-weight: 600;
      outline: none; cursor: pointer;
    }
    select:focus { border-color: var(--accent); }

    .btn-toggle-on { background: var(--success); color: white; }
    .btn-toggle-off { background: var(--text-light); color: white; }
    
    .empty-state {
      display: flex; flex-direction: column; align-items: center; padding: 60px; color: var(--text-muted); gap: 16px;
    }
    .empty-state i { font-size: 3rem; color: var(--accent); opacity: 0.4; }
  `],
  template: `
    <div class="page-wrapper">
      <h1 class="page-title"><i data-lucide="settings"></i> {{ 'ADMIN.TITLE' | translate | slice:0:-8 }} <span>{{ 'ADMIN.SPAN' | translate }}</span></h1>

      <!-- Role Badge -->
      <div class="role-badge-top" [ngClass]="{
        'badge-approved': approverRole === 'admin',
        'badge-pending':  approverRole === 'manager',
        'badge-rejected': approverRole === 'employee'
      }">
        <i [attr.data-lucide]="approverRole === 'admin' ? 'shield-check' : 'user-check'"></i>
        {{ approverRole === 'admin' ? ('ADMIN.ACTING_ADMIN' | translate)
         : approverRole === 'manager' ? ('ADMIN.ACTING_MGR' | translate)
         : ('ADMIN.EMP_VIEW' | translate) }}
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="card stat-card yellow"><i data-lucide="clock"></i><div class="stat-num">{{ pending.length }}</div><div class="stat-label">{{ 'ADMIN.STAT_PENDING' | translate }}</div></div>
        <div class="card stat-card green"><i data-lucide="check-circle"></i><div class="stat-num">{{ approved.length }}</div><div class="stat-label">{{ 'ADMIN.STAT_APPROVED' | translate }}</div></div>
        <div class="card stat-card red"><i data-lucide="x-circle"></i><div class="stat-num">{{ rejected.length }}</div><div class="stat-label">{{ 'ADMIN.STAT_REJECTED' | translate }}</div></div>
        <div class="card stat-card" *ngIf="auth.isAdmin"><i data-lucide="users"></i><div class="stat-num">{{ employees.length }}</div><div class="stat-label">{{ 'ADMIN.STAT_TOTAL_EMP' | translate }}</div></div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab" [class.active]="tab==='requests'" (click)="tab='requests'">
          <i data-lucide="palm-tree"></i> {{ 'ADMIN.TAB_REQUESTS' | translate }} <span class="badge badge-pending" style="margin-left:6px;" *ngIf="pending.length">{{ pending.length }}</span>
        </button>
        <button class="tab" [class.active]="tab==='history'" (click)="tab='history'">
          <i data-lucide="scroll"></i> {{ 'ADMIN.TAB_HISTORY' | translate }}
        </button>
        <button class="tab" [class.active]="tab==='attendance'" (click)="tab='attendance'" *ngIf="auth.isAdmin">
          <i data-lucide="clipboard-list"></i> {{ 'ADMIN.TAB_ATTENDANCE' | translate }}
        </button>
        <button class="tab" [class.active]="tab==='employees'" (click)="tab='employees'" *ngIf="auth.isAdmin">
          <i data-lucide="users"></i> {{ 'ADMIN.TAB_USERS' | translate }}
        </button>
        <button class="tab" [class.active]="tab==='roles'" (click)="tab='roles'" *ngIf="auth.isAdmin">
          <i data-lucide="tool"></i> {{ 'ADMIN.TAB_ROLES' | translate }}
        </button>
      </div>

      <!-- ─── Pending Requests Tab ─── -->
      <div *ngIf="tab==='requests'">
        <div class="card">
          <div class="card-title"><i data-lucide="alert-circle"></i>{{ 'ADMIN.PENDING_TITLE' | translate }}</div>
          <ng-container *ngIf="pending.length; else noPending">
            <div class="table-container">
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
                    <td style="font-weight: 700;">{{ r.emp_name }}</td>
                    <td style="color: var(--text-muted); font-size: 0.8rem;">{{ r.empId }}</td>
                    <td>{{ fmt(r.startDate) }} – {{ fmt(r.end_date) }}</td>
                    <td><span class="badge" style="background: var(--sky); color: var(--primary);">{{ r.days }}</span></td>
                    <td class="reason-cell" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ r.reason }}</td>
                    <td>
                      <button class="action-btn btn-approve" (click)="approve(r.requestId)"><i data-lucide="check" style="width:14px;"></i>{{ 'ADMIN.BTN_APPROVE' | translate: {defaultValue: 'Approve'} }}</button>
                      <button class="action-btn btn-reject"  (click)="reject(r.requestId)"><i data-lucide="x" style="width:14px;"></i>{{ 'ADMIN.BTN_REJECT' | translate: {defaultValue: 'Reject'} }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
          <ng-template #noPending>
            <div class="empty-state"><i data-lucide="party-popper"></i><p>{{ 'ADMIN.NO_PENDING' | translate }}</p></div>
          </ng-template>
        </div>
      </div>

      <!-- ─── History Tab ─── -->
      <div *ngIf="tab==='history'" class="card">
        <div class="card-title"><i data-lucide="history"></i>{{ 'ADMIN.HISTORY_TITLE' | translate }}</div>
        <ng-container *ngIf="allRequests.length; else noHistory">
          <div class="table-container">
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
                  <td style="font-weight: 600;">{{ r.emp_name }}</td>
                  <td>{{ fmt(r.startDate) }} – {{ fmt(r.end_date) }}</td>
                  <td>{{ r.days }}</td>
                  <td><span class="badge" [ngClass]="bc(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                  <td style="color: var(--text-muted);">{{ r.submittedAt ? fmt(r.submittedAt.slice(0,10)) : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
        <ng-template #noHistory>
          <div class="empty-state"><i data-lucide="archive"></i><p>{{ 'ADMIN.NO_HISTORY' | translate }}</p></div>
        </ng-template>
      </div>

      <!-- ─── Attendance Tab (Admin only) ─── -->
      <div *ngIf="tab==='attendance' && auth.isAdmin" class="card">
        <div class="card-title"><i data-lucide="clipboard-list"></i> {{ 'ADMIN.TAB_ATTENDANCE' | translate }}</div>
        <div class="table-container">
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
                <td style="color: var(--text-muted);">{{ row.id }}</td>
                <td>{{ row.dept }}</td>
                <td><span class="badge" [ngClass]="'badge-' + row.status.toLowerCase()">{{ getStatusLabel(row.status) }}</span></td>
                <td style="font-family: 'Outfit'; font-weight: 600;">{{ row.in }}</td>
                <td style="font-family: 'Outfit'; font-weight: 600;">{{ row.out }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ─── Roles Tab (Admin only) ─── -->
      <div *ngIf="tab==='roles' && auth.isAdmin" class="card">
        <div class="card-title"><i data-lucide="shield-plus"></i>{{ 'ADMIN.ROLES_TITLE' | translate }}</div>
        <div class="form-group" style="margin-bottom:24px; background: var(--sky); padding: 24px; border-radius: var(--radius-sm);">
          <label for="newRoleName">{{ 'ADMIN.LBL_NEW_ROLE' | translate }}</label>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <input id="newRoleName" name="newRoleName" type="text" [(ngModel)]="newRoleName" placeholder="e.g. supervisor" style="flex:1;" />
            <button class="btn-primary" (click)="createRole()"><i data-lucide="plus"></i>{{ 'ADMIN.BTN_ADD_ROLE' | translate }}</button>
          </div>
        </div>

        <div class="table-container" style="max-width: 600px;">
          <table class="admin-table" *ngIf="roles.length; else noRoles">
            <thead><tr><th>{{ 'PROFILE.ROLE' | translate }}</th><th>{{ 'ADMIN.SPAN' | translate: {defaultValue: 'Action'} }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of roles">
                <td style="font-weight: 700;">{{ r.name }}</td>
                <td>
                  <button class="action-btn btn-reject" (click)="deleteRole(r)"><i data-lucide="trash-2" style="width:14px;"></i> {{ 'ADMIN.BTN_DELETE' | translate }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noRoles>
          <div class="empty-state"><i data-lucide="folder-x"></i><p>{{ 'ADMIN.NO_ROLES' | translate }}</p></div>
        </ng-template>
      </div>

      <!-- ─── Employees Tab (Admin only) ─── -->
      <div *ngIf="tab==='employees' && auth.isAdmin" class="card">
        <div class="card-title"><i data-lucide="users"></i>{{ 'ADMIN.USERS_TITLE' | translate }}</div>
        <div class="table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>{{ 'DASHBOARD.COL_NAME' | translate }}</th>
                <th>ID</th>
                <th>{{ 'DASHBOARD.COL_DEPT' | translate }}</th>
                <th>{{ 'ADMIN.COL_POSITION' | translate: {defaultValue: 'Position'} }}</th>
                <th>{{ 'PROFILE.ROLE' | translate }}</th>
                <th>{{ 'ADMIN.COL_USED' | translate }}</th>
                <th>{{ 'PROFILE.REMAINING' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of employees" class="emp-row">
                <td>{{ e.name }}</td>
                <td style="color: var(--text-muted); font-size: 0.85rem;">{{ e.id }}</td>
                <td>{{ e.department }}</td>
                <td>
                  <select id="userPosition-{{e.id}}" name="userPosition-{{e.id}}" aria-label="Job Position" [ngModel]="e.position" (ngModelChange)="changeUserPosition(e, $event)">
                    <option *ngFor="let pos of jobPositions" [value]="pos">{{ pos }}</option>
                  </select>
                </td>
                <td style="display:flex; gap:12px; align-items:center;">
                  <button class="action-btn" [ngClass]="{ 'btn-toggle-on': e.role === 'admin', 'btn-toggle-off': e.role !== 'admin' }" (click)="toggleAdmin(e)">
                    <i [attr.data-lucide]="e.role === 'admin' ? 'star' : 'user'"></i>
                    {{ e.role === 'admin' ? ('ADMIN.BTN_ADMIN_ON' | translate) : ('ADMIN.BTN_ADMIN_OFF' | translate) }}
                  </button>
                  <select id="userRole-{{e.id}}" name="userRole-{{e.id}}" aria-label="Access Role" [ngModel]="e.role" (ngModelChange)="changeUserRole(e, $event)">
                    <option *ngFor="let r of accessRoles" [value]="r">{{ r }}</option>
                  </select>
                </td>
                <td style="font-weight: 500;">{{ e.usedHolidays }} / {{ e.totalHolidays }}</td>
                <td><strong style="color:var(--primary); font-family:'Outfit'; font-size:1.1rem;">{{ e.totalHolidays - e.usedHolidays }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
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
