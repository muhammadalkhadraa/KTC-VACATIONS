import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { HolidayService } from '../../services/holiday.service';
import { RoleService } from '../../services/role.service';
import { ToastService } from '../../services/toast.service';
import { HolidayRequest, Employee, AttendanceRecord, Role } from '../../models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      <h1 class="page-title">⚙️ Admin <span>Panel</span></h1>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-num">{{ employees.length }}</div><div class="stat-label">Total Employees</div></div>
        <div class="stat-card yellow"><div class="stat-num">{{ pending.length }}</div><div class="stat-label">Pending Requests</div></div>
        <div class="stat-card green"><div class="stat-num">{{ employees.length - 1 }}</div><div class="stat-label">Present Today</div></div>
        <div class="stat-card red"><div class="stat-num">1</div><div class="stat-label">Absent Today</div></div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab" [class.active]="tab==='requests'" (click)="tab='requests'">
          🏖️ Holiday Requests <span *ngIf="pending.length">({{ pending.length }} pending)</span>
        </button>
        <button class="tab" [class.active]="tab==='attendance'" (click)="tab='attendance'">
          📋 Today's Attendance
        </button>
        <button class="tab" [class.active]="tab==='employees'" (click)="tab='employees'">
          👥 Users
        </button>
        <button class="tab" [class.active]="tab==='roles'" (click)="tab='roles'">
          🛠️ Roles
        </button>
      </div>

      <!-- ─── Holiday Requests Tab ─── -->
      <div *ngIf="tab==='requests'">
        <div class="card">
          <div class="card-title">🟡 Pending Requests</div>
          <ng-container *ngIf="pending.length; else noPending">
            <table class="admin-table">
              <thead><tr><th>Employee</th><th>ID</th><th>Period</th><th>Days</th><th>Reason</th><th>Action</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of pending">
                  <td>{{ r.empName }}</td>
                  <td>{{ r.empId }}</td>
                  <td>{{ fmt(r.startDate) }} – {{ fmt(r.endDate) }}</td>
                  <td>{{ r.days }}</td>
                  <td class="reason-cell">{{ r.reason }}</td>
                  <td>
                    <button class="action-btn btn-approve" (click)="approve(r.requestId)">✅ Approve</button>
                    <button class="action-btn btn-reject"  (click)="reject(r.requestId)">❌ Reject</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </ng-container>
          <ng-template #noPending>
            <div class="empty-state"><span class="emoji">🎉</span>All requests have been handled!</div>
          </ng-template>
        </div>

        <div class="card">
          <div class="card-title">📜 All Requests History</div>
          <table class="admin-table">
            <thead><tr><th>Employee</th><th>Period</th><th>Days</th><th>Status</th><th>Submitted</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of allRequests">
                <td>{{ r.empName }}</td>
                <td>{{ fmt(r.startDate) }} – {{ fmt(r.endDate) }}</td>
                <td>{{ r.days }}</td>
                <td><span class="badge" [ngClass]="bc(r.status)">{{ r.status }}</span></td>
                <td>{{ fmt(r.submittedAt.slice(0,10)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ─── Attendance Tab ─── -->
      <div *ngIf="tab==='attendance'" class="card">
        <div class="card-title">📋 All Employees – Today's Attendance</div>
        <table class="admin-table">
          <thead><tr><th>Name</th><th>ID</th><th>Department</th><th>Status</th><th>Check In</th><th>Check Out</th></tr></thead>
          <tbody>
            <tr *ngFor="let row of todayAttendance" class="emp-row">
              <td>{{ row.name }}</td>
              <td>{{ row.id }}</td>
              <td>{{ row.dept }}</td>
              <td><span class="badge" [ngClass]="'badge-' + row.status.toLowerCase()">{{ row.status }}</span></td>
              <td>{{ row.in }}</td>
              <td>{{ row.out }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── Roles Tab ─── -->
      <div *ngIf="tab==='roles'" class="card">
        <div class="card-title">🛠️ Manage Roles</div>
        <div class="form-group" style="margin-bottom:16px;">
          <label for="newRoleName">New role</label>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <input id="newRoleName" name="newRoleName" type="text" [(ngModel)]="newRoleName" placeholder="e.g. supervisor" style="flex:1;" />
            <button class="btn-primary" (click)="createRole()">Add role</button>
          </div>
        </div>

        <table class="admin-table" *ngIf="roles.length; else noRoles">
          <thead><tr><th>Role</th><th>Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of roles">
              <td>{{ r.name }}</td>
              <td>
                <button class="action-btn btn-reject" (click)="deleteRole(r)">🗑️ Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noRoles>
          <div class="empty-state"><span class="emoji">📦</span>No roles defined yet</div>
        </ng-template>
      </div>

      <!-- ─── Employees Tab ─── -->
      <div *ngIf="tab==='employees'" class="card">
        <div class="card-title">👥 User Directory</div>
        <table class="admin-table">
          <thead><tr><th>Name</th><th>ID</th><th>Department</th><th>Position</th><th>Role</th><th>Holidays Used</th><th>Remaining</th></tr></thead>
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
                  {{ e.role === 'admin' ? 'Admin ✅' : 'Make Admin' }}
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
export class AdminComponent implements OnInit {
  tab = 'requests';
  employees: Employee[]     = [];
  roles: Role[]             = [];
  accessRoles = ['employee', 'admin'];
  jobPositions = ['employee', 'manager', 'general manager'];
  newRoleName = '';
  allRequests: HolidayRequest[] = [];
  pending: HolidayRequest[] = [];
  todayAttendance: any[]    = [];

  constructor(
    public auth:   AuthService,
    private attSvc: AttendanceService,
    private holSvc: HolidayService,
    private roleSvc: RoleService,
    private toast:  ToastService,
    private cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // load employees and then today's attendance
    this.auth.getAllEmployees().subscribe(list => {
      // show all users, including admins, so admins can be demoted/changed
      this.employees = list;
      // once we have employee ids, fetch today's statuses
      this.attSvc.getToday().subscribe(statuses => {
        // map by empId for quick lookup
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

    const pendingRole = this.getApproverRole();

    this.holSvc.getPending(pendingRole).subscribe(reqs => {
      this.pending = reqs;
      this.allRequests = reqs;
      this.cdr.detectChanges();
    });
    this.holSvc.getAll().subscribe(reqs => {
      this.allRequests = reqs;
      this.cdr.detectChanges();
    });

    // load roles list for the new Roles tab
    this.roleSvc.getAll().subscribe(roles => {
      this.roles = roles;
    });
  }

  approve(id: number): void {
    const { id: approverId } = this.auth.currentUser!;
    const approverRole = this.getApproverRole();
    this.holSvc.approve(id, approverId, approverRole).subscribe({
      next: () => {
        this.toast.show('✅ Request approved!');
        this.refreshRequests();
      },
      error: err => {
        console.error('Approve failed', err);
        const msg = err?.error ? err.error : (err?.message ?? 'Unknown error');
        this.toast.show(`❌ Could not approve request. ${msg}`, 'error');
      }
    });
  }
  reject(id: number): void {
    const { id: approverId } = this.auth.currentUser!;
    const approverRole = this.getApproverRole();
    this.holSvc.reject(id, approverId, approverRole).subscribe({
      next: () => {
        this.toast.show('❌ Request rejected.');
        this.refreshRequests();
      },
      error: err => {
        console.error('Reject failed', err);
        const msg = err?.error ? err.error : (err?.message ?? 'Unknown error');
        this.toast.show(`❌ Could not reject request. ${msg}`, 'error');
      }
    });
  }

  createRole(): void {
    const name = this.newRoleName.trim();
    if (!name) {
      this.toast.show('⚠️ Role name is required', 'error');
      return;
    }

    this.roleSvc.create(name).subscribe({
      next: role => {
        this.roles = [...this.roles, role];
        this.newRoleName = '';
        this.toast.show(`✅ Role "${role.name}" created`);
      },
      error: () => this.toast.show('❌ Failed to create role', 'error')
    });
  }

  deleteRole(role: Role): void {
    this.roleSvc.delete(role.id).subscribe({
      next: () => {
        this.roles = this.roles.filter(r => r.id !== role.id);
        this.toast.show(`✅ Role "${role.name}" deleted`);
      },
      error: () => this.toast.show('❌ Failed to delete role (it might be in use)', 'error')
    });
  }

  changeUserRole(emp: Employee, newRole: string): void {
    if (emp.role === newRole) return;

    this.auth.updateUserRole(emp.id, newRole).subscribe({
      next: updated => {
        emp.role = updated.role;
        this.toast.show(`✅ Role updated for ${emp.name}`);
      },
      error: () => {
        this.toast.show('❌ Failed to update role', 'error');
      }
    });
  }

  changeUserPosition(emp: Employee, newPosition: string): void {
    if (emp.position === newPosition) return;

    this.auth.updateUserPosition(emp.id, newPosition).subscribe({
      next: updated => {
        emp.position = updated.position;
        this.toast.show(`✅ Position updated for ${emp.name}`);
      },
      error: () => {
        this.toast.show('❌ Failed to update position', 'error');
      }
    });
  }

  toggleAdmin(emp: Employee): void {
    const newRole = emp.role === 'admin' ? 'employee' : 'admin';
    this.changeUserRole(emp, newRole);
  }

  private refreshRequests() {
    const pendingRole = this.getApproverRole();

    this.holSvc.getPending(pendingRole).subscribe(reqs => {
      this.pending = reqs;
      // keep the history view in sync; pending are part of history
      this.allRequests = [...reqs, ...this.allRequests.filter(r => r.status !== 'pending')];
    });
    this.holSvc.getAll().subscribe(reqs => {
      this.allRequests = reqs;
    });
  }

  private getApproverRole(): string {
    // If the user is an admin, they act as the "general manager" level for approvals.
    // Otherwise, we check their specific position.
    const position = (this.auth.currentUser?.position ?? '').toLowerCase();
    const role = (this.auth.currentUser?.role ?? '').toLowerCase();

    if (role === 'admin' || position === 'general manager') {
        return 'admin';
    } else if (position === 'manager') {
        return 'manager';
    }
    return 'employee';
  }

  fmt(d: string)  { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
  bc(s: string)   { return { pending:'badge-pending', approved:'badge-approved', rejected:'badge-rejected' }[s] ?? ''; }
}
