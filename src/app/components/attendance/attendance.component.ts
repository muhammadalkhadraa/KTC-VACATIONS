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
      display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap;
      padding: 40px; background: var(--white); border-radius: var(--radius);
      border: 1px solid var(--glass-border);
      box-shadow: var(--shadow-xl);
      position: relative; overflow: hidden;
    }
    .checkin-box::before {
      content: ""; position: absolute; top: -20px; right: -20px;
      width: 100px; height: 100px; background: var(--accent-soft);
      border-radius: 50%;
    }
    .time-area { display: flex; align-items: center; gap: 20px; }
    .live-time { 
      font-size: 3.5rem; font-weight: 800; color: var(--primary); 
      font-family: 'Outfit', sans-serif; letter-spacing: -0.02em;
    }
    .live-date { font-size: 1rem; color: var(--text-muted); font-weight: 600; }
    
    .btn-checkin {
      padding: 16px 40px; border: none; border-radius: var(--radius-sm);
      font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.1rem;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex; align-items: center; gap: 12px;
      box-shadow: var(--shadow-md);
    }
    .btn-in  { background: linear-gradient(135deg, var(--success), #2d9e6a); color: white; }
    .btn-in:hover  { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(16,185,129,0.3); }
    .btn-out { background: linear-gradient(135deg, var(--warning), #e08c00); color: white; }
    .btn-out:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(245,158,11,0.3); }
    
    .checked-msg { 
      font-weight: 700; color: var(--primary); 
      display: flex; align-items: center; gap: 8px;
      background: var(--sky); padding: 12px 20px; border-radius: var(--radius-sm);
    }

    .filter-row { display: flex; gap: 16px; margin: 32px 0 20px; align-items: center; }
    .filter-lbl { font-weight: 800; color: var(--primary); font-size: .85rem; text-transform: uppercase; letter-spacing: 0.1em; }
    .pill {
      padding: 8px 20px; border-radius: var(--radius-full); border: 1px solid var(--glass-border);
      background: var(--white); color: var(--text-muted); font-family: 'Inter', sans-serif;
      font-weight: 600; font-size: .85rem; cursor: pointer; transition: all 0.2s;
      box-shadow: var(--shadow-sm);
    }
    .pill:hover { border-color: var(--accent); color: var(--primary); }
    .pill.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: var(--shadow-md); }
  `],
  template: `
    <div class="page-wrapper">
      <h1 class="page-title"><i data-lucide="clock-7"></i> {{ 'ATTENDANCE.TITLE' | translate | slice:0:-8 }} <span>{{ 'ATTENDANCE.TRACKER_SPAN' | translate }}</span></h1>

      <!-- Check In / Out Box -->
      <div class="checkin-box">
        <div class="time-area">
          <i data-lucide="watch" style="width: 48px; height: 48px; color: var(--accent);"></i>
          <div>
            <div class="live-time">{{ liveTime }}</div>
            <div class="live-date">{{ dateLabel }}</div>
          </div>
        </div>
        
        <div class="action-area">
          <ng-container [ngSwitch]="status.state">
            <button *ngSwitchCase="'none'" class="btn-checkin btn-in" (click)="checkIn()">
              <i data-lucide="log-in"></i>
              {{ 'ATTENDANCE.BTN_CHECKIN' | translate }}
            </button>
            <div *ngSwitchCase="'in'" style="display: flex; flex-direction: column; gap: 16px; align-items: flex-end;">
              <span class="checked-msg">
                <i data-lucide="check-circle-2" style="color: var(--success);"></i>
                {{ 'ATTENDANCE.CHECKED_IN_AT' | translate:{time: status.checkInTime} }}
              </span>
              <button class="btn-checkin btn-out" (click)="checkOut()">
                <i data-lucide="log-out"></i>
                {{ 'ATTENDANCE.BTN_CHECKOUT' | translate }}
              </button>
            </div>
            <div *ngSwitchCase="'out'" class="checked-msg" style="flex-direction: column; align-items: flex-start;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 1.1rem; color: var(--success); margin-bottom: 4px;">
                <i data-lucide="party-popper"></i>
                {{ 'ATTENDANCE.DONE_MSG' | translate }}
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                <i data-lucide="arrow-right" style="width: 12px;"></i> {{ 'DASHBOARD.COL_IN' | translate }}: <strong>{{ status.checkInTime }}</strong>
                &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                <i data-lucide="arrow-left" style="width: 12px;"></i> {{ 'DASHBOARD.COL_OUT' | translate }}: <strong>{{ status.checkOutTime }}</strong>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-row">
        <span class="filter-lbl"><i data-lucide="filter" style="width: 14px; vertical-align: middle;"></i> {{ 'ATTENDANCE.FILTER' | translate }}</span>
        <button class="pill" [class.active]="filter==='All'"     (click)="filter='All'">{{ 'DASHBOARD.STATUS_PENDING' | translate: {defaultValue: 'All'} }}</button>
        <button class="pill" [class.active]="filter==='Present'" (click)="filter='Present'">{{ 'DASHBOARD.STATUS_PRESENT' | translate }}</button>
        <button class="pill" [class.active]="filter==='Absent'"  (click)="filter='Absent'">{{ 'DASHBOARD.STATUS_ABSENT' | translate }}</button>
        <button class="pill" [class.active]="filter==='Late'"    (click)="filter='Late'">{{ 'DASHBOARD.STATUS_LATE' | translate }}</button>
      </div>

      <!-- History Table -->
      <div class="card">
        <div class="card-title"><i data-lucide="history"></i>{{ 'ATTENDANCE.HISTORY' | translate }}</div>
        <div class="table-container">
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
                <td style="font-weight: 600;">{{ formatDate(r.date) }}</td>
                <td style="color: var(--text-muted);">{{ dayName(r.date) }}</td>
                <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                <td style="font-family: 'Outfit'; font-weight: 600;">{{ r.checkIn }}</td>
                <td style="font-family: 'Outfit'; font-weight: 600;">{{ r.checkOut }}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
