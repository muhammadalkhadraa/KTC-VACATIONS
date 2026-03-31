import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HolidayService } from '../../services/holiday.service';
import { Employee, HolidayRequest } from '../../models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styles: [`
    .profile-header {
      background: linear-gradient(135deg, #2E86AB, #1A5F7A);
      border-radius: 20px; padding: 32px;
      color: white; display: flex; align-items: center; gap: 28px;
      margin-bottom: 24px; flex-wrap: wrap;
    }
    .avatar-big {
      width: 84px; height: 84px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: 3px solid rgba(255,255,255,.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 2.2rem; font-weight: 700; flex-shrink: 0;
    }
    .prof-name { font-size: 1.6rem; font-weight: 700; margin-bottom: 4px; }
    .prof-sub  { opacity: .8; font-size: .9rem; }
    .prof-badge {
      display: inline-block; background: rgba(255,255,255,.2);
      border-radius: 10px; padding: 4px 14px; font-size: .8rem; font-weight: 700; margin-top: 10px;
    }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(170px,1fr)); gap: 14px; }
    .info-item { background: #D6F0FF; border-radius: 14px; padding: 16px; }
    .info-lbl  { font-size: .72rem; color: #8ab4c8; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
    .info-val  { font-size: 1rem; font-weight: 700; color: #1e3a4a; margin-top: 4px; }
    .hol-bar   { background: #D6F0FF; border-radius: 12px; height: 16px; overflow: hidden; margin: 10px 0; }
    .hol-fill  { height: 100%; background: linear-gradient(90deg, #89CFF0, #2E86AB); border-radius: 12px; transition: width .6s; }
    .hol-meta  { display: flex; gap: 24px; margin-top: 12px; }
    .hol-meta span { font-size: .85rem; color: #4a7a92; }
    .hol-meta strong { color: #1e3a4a; }
    .req-table td, .req-table th { font-size: .85rem; }
    .btn-request {
      padding: 11px 24px; background: linear-gradient(135deg,#2E86AB,#1A5F7A);
      color: white; border: none; border-radius: 12px;
      font-family: 'Nunito',sans-serif; font-weight: 700; font-size: .9rem;
      cursor: pointer; text-decoration: none; display: inline-block; transition: .2s;
    }
    .btn-request:hover { transform: translateY(-2px); box-shadow: 0 5px 16px rgba(46,134,171,.4); }
  `],
  template: `
    <div class="page-wrapper" *ngIf="emp">
      <h1 class="page-title">👤 My <span>Profile</span></h1>

      <!-- Header -->
      <div class="profile-header">
        <div class="avatar-big">{{ emp.name.charAt(0) }}</div>
        <div>
          <div class="prof-name">{{ emp.name }}</div>
          <div class="prof-sub">{{ emp.position }} · {{ emp.department }} Department</div>
          <span class="prof-badge">🆔 {{ emp.id }}</span>
        </div>
      </div>

      <!-- Info grid -->
      <div class="card">
        <div class="card-title">📋 Employee Information</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-lbl">Employee ID</div>  <div class="info-val">{{ emp.id }}</div></div>
          <div class="info-item"><div class="info-lbl">Full Name</div>    <div class="info-val">{{ emp.name }}</div></div>
          <div class="info-item"><div class="info-lbl">Department</div>   <div class="info-val">{{ emp.department }}</div></div>
          <div class="info-item"><div class="info-lbl">Position</div>     <div class="info-val">{{ emp.position }}</div></div>
          <div class="info-item"><div class="info-lbl">Joined</div>       <div class="info-val">{{ formatDate(emp.joined) }}</div></div>
          <div class="info-item"><div class="info-lbl">Role</div>         <div class="info-val">{{ emp.role | titlecase }}</div></div>
        </div>
      </div>

      <!-- Holiday balance -->
      <div class="card">
        <div class="card-title">🏖️ Holiday Balance</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-weight:700;color:#1e3a4a">Annual Leave Balance</span>
          <span style="font-size:1.1rem;font-weight:800;color:#1A5F7A">{{ remaining }} / {{ emp.totalHolidays }} days</span>
        </div>
        <div class="hol-bar"><div class="hol-fill" [style.width]="barWidth"></div></div>
        <div class="hol-meta">
          <span>✅ Used: <strong>{{ emp.usedHolidays }}</strong></span>
          <span>🏖️ Remaining: <strong>{{ remaining }}</strong></span>
          <span>📅 Total: <strong>{{ emp.totalHolidays }}</strong></span>
        </div>
        <div style="margin-top:20px;">
          <a class="btn-request" routerLink="/holiday-request">✈️ Request Holiday</a>
        </div>
      </div>

      <!-- Holiday history -->
      <div class="card">
        <div class="card-title">📜 Holiday Request History</div>
        <ng-container *ngIf="requests.length; else noHols">
          <table class="req-table">
            <thead><tr><th>Start</th><th>End</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of requests">
                <td>{{ formatDate(r.startDate) }}</td>
                <td>{{ formatDate(r.endDate) }}</td>
                <td>{{ r.days }}</td>
                <td>{{ r.reason }}</td>
                <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ r.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </ng-container>
        <ng-template #noHols>
          <div class="empty-state"><span class="emoji">📭</span>No holiday requests yet</div>
        </ng-template>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  emp!: Employee;
  requests: HolidayRequest[] = [];

  constructor(private auth: AuthService, private holSvc: HolidayService) {}

  get remaining() { return this.emp.totalHolidays - this.emp.usedHolidays; }
  get barWidth()  { return Math.round((this.remaining / this.emp.totalHolidays) * 100) + '%'; }

  ngOnInit(): void {
    const id = this.auth.currentUser!.id;
    this.auth.getEmployeeById(id).subscribe(emp => {
      this.emp = emp;
    });
    this.holSvc.getForEmployee(id).subscribe(reqs => {
      this.requests = reqs;
    });
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }

  badgeClass(s: string) {
    const m: Record<string,string> = { pending:'badge-pending', approved:'badge-approved', rejected:'badge-rejected' };
    return m[s] ?? '';
  }
}
