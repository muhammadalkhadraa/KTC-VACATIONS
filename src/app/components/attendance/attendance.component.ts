import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { ToastService } from '../../services/toast.service';
import { AttendanceRecord, CheckInStatus } from '../../models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, TranslateModule],
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
      <h1 class="page-title">📋 {{ 'ATTENDANCE.TITLE' | translate | slice:0:-8 }} <span>{{ 'ATTENDANCE.TRACKER_SPAN' | translate }}</span></h1>

      <!-- Check In / Out Box -->
      <div class="card">
        <div class="card-title">{{ 'ATTENDANCE.TODAY' | translate }}</div>
        <div class="checkin-box">
          <div>
            <div class="live-time">{{ liveTime }}</div>
            <div class="live-date">{{ dateLabel }}</div>
          </div>
          <ng-container [ngSwitch]="status.state">
            <button *ngSwitchCase="'none'" class="btn-checkin btn-in" (click)="checkIn()">{{ 'ATTENDANCE.BTN_CHECKIN' | translate }}</button>
            <ng-container *ngSwitchCase="'in'">
              <span class="checked-msg">{{ 'ATTENDANCE.CHECKED_IN_AT' | translate:{time: status.checkInTime} }}</span>
              <button class="btn-checkin btn-out" (click)="checkOut()">{{ 'ATTENDANCE.BTN_CHECKOUT' | translate }}</button>
            </ng-container>
            <span *ngSwitchCase="'out'" class="checked-msg">
              {{ 'ATTENDANCE.DONE_MSG' | translate }} &nbsp; 
              {{ 'DASHBOARD.COL_IN' | translate }}: {{ status.checkInTime }} &nbsp;|&nbsp; 
              {{ 'DASHBOARD.COL_OUT' | translate }}: {{ status.checkOutTime }}
            </span>
          </ng-container>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-row">
        <span>{{ 'ATTENDANCE.FILTER' | translate }}</span>
        <button class="pill" [class.active]="filter==='All'"     (click)="filter='All'">{{ 'DASHBOARD.STATUS_PENDING' | translate: {defaultValue: 'All'} }}</button>
        <button class="pill" [class.active]="filter==='Present'" (click)="filter='Present'">{{ 'DASHBOARD.STATUS_PRESENT' | translate }}</button>
        <button class="pill" [class.active]="filter==='Absent'"  (click)="filter='Absent'">{{ 'DASHBOARD.STATUS_ABSENT' | translate }}</button>
        <button class="pill" [class.active]="filter==='Late'"    (click)="filter='Late'">{{ 'DASHBOARD.STATUS_LATE' | translate }}</button>
      </div>

      <!-- History Table -->
      <div class="card">
        <div class="card-title">{{ 'ATTENDANCE.HISTORY' | translate }}</div>
        <table>
          <thead>
            <tr>
              <th>{{ 'DASHBOARD.COL_DATE' | translate }}</th>
              <th>{{ 'ATTENDANCE.COL_DAY' | translate }}</th>
              <th>{{ 'DASHBOARD.COL_STATUS' | translate }}</th>
              <th>{{ 'DASHBOARD.COL_IN' | translate }}</th>
              <th>{{ 'DASHBOARD.COL_OUT' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filtered">
              <td>{{ formatDate(r.date) }}</td>
              <td>{{ dayName(r.date) }}</td>
              <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ getStatusLabel(r.status) }}</span></td>
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
  private sub = new Subscription();

  constructor(
    private auth: AuthService,
    private attSvc: AttendanceService,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.auth.currentUser!.id;
    this.loadHistory(id);
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
    this.updateDateLabel();
    
    this.sub.add(
      this.translate.onLangChange.subscribe(() => {
        this.updateDateLabel();
      })
    );
  }

  ngOnDestroy(): void { 
    clearInterval(this.timer); 
    this.sub.unsubscribe();
  }

  tick() { 
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    this.liveTime = new Date().toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit', second:'2-digit' }); 
  }

  private updateDateLabel() {
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    this.dateLabel = new Date().toLocaleDateString(locale, { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  }

  private loadHistory(empId: string) {
    this.attSvc.getHistory(empId).subscribe(statuses => {
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
      this.toast.show(this.translate.instant('ATTENDANCE.SUCCESS_IN'));
    });
  }
  checkOut() {
    const id = this.auth.currentUser!.id;
    this.attSvc.postStatus({ empId: id, state: 'out' }).subscribe(s => {
      this.status = s;
      this.loadHistory(id);
      this.toast.show(this.translate.instant('ATTENDANCE.SUCCESS_OUT'));
    });
  }

  formatDate(d: string) { 
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    return new Date(d).toLocaleDateString(locale, { day:'2-digit', month:'short', year:'numeric' }); 
  }

  dayName(d: string) { 
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const key = `ATTENDANCE.DAYS.${days[new Date(d).getDay()]}`;
    return this.translate.instant(key);
  }

  getStatusLabel(status: string) {
    const key = `DASHBOARD.STATUS_${status.toUpperCase()}`;
    return this.translate.instant(key);
  }

  badgeClass(s: string) {
    const m: Record<string,string> = { Present:'badge-present', Absent:'badge-absent', Late:'badge-late', Weekend:'badge-weekend' };
    return m[s] ?? '';
  }
}
