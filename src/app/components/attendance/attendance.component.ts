import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { ToastService } from '../../services/toast.service';
import { AttendanceRecord, CheckInStatus } from '../../models/models';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .checkin-box {
      display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
      padding: 20px 24px; background: #D6F0FF; border-radius: 14px; margin-bottom: 24px;
    }
    .live-time { font-size: 2rem; font-weight: 800; color: #1A5F7A; font-family: 'Poppins', sans-serif; }
    .live-date { font-size: .85rem; color: #4a7a92; font-weight: 600; }
    .btn-checkin {
      padding: 12px 28px; border: none; border-radius: 12px;
      font-family: 'Nunito', sans-serif; font-weight: 700; font-size: .95rem;
      cursor: pointer; transition: .2s;
    }
    .btn-in  { background: linear-gradient(135deg,#4CAF82,#2d9e6a); color: white; }
    .btn-in:hover  { transform: translateY(-2px); box-shadow: 0 5px 16px rgba(76,175,130,.4); }
    .btn-out { background: linear-gradient(135deg,#F5A623,#e08c00); color: white; }
    .btn-out:hover { transform: translateY(-2px); box-shadow: 0 5px 16px rgba(245,166,35,.4); }
    .checked-msg { font-weight: 700; color: #4a7a92; }
    .filter-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
    .filter-row span { font-weight: 700; color: #1A5F7A; font-size: .88rem; }
    .pill {
      padding: 6px 16px; border-radius: 20px; border: 2px solid #C5E8FB;
      background: white; color: #4a7a92; font-family: 'Nunito', sans-serif;
      font-weight: 700; font-size: .8rem; cursor: pointer; transition: .2s;
    }
    .pill.active { background: #89CFF0; color: white; border-color: #89CFF0; }
  `],
  template: `
    <div class="page-wrapper">
      <h1 class="page-title">📋 Attendance <span>Tracker</span></h1>

      <!-- Check In / Out Box -->
      <div class="card">
        <div class="card-title">⏰ Today's Attendance</div>
        <div class="checkin-box">
          <div>
            <div class="live-time">{{ liveTime }}</div>
            <div class="live-date">{{ dateLabel }}</div>
          </div>
          <ng-container [ngSwitch]="status.state">
            <button *ngSwitchCase="'none'" class="btn-checkin btn-in" (click)="checkIn()">✅ Check In</button>
            <ng-container *ngSwitchCase="'in'">
              <span class="checked-msg">✅ Checked in at {{ status.checkInTime }}</span>
              <button class="btn-checkin btn-out" (click)="checkOut()">🚪 Check Out</button>
            </ng-container>
            <span *ngSwitchCase="'out'" class="checked-msg">
              ✅ Done for today! &nbsp; In: {{ status.checkInTime }} &nbsp;|&nbsp; Out: {{ status.checkOutTime }}
            </span>
          </ng-container>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-row">
        <span>Filter:</span>
        <button class="pill" [class.active]="filter==='All'"     (click)="filter='All'">All</button>
        <button class="pill" [class.active]="filter==='Present'" (click)="filter='Present'">Present</button>
        <button class="pill" [class.active]="filter==='Absent'"  (click)="filter='Absent'">Absent</button>
        <button class="pill" [class.active]="filter==='Late'"    (click)="filter='Late'">Late</button>
      </div>

      <!-- History Table -->
      <div class="card">
        <div class="card-title">📊 Attendance History (Last 14 Days)</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Day</th><th>Status</th><th>Check In</th><th>Check Out</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filtered">
              <td>{{ formatDate(r.date) }}</td>
              <td>{{ dayName(r.date) }}</td>
              <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ r.status }}</span></td>
              <td>{{ r.checkIn }}</td>
              <td>{{ r.checkOut }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AttendanceComponent implements OnInit, OnDestroy {
  records: AttendanceRecord[] = [];
  status: CheckInStatus = { empId:'', state:'none', checkInTime:'', checkOutTime:'' };
  filter   = 'All';
  liveTime = '';
  dateLabel = '';
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private auth: AuthService,
    private attSvc: AttendanceService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.auth.currentUser!.id;
    this.loadHistory(id);
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
    this.dateLabel = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  }
  ngOnDestroy(): void { clearInterval(this.timer); }

  tick() { this.liveTime = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }

  private loadHistory(empId: string) {
    this.attSvc.getHistory(empId).subscribe(statuses => {
      // sort newest first
      statuses.sort((a,b) => (b.id||0) - (a.id||0));
      this.status = statuses[0] ?? { empId, state:'none', checkInTime:'', checkOutTime:'' };
      this.records = statuses.map(s => this.attSvc.toRecord(s));
    });
  }

  get filtered() {
    return this.filter === 'All' ? this.records : this.records.filter(r => r.status === this.filter);
  }

  checkIn() {
    const id = this.auth.currentUser!.id;
    this.attSvc.postStatus({ empId: id, state: 'in' }).subscribe(s => {
      this.status = s;
      this.loadHistory(id);
      this.toast.show('✅ Checked in successfully!');
    });
  }
  checkOut() {
    const id = this.auth.currentUser!.id;
    this.attSvc.postStatus({ empId: id, state: 'out' }).subscribe(s => {
      this.status = s;
      this.loadHistory(id);
      this.toast.show('👋 Checked out. See you tomorrow!');
    });
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
  dayName(d: string)   { return DAYS[new Date(d).getDay()]; }

  badgeClass(s: string) {
    const m: Record<string,string> = { Present:'badge-present', Absent:'badge-absent', Late:'badge-late', Weekend:'badge-weekend' };
    return m[s] ?? '';
  }
}
