import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { ToastService } from '../../services/toast.service';
import { AttendanceRecord, CheckInStatus } from '../../models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  styles: [`
    /* ── Clock Panel ─────────────────────────────────────────── */
    .clock-panel {
      background: var(--bg-surface);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius);
      padding: 40px 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-xl);
      transition: border-color 0.7s ease, box-shadow 0.7s ease;
    }
    .clock-panel::before {
      content: '';
      position: absolute;
      top: -70px; right: -70px;
      width: 240px; height: 240px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0,163,255,0.07) 0%, transparent 70%);
      transition: background 0.7s ease;
      pointer-events: none;
    }
    .clock-panel.st-early  { border-color: rgba(52,211,153,0.35);  box-shadow: 0 0 50px rgba(52,211,153,0.09); }
    .clock-panel.st-early::before  { background: radial-gradient(circle, rgba(52,211,153,0.09) 0%, transparent 70%); }
    .clock-panel.st-ontime { border-color: rgba(52,211,153,0.35);  box-shadow: 0 0 50px rgba(52,211,153,0.11); }
    .clock-panel.st-ontime::before { background: radial-gradient(circle, rgba(52,211,153,0.09) 0%, transparent 70%); }
    .clock-panel.st-late   { border-color: rgba(251,146,60,0.35);   box-shadow: 0 0 50px rgba(251,146,60,0.09); }
    .clock-panel.st-late::before   { background: radial-gradient(circle, rgba(251,146,60,0.09) 0%, transparent 70%); }

    /* ── Clock Display ───────────────────────────────────────── */
    .clock-date {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-align: center;
    }
    .clock-display {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .clock-digits {
      font-size: clamp(3.2rem, 7vw, 5.5rem);
      font-weight: 800;
      font-family: 'Outfit', monospace;
      letter-spacing: 0.04em;
      line-height: 1;
      color: var(--primary);
      text-shadow: 0 0 40px rgba(0,163,255,0.18);
      transition: color 0.7s ease, text-shadow 0.7s ease;
    }
    .clock-digits.col-early  { color: #34d399; text-shadow: 0 0 40px rgba(52,211,153,0.25); }
    .clock-digits.col-ontime { color: #34d399; text-shadow: 0 0 40px rgba(52,211,153,0.25); }
    .clock-digits.col-late   { color: #fb923c; text-shadow: 0 0 40px rgba(251,146,60,0.25); }

    .live-dot {
      width: 13px; height: 13px;
      background: var(--primary);
      border-radius: 50%;
      flex-shrink: 0;
      animation: livePulse 1.3s ease-in-out infinite;
    }
    @keyframes livePulse {
      0%,100% { opacity: 1; transform: scale(1);    box-shadow: 0 0 0 0   rgba(0,163,255,0.45); }
      50%      { opacity: 0.5; transform: scale(0.8); box-shadow: 0 0 0 7px rgba(0,163,255,0); }
    }
    .lock-icon {
      width: 30px; height: 30px; flex-shrink: 0; opacity: 0.65;
      transition: color 0.5s;
    }
    .lock-icon.col-early  { color: #34d399; }
    .lock-icon.col-ontime { color: #34d399; }
    .lock-icon.col-late   { color: #fb923c; }

    /* ── Arrival Badge ───────────────────────────────────────── */
    .arrival-section {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      animation: popIn 0.45s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes popIn {
      from { opacity: 0; transform: translateY(-12px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)      scale(1); }
    }
    .arrival-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 22px; border-radius: 999px;
      font-weight: 700; font-size: 0.82rem; letter-spacing: 0.13em; text-transform: uppercase;
    }
    .ab-early  { background: rgba(52,211,153,0.14); color: #34d399; border: 1px solid rgba(52,211,153,0.35); }
    .ab-ontime { background: rgba(52,211,153,0.14); color: #34d399; border: 1px solid rgba(52,211,153,0.35); }
    .ab-late   { background: rgba(251,146,60,0.14);  color: #fb923c; border: 1px solid rgba(251,146,60,0.35); }
    .arrival-sub { font-size: 0.75rem; color: var(--text-dim); }

    /* ── Action Area ─────────────────────────────────────────── */
    .action-area {
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      width: 100%; max-width: 340px;
    }
    .btn-checkin {
      width: 100%; padding: 15px 36px; border: none; border-radius: var(--radius-sm);
      font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.05rem;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
      display: flex; align-items: center; justify-content: center; gap: 12px;
    }
    .btn-in  { background: var(--success); color: #fff; box-shadow: 0 0 24px rgba(52,211,153,0.3); }
    .btn-in:hover  { transform: translateY(-3px); box-shadow: 0 0 40px rgba(52,211,153,0.5); }
    .btn-out { background: var(--warning); color: #fff; box-shadow: 0 0 24px rgba(251,191,36,0.3); }
    .btn-out:hover { transform: translateY(-3px); box-shadow: 0 0 40px rgba(251,191,36,0.5); }

    .checked-msg {
      font-weight: 600; font-size: 0.9rem; color: var(--text-main);
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.03); padding: 12px 18px;
      border-radius: var(--radius-sm); border: 1px solid var(--glass-border);
      text-align: center;
    }
    .done-summary { text-align: center; }
    .done-title {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      font-size: 1.1rem; font-weight: 700; color: var(--success); margin-bottom: 10px;
    }
    .done-times {
      display: flex; gap: 16px; justify-content: center;
      font-size: 0.85rem; color: var(--text-muted);
    }
    .done-times strong { color: var(--text-main); font-family: 'Outfit'; }

    /* ── Month Navigator ─────────────────────────────────────── */
    .month-nav { display: flex; flex-direction: column; gap: 14px; margin: 40px 0 20px; }
    .month-nav-top { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .nav-label {
      font-weight: 800; color: var(--text-dim);
      font-size: 0.77rem; text-transform: uppercase; letter-spacing: 0.1em;
      display: flex; align-items: center; gap: 6px;
    }
    .year-select {
      padding: 7px 14px; background: var(--bg-surface);
      border: 1px solid var(--glass-border); border-radius: 8px;
      color: var(--text-main); font-family: 'Inter', sans-serif;
      font-weight: 700; font-size: 0.88rem; cursor: pointer; outline: none;
      transition: border-color 0.2s;
    }
    .year-select:focus { border-color: var(--primary); }
    .month-pills { display: flex; gap: 7px; flex-wrap: wrap; }
    .m-pill {
      padding: 7px 13px; border-radius: 8px; border: 1px solid var(--glass-border);
      background: var(--bg-surface); color: var(--text-muted);
      font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.8rem;
      cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .m-pill:hover { border-color: rgba(255,255,255,0.22); color: var(--text-main); }
    .m-pill.active { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 0 15px rgba(0,163,255,0.3); }

    /* ── Filter Row ──────────────────────────────────────────── */
    .filter-row { display: flex; gap: 9px; margin-bottom: 22px; align-items: center; flex-wrap: wrap; }
    .filter-lbl {
      font-weight: 800; color: var(--text-dim);
      font-size: 0.77rem; text-transform: uppercase; letter-spacing: 0.1em;
      display: flex; align-items: center; gap: 5px;
    }
    .pill {
      padding: 7px 15px; border-radius: 8px; border: 1px solid var(--glass-border);
      background: var(--bg-surface); color: var(--text-muted);
      font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.8rem;
      cursor: pointer; transition: all 0.2s;
    }
    .pill:hover { border-color: rgba(255,255,255,0.22); color: var(--text-main); }
    .pill.active { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 0 14px rgba(0,163,255,0.3); }

    /* ── Empty State ─────────────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      padding: 56px; color: var(--text-dim);
    }
    .empty-state i { width: 52px; height: 52px; opacity: 0.25; }
    .empty-text { font-size: 0.88rem; }

    /* ── Early badge (global override inside component scope) ── */
    .badge-early { background: rgba(52,211,153,0.12); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
  `],
  template: `
    <div class="page-wrapper">
      <h1 class="page-title"><i data-lucide="clock-7"></i> {{ 'ATTENDANCE.TITLE' | translate }}</h1>

      <!-- ══════════ CLOCK PANEL ══════════ -->
      <div class="clock-panel"
           [class.st-early]="checkInArrivalStatus === 'Early'"
           [class.st-ontime]="checkInArrivalStatus === 'Present'"
           [class.st-late]="checkInArrivalStatus === 'Late'">

        <!-- Date label -->
        <div class="clock-date">{{ dateLabel }}</div>

        <!-- Clock digits -->
        <div class="clock-display">
          <i *ngIf="clockFrozen" data-lucide="lock" class="lock-icon"
             [class.col-early]="checkInArrivalStatus === 'Early'"
             [class.col-ontime]="checkInArrivalStatus === 'Present'"
             [class.col-late]="checkInArrivalStatus === 'Late'"></i>
          <span *ngIf="!clockFrozen" class="live-dot"></span>

          <span class="clock-digits"
                [class.col-early]="clockFrozen && checkInArrivalStatus === 'Early'"
                [class.col-ontime]="clockFrozen && checkInArrivalStatus === 'Present'"
                [class.col-late]="clockFrozen && checkInArrivalStatus === 'Late'">
            {{ displayTime }}
          </span>
        </div>

        <!-- Arrival status badge — visible after check-in -->
        <div *ngIf="clockFrozen && checkInArrivalStatus" class="arrival-section">
          <span class="arrival-badge"
                [class.ab-early]="checkInArrivalStatus === 'Early'"
                [class.ab-ontime]="checkInArrivalStatus === 'Present'"
                [class.ab-late]="checkInArrivalStatus === 'Late'">
            <i [attr.data-lucide]="checkInArrivalStatus === 'Late' ? 'alarm-clock' : 'alarm-clock-check'"
               style="width:15px;height:15px"></i>
            {{ arrivalStatusLabel }}
          </span>
          <div class="arrival-sub">{{ 'ATTENDANCE.WORK_STARTS' | translate }}</div>
        </div>

        <!-- Action buttons -->
        <div class="action-area">
          <ng-container [ngSwitch]="status.state">

            <!-- Not checked in yet -->
            <button *ngSwitchCase="'none'" class="btn-checkin btn-in" (click)="checkIn()">
              <i data-lucide="log-in"></i>
              {{ 'ATTENDANCE.BTN_CHECKIN' | translate }}
            </button>

            <!-- Checked in — show frozen time + check-out button -->
            <div *ngSwitchCase="'in'"
                 style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%">
              <span class="checked-msg">
                <i data-lucide="check-circle-2" style="color:var(--success);width:17px;height:17px;flex-shrink:0"></i>
                {{ 'ATTENDANCE.CHECKED_IN_AT' | translate:{time: frozenTime} }}
              </span>
              <button class="btn-checkin btn-out" (click)="checkOut()">
                <i data-lucide="log-out"></i>
                {{ 'ATTENDANCE.BTN_CHECKOUT' | translate }}
              </button>
            </div>

            <!-- Checked out — show summary -->
            <div *ngSwitchCase="'out'" class="done-summary">
              <div class="done-title">
                <i data-lucide="party-popper"></i>
                {{ 'ATTENDANCE.DONE_MSG' | translate }}
              </div>
              <div class="done-times">
                <span>{{ 'DASHBOARD.COL_IN' | translate }}:&nbsp;<strong>{{ todayCheckIn }}</strong></span>
                <span>•</span>
                <span>{{ 'DASHBOARD.COL_OUT' | translate }}:&nbsp;<strong>{{ todayCheckOut }}</strong></span>
              </div>
            </div>

          </ng-container>
        </div>
      </div>

      <!-- ══════════ DATE RANGE FILTER ══════════ -->
      <div class="month-nav">
        <div class="month-nav-top" style="gap: 20px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="nav-label"><i data-lucide="calendar-search" style="width:13px;height:13px"></i>{{ 'ATTENDANCE.FILTER_FROM' | translate }}</span>
            <input type="date" class="year-select" [(ngModel)]="fromDate">
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="nav-label"><i data-lucide="calendar-search" style="width:13px;height:13px"></i>{{ 'ATTENDANCE.FILTER_TO' | translate }}</span>
            <input type="date" class="year-select" [(ngModel)]="toDate">
          </div>
        </div>
      </div>

      <!-- ══════════ FILTER ROW ══════════ -->
      <div class="filter-row">
        <span class="filter-lbl">
          <i data-lucide="filter" style="width:12px;height:12px"></i>
          {{ 'ATTENDANCE.FILTER' | translate }}
        </span>
        <button class="pill" [class.active]="filter==='All'"     (click)="filter='All'">{{ 'ATTENDANCE.ALL_FILTER' | translate }}</button>
        <button class="pill" [class.active]="filter==='Present'" (click)="filter='Present'">{{ 'DASHBOARD.STATUS_PRESENT' | translate }}</button>
        <button class="pill" [class.active]="filter==='Early'"   (click)="filter='Early'">{{ 'ATTENDANCE.STATUS_EARLY' | translate }}</button>
        <button class="pill" [class.active]="filter==='Late'"    (click)="filter='Late'">{{ 'DASHBOARD.STATUS_LATE' | translate }}</button>
        <button class="pill" [class.active]="filter==='Absent'"  (click)="filter='Absent'">{{ 'DASHBOARD.STATUS_ABSENT' | translate }}</button>
      </div>

      <!-- ══════════ HISTORY TABLE ══════════ -->
      <div class="card">
        <div class="card-title">
          <i data-lucide="history"></i>
          {{ 'ATTENDANCE.HISTORY_RANGE' | translate:{from: formatDate(fromDate), to: formatDate(toDate)} }}
        </div>
        <div class="table-container">
          <table *ngIf="filtered.length > 0">
            <thead>
              <tr>
                <th>{{ 'DASHBOARD.COL_DATE' | translate }}</th>
                <th>{{ 'ATTENDANCE.COL_DAY' | translate }}</th>
                <th>{{ 'DASHBOARD.COL_STATUS' | translate }}</th>
                <th>{{ 'DASHBOARD.COL_IN' | translate }}</th>
                <th>{{ 'DASHBOARD.COL_OUT' | translate }}</th>
                <th>{{ 'ATTENDANCE.COL_OVERTIME' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of filtered">
                <td style="font-weight:600">{{ formatDate(r.date) }}</td>
                <td style="color:var(--text-muted)">{{ dayName(r.date) }}</td>
                <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                <td style="font-family:'Outfit';font-weight:600">{{ r.checkIn }}</td>
                <td style="font-family:'Outfit';font-weight:600">{{ r.checkOut }}</td>
                <td style="font-family:'Outfit';font-weight:600" [style.color]="r.overtime !== '—' ? 'var(--primary)' : 'var(--text-muted)'">
                  {{ r.overtime }}
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="filtered.length === 0" class="empty-state">
            <i data-lucide="calendar-x"></i>
            <div class="empty-text">{{ 'ATTENDANCE.NO_RECORDS' | translate }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceComponent implements OnInit, OnDestroy, AfterViewInit {
  records: AttendanceRecord[] = [];
  status: CheckInStatus = { empId: '', state: 'none', checkInTime: '', checkOutTime: '' };
  filter = 'All';

  // Clock
  liveTime = '';
  dateLabel = '';
  clockFrozen = false;
  frozenTime  = '';
  checkInArrivalStatus: 'Early' | 'Present' | 'Late' | null = null;

  // Done-state display helpers
  todayCheckIn  = '—';
  todayCheckOut = '—';

  // Date range selector
  fromDate = '';
  toDate = '';

  private timer?: ReturnType<typeof setInterval>;
  private sub = new Subscription();

  constructor(
    private auth: AuthService,
    private attSvc: AttendanceService,
    private toast: ToastService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.auth.currentUser!.id;
    this.loadHistory(id);
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
    this.initDateRange();

    this.sub.add(
      this.translate.onLangChange.subscribe(() => {
        this.tick();
      })
    );
  }

  ngAfterViewInit(): void { this.refreshIcons(); }
  ngOnDestroy(): void { clearInterval(this.timer); this.sub.unsubscribe(); }

  refreshIcons(): void {
    setTimeout(() => { if ((window as any).lucide) (window as any).lucide.createIcons(); }, 120);
  }

  tick(): void {
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    if (!this.clockFrozen) {
      this.liveTime = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    this.dateLabel = new Date().toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  initDateRange(): void {
    const d = new Date();
    let startD = new Date(d);
    let endD = new Date(d);
    
    if (d.getDate() <= 25) {
      startD.setMonth(d.getMonth() - 1);
      startD.setDate(26);
      endD.setDate(25);
    } else {
      startD.setDate(26);
      endD.setMonth(d.getMonth() + 1);
      endD.setDate(25);
    }

    this.fromDate = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
    this.toDate = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;
  }

  // ── Computed ────────────────────────────────────────────────

  get displayTime(): string { return this.clockFrozen ? this.frozenTime : this.liveTime; }

  get arrivalStatusLabel(): string {
    if (this.checkInArrivalStatus === 'Early')   return this.translate.instant('ATTENDANCE.STATUS_EARLY');
    if (this.checkInArrivalStatus === 'Present')  return this.translate.instant('ATTENDANCE.STATUS_ONTIME');
    if (this.checkInArrivalStatus === 'Late')     return this.translate.instant('DASHBOARD.STATUS_LATE');
    return '';
  }

  get monthRecords(): AttendanceRecord[] {
    return this.records.filter(r => {
      if (!r.date) return false;
      return r.date >= this.fromDate && r.date <= this.toDate;
    });
  }

  get filtered(): AttendanceRecord[] {
    const base = this.monthRecords;
    return this.filter === 'All' ? base : base.filter(r => r.status === this.filter);
  }

  // ── Helpers ─────────────────────────────────────────────────

  private computeArrival(date?: Date): 'Early' | 'Present' | 'Late' {
    const d    = date ?? new Date();
    const mins = d.getHours() * 60 + d.getMinutes();
    if (mins < 8 * 60)       return 'Early';
    if (mins <= 8 * 60 + 10) return 'Present';
    return 'Late';
  }

  private frozenTimeFrom(isoString: string): string {
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    return new Date(isoString).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private loadHistory(empId: string): void {
    this.attSvc.getHistory(empId).subscribe(statuses => {
      statuses.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      const fetchedRecords = statuses.map(s => this.attSvc.toRecord(s));
      this.records = this.attSvc.fillMissingDays(fetchedRecords, this.auth.currentUser?.joined);

      const today = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      })();

      const latestRow = statuses[0];
      let activeRow: CheckInStatus | undefined;

      if (latestRow) {
        if (latestRow.state === 'in') {
          // If the most recent action was a check-in (even from a past day), they must check out!
          activeRow = latestRow;
        } else if (latestRow.state === 'out' && latestRow.checkInTime) {
          // If they are checked out, see if this checkout happened TODAY.
          const d = new Date(latestRow.checkInTime);
          const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          if (ds === today) {
            activeRow = latestRow; // Done for today
          }
        }
      }

      if (activeRow) {
        this.status = activeRow;
        if (activeRow.checkInTime) {
          const d = new Date(activeRow.checkInTime);
          this.frozenTime           = this.frozenTimeFrom(activeRow.checkInTime);
          this.clockFrozen          = true;
          this.checkInArrivalStatus = this.computeArrival(d);
          this.todayCheckIn         = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }
        if (activeRow.checkOutTime) {
          this.todayCheckOut = new Date(activeRow.checkOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }
      } else {
        this.status               = { empId, state: 'none', checkInTime: '', checkOutTime: '' };
        this.clockFrozen          = false;
        this.checkInArrivalStatus = null;
        this.todayCheckIn         = '—';
        this.todayCheckOut        = '—';
      }

      setTimeout(() => this.refreshIcons(), 150);
      this.cdr.detectChanges();
    });
  }

  // ── Actions ──────────────────────────────────────────────────

  checkIn(): void {
    // Freeze clock immediately for instant visual feedback
    this.frozenTime           = this.liveTime;
    this.clockFrozen          = true;
    this.checkInArrivalStatus = this.computeArrival();

    const id = this.auth.currentUser!.id;
    this.attSvc.postStatus({ empId: id, state: 'in' }).subscribe({
      next: s => {
        this.status = s;
        // Refine frozenTime with the exact server-stored timestamp
        if (s.checkInTime) {
          this.frozenTime   = this.frozenTimeFrom(s.checkInTime);
          this.todayCheckIn = new Date(s.checkInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }
        this.loadHistory(id);
        const key = this.checkInArrivalStatus === 'Early'
          ? 'ATTENDANCE.SUCCESS_IN_EARLY'
          : this.checkInArrivalStatus === 'Late'
          ? 'ATTENDANCE.SUCCESS_IN_LATE'
          : 'ATTENDANCE.SUCCESS_IN';
        this.toast.show(this.translate.instant(key));
        setTimeout(() => this.refreshIcons(), 200);
      },
      error: () => {
        // Revert freeze on failure
        this.clockFrozen          = false;
        this.checkInArrivalStatus = null;
      }
    });
  }

  checkOut(): void {
    const id = this.auth.currentUser!.id;
    // Pass the whole current status so the service updates the existing row
    this.attSvc.postStatus({ ...this.status, empId: id, state: 'out' }).subscribe({
      next: s => {
        this.status = s;
        if (s.checkOutTime) {
          this.todayCheckOut = new Date(s.checkOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }
        this.loadHistory(id);
        this.toast.show(this.translate.instant('ATTENDANCE.SUCCESS_OUT'));
        setTimeout(() => this.refreshIcons(), 200);
      }
    });
  }

  // ── Display helpers ──────────────────────────────────────────

  formatDate(d: string): string {
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    return new Date(d + 'T00:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  dayName(d: string): string {
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    return this.translate.instant(`ATTENDANCE.DAYS.${days[new Date(d + 'T00:00:00').getDay()]}`);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Present: 'DASHBOARD.STATUS_PRESENT',
      Absent:  'DASHBOARD.STATUS_ABSENT',
      Late:    'DASHBOARD.STATUS_LATE',
      Weekend: 'DASHBOARD.STATUS_WEEKEND',
      Early:   'ATTENDANCE.STATUS_EARLY',
    };
    return this.translate.instant(map[status] ?? `DASHBOARD.STATUS_${status.toUpperCase()}`);
  }

  badgeClass(s: string): string {
    const m: Record<string, string> = {
      Present: 'badge-present',
      Absent:  'badge-absent',
      Late:    'badge-late',
      Weekend: 'badge-weekend',
      Early:   'badge-early',
    };
    return m[s] ?? '';
  }
}
