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
      display: flex; align-items: center; justify-content: space-between; gap: 40px; flex-wrap: wrap;
      padding: 48px; background: var(--bg-surface); border-radius: var(--radius);
      border: 1px solid var(--glass-border);
      box-shadow: var(--shadow-xl);
      position: relative; overflow: hidden;
    }
    .checkin-box::before {
      content: ""; position: absolute; top: -50px; right: -50px;
      width: 200px; height: 200px; background: radial-gradient(circle, rgba(0, 163, 255, 0.05) 0%, transparent 70%);
      border-radius: 50%;
    }
    .time-area { display: flex; align-items: center; gap: 32px; }
    .live-time { 
      font-size: 4rem; font-weight: 800; color: var(--primary); 
      font-family: 'Outfit', sans-serif; letter-spacing: -0.02em;
      line-height: 1; margin-bottom: 8px;
    }
    .live-date { font-size: 1.1rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    
    .btn-checkin {
      padding: 16px 40px; border: none; border-radius: var(--radius-sm);
      font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.1rem;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex; align-items: center; gap: 12px;
    }
    .btn-in  { background: var(--success); color: white; box-shadow: 0 0 20px rgba(52, 211, 153, 0.2); }
    .btn-in:hover  { transform: translateY(-4px); box-shadow: 0 0 30px rgba(52, 211, 153, 0.4); }
    .btn-out { background: var(--warning); color: white; box-shadow: 0 0 20px rgba(251, 191, 36, 0.2); }
    .btn-out:hover { transform: translateY(-4px); box-shadow: 0 0 30px rgba(251, 191, 36, 0.4); }
    
    .checked-msg { 
      font-weight: 700; color: var(--text-main); 
      display: flex; align-items: center; gap: 12px;
      background: rgba(255, 255, 255, 0.03); padding: 16px 24px; border-radius: var(--radius-sm);
      border: 1px solid var(--glass-border);
    }

    .filter-row { display: flex; gap: 12px; margin: 40px 0 24px; align-items: center; }
    .filter-lbl { font-weight: 800; color: var(--text-dim); font-size: .8rem; text-transform: uppercase; letter-spacing: 0.1em; margin-right: 8px; }
    .pill {
      padding: 8px 18px; border-radius: 8px; border: 1px solid var(--glass-border);
      background: var(--bg-surface); color: var(--text-muted); font-family: 'Inter', sans-serif;
      font-weight: 700; font-size: .85rem; cursor: pointer; transition: all 0.2s;
    }
    .pill:hover { border-color: rgba(255, 255, 255, 0.2); color: var(--text-main); }
    .pill.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 0 15px rgba(0, 163, 255, 0.3); }
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
