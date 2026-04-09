import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HolidayService } from '../../services/holiday.service';
import { Employee, HolidayRequest } from '../../models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  styles: [`
    .profile-header {
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border-radius: var(--radius); padding: 40px;
      color: white; display: flex; align-items: center; gap: 32px;
      margin-bottom: 32px; flex-wrap: wrap;
      box-shadow: var(--shadow-xl);
      position: relative;
      overflow: hidden;
    }
    .profile-header::after {
      content: ""; position: absolute; top: -50%; right: -20%;
      width: 300px; height: 300px; background: rgba(255,255,255,0.05);
      border-radius: 50%; transform: rotate(-15deg);
    }
    .avatar-big {
      width: 100px; height: 100px; border-radius: 24px;
      background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3);
      backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; font-weight: 800; flex-shrink: 0;
      font-family: 'Outfit', sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .prof-name { font-size: 2rem; font-weight: 800; margin-bottom: 4px; font-family: 'Outfit', sans-serif; }
    .prof-sub  { opacity: .9; font-size: 1rem; font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .prof-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.2);
      border-radius: var(--radius-sm); padding: 6px 14px; 
      font-size: .85rem; font-weight: 700; margin-top: 16px;
      backdrop-filter: blur(5px);
    }
    
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 20px; }
    .info-item { 
      background: var(--white); border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm); padding: 20px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }
    .info-item:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--accent); }
    .info-lbl  { font-size: .75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .info-val  { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
    
    .hol-bar   { background: var(--sky); border-radius: var(--radius-full); height: 14px; overflow: hidden; margin: 16px 0; border: 1px solid var(--accent-soft); }
    .hol-fill  { height: 100%; background: linear-gradient(90deg, var(--accent), var(--primary-light)); border-radius: var(--radius-full); transition: width 1s cubic-bezier(0.16, 1, 0.3, 1); }
    .hol-meta  { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin-top: 20px; }
    .hol-stat  { display: flex; flex-direction: column; gap: 4px; }
    .hol-stat span { font-size: .8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .hol-stat strong { font-size: 1.2rem; color: var(--primary); font-family: 'Outfit'; }
    
    .btn-request {
      width: 100%; text-align: center;
      margin-top: 24px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--text-muted);
      gap: 12px;
    }
    .empty-state i { font-size: 2.5rem; color: var(--accent); opacity: 0.5; }
  `],
  template: `
    <div class="page-wrapper" *ngIf="emp">
      <h1 class="page-title"><i data-lucide="user"></i> {{ 'PROFILE.TITLE' | translate | slice:0:-8 }} <span>{{ 'PROFILE.PROFILE_SPAN' | translate }}</span></h1>

      <!-- Header -->
      <div class="profile-header">
        <div class="avatar-big">{{ emp.name.charAt(0) }}</div>
        <div>
          <div class="prof-name">{{ emp.name }}</div>
          <div class="prof-sub">
            <i data-lucide="briefcase" style="width: 16px;"></i>
            {{ emp.position }} · {{ emp.department }} {{ 'PROFILE.DEPT_SUFFIX' | translate }}
          </div>
          <span class="prof-badge"><i data-lucide="id-card" style="width: 14px;"></i> {{ 'LOGIN.EMP_ID' | translate }}: {{ emp.id }}</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 32px; align-items: start;">
        <div style="display: flex; flex-direction: column; gap: 32px;">
          <!-- Info grid -->
          <div class="card">
            <div class="card-title"><i data-lucide="info"></i>{{ 'PROFILE.INFO_TITLE' | translate }}</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-lbl"><i data-lucide="hash" style="width: 12px;"></i>{{ 'LOGIN.EMP_ID' | translate }}</div>
                <div class="info-val">{{ emp.id }}</div>
              </div>
              <div class="info-item">
                <div class="info-lbl"><i data-lucide="user-check" style="width: 12px;"></i>{{ 'PROFILE.FULL_NAME' | translate }}</div>
                <div class="info-val">{{ emp.name }}</div>
              </div>
              <div class="info-item">
                <div class="info-lbl"><i data-lucide="building" style="width: 12px;"></i>{{ 'DASHBOARD.COL_DEPT' | translate }}</div>
                <div class="info-val">{{ emp.department }}</div>
              </div>
              <div class="info-item">
                <div class="info-lbl"><i data-lucide="award" style="width: 12px;"></i>Position</div>
                <div class="info-val">{{ emp.position }}</div>
              </div>
              <div class="info-item">
                <div class="info-lbl"><i data-lucide="calendar" style="width: 12px;"></i>{{ 'PROFILE.JOINED' | translate }}</div>
                <div class="info-val">{{ formatDate(emp.joined) }}</div>
              </div>
              <div class="info-item">
                <div class="info-lbl"><i data-lucide="shield" style="width: 12px;"></i>{{ 'PROFILE.ROLE' | translate }}</div>
                <div class="info-val">{{ emp.role | titlecase }}</div>
              </div>
            </div>
          </div>

          <!-- Holiday history -->
          <div class="card">
            <div class="card-title"><i data-lucide="history"></i>{{ 'PROFILE.HOL_HISTORY' | translate }}</div>
            <ng-container *ngIf="requests.length; else noHols">
              <div class="table-container">
                <table class="req-table">
                  <thead>
                    <tr>
                      <th>{{ 'PROFILE.COL_START' | translate }}</th>
                      <th>{{ 'PROFILE.COL_END' | translate }}</th>
                      <th>{{ 'DASHBOARD.COL_DAYS' | translate }}</th>
                      <th>{{ 'PROFILE.COL_REASON' | translate }}</th>
                      <th>{{ 'DASHBOARD.COL_STATUS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of requests">
                      <td style="font-weight: 600;">{{ formatDate(r.startDate) }}</td>
                      <td style="font-weight: 600;">{{ formatDate(r.end_date) }}</td>
                      <td><span class="badge badge-pending" style="background: var(--sky); color: var(--primary);">{{ r.days }}</span></td>
                      <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ r.reason }}</td>
                      <td><span class="badge" [ngClass]="badgeClass(r.status)">{{ getStatusLabel(r.status) }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ng-container>
            <ng-template #noHols>
              <div class="empty-state">
                <i data-lucide="inbox"></i>
                <p>{{ 'PROFILE.NO_HOLS' | translate }}</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Holiday balance -->
        <div class="card">
          <div class="card-title"><i data-lucide="pie-chart"></i>{{ 'PROFILE.HOL_BALANCE' | translate }}</div>
          <div style="text-align: center; margin-bottom: 24px;">
             <div style="font-size: 3rem; font-weight: 800; color: var(--primary); font-family: 'Outfit';">{{ remaining }}</div>
             <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">{{ 'PROFILE.REMAINING' | translate }} / {{ emp.totalHolidays }} TOTAL</div>
          </div>
          
          <div class="hol-bar"><div class="hol-fill" [style.width]="barWidth"></div></div>
          
          <div class="hol-meta">
            <div class="hol-stat">
              <span>{{ 'PROFILE.USED' | translate }}</span>
              <strong>{{ emp.usedHolidays }}</strong>
            </div>
            <div class="hol-stat">
              <span>{{ 'PROFILE.ANNUAL' | translate: {defaultValue: 'Annual Rate'} }}</span>
              <strong>{{ emp.totalHolidays }}</strong>
            </div>
          </div>
          
          <div class="btn-request">
            <a class="btn-primary" routerLink="/holiday-request" style="width: 100%;">
              <i data-lucide="plus-circle"></i>
              {{ 'DASHBOARD.REQUEST_HOLIDAY' | translate }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit, OnDestroy {
  emp!: Employee;
  requests: HolidayRequest[] = [];
  private sub = new Subscription();

  constructor(
    private auth: AuthService, 
    private holSvc: HolidayService,
    private translate: TranslateService
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

  get remaining() { return this.emp.totalHolidays - this.emp.usedHolidays; }
  get barWidth() { return Math.round((this.remaining / this.emp.totalHolidays) * 100) + '%'; }

  ngOnInit(): void {
    const id = this.auth.currentUser!.id;
    this.auth.getEmployeeById(id).subscribe(emp => {
      this.emp = emp;
    });
    this.holSvc.getForEmployee(id).subscribe(reqs => {
      this.requests = reqs;
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  formatDate(d: string) { 
    const locale = this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-GB';
    return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }); 
  }

  getStatusLabel(status: string) {
    const key = `DASHBOARD.STATUS_${status.toUpperCase()}`;
    return this.translate.instant(key);
  }

  badgeClass(s: string) {
    const m: Record<string, string> = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' };
    return m[s] ?? '';
  }
}
