import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter, merge } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { HolidayService } from '../../services/holiday.service';
import { ToastService } from '../../services/toast.service';
import { HolidayRequest, Employee } from '../../models/models';
import { DataStoreService } from '../../services/data-store.service';

@Component({
  selector: 'app-holiday-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }
    .balance-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: #D6F0FF; border-radius: 12px; padding: 10px 18px;
      font-weight: 700; color: #1A5F7A; font-size: .9rem; margin-bottom: 20px;
    }
    .days-preview {
      background: #D6F0FF; border-radius: 10px; padding: 10px 16px;
      font-weight: 700; color: #1A5F7A; font-size: .9rem; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .req-table td, .req-table th { font-size: .85rem; }
  `],
  template: `
    <div class="page-wrapper">
      <h1 class="page-title">✈️ Holiday <span>Request</span></h1>

      <div class="two-col">
        <!-- Submit form -->
        <div class="card">
          <div class="card-title">📝 Submit New Request</div>

          <div class="balance-pill">
            🏖️ Remaining Balance: <strong>{{ remaining }} days</strong>
          </div>

          <div class="form-group">
            <label for="startDate">Start Date</label>
            <input id="startDate" name="startDate" type="date" [(ngModel)]="startDate" [min]="today" (change)="calcPreview()" />
          </div>

          <div class="form-group">
            <label for="end_date">End Date</label>
            <input id="end_date" name="end_date" type="date" [(ngModel)]="end_date" [min]="startDate || today" (change)="calcPreview()" />
          </div>

          <div class="days-preview" *ngIf="previewDays > 0">
            📅 Duration: <strong>{{ previewDays }} day(s)</strong>
          </div>

          <div class="form-group">
            <label for="reason">Reason</label>
            <textarea id="reason" name="reason" [(ngModel)]="reason" placeholder="Briefly describe the reason for your leave..."></textarea>
          </div>

          <button class="btn-primary" (click)="submit()">Submit Request →</button>
        </div>
        <ng-template #adminNote>
          <div class="card">
            <div class="card-title">📝 Submit New Request</div>
            <div class="empty-state">
              <span class="emoji">ℹ️</span>
              General managers do not submit holiday requests.
            </div>
          </div>
        </ng-template>

        <!-- My requests -->
        <div class="card">
          <div class="card-title">📜 My Requests</div>
          <ng-container *ngIf="myRequests.length; else noReqs">
            <table class="req-table">
              <thead><tr><th>Period</th><th>Days</th><th>Status</th><th>Approval</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of myRequests">
                  <td>{{ fmt(r.startDate) }} –<br>{{ fmt(r.end_date) }}</td>
                  <td>{{ r.days }}</td>
                  <td><span class="badge" [ngClass]="bc(r.status)">{{ r.status }}</span></td>
                  <td>{{ approvalText(r) }}</td>
                </tr>
              </tbody>
            </table>
          </ng-container>
          <ng-template #noReqs>
            <div class="empty-state"><span class="emoji">📭</span>No requests submitted yet</div>
          </ng-template>
        </div>
      </div>
    </div>
  `
})
export class HolidayRequestComponent implements OnInit, OnDestroy {
  startDate = '';
  start_date = '';
  end_date = '';
  reason = '';
  previewDays = 0;
  today = new Date().toISOString().slice(0, 10);
  private sub = new Subscription();

  constructor(
    public auth: AuthService,
    private holSvc: HolidayService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public store: DataStoreService
  ) { }

  get remaining() { return this.emp ? this.emp.totalHolidays - this.emp.usedHolidays : 0; }
  ngOnInit(): void {
    this.sub.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.store.refresh();
      })
    );
  }

  get myRequests() { return this.store.myRequests(); }
  get emp() { return this.auth.currentUser!; }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }


  calcPreview(): void {
    if (this.startDate && this.end_date && this.end_date >= this.startDate) {
      this.previewDays = this.calcDays(this.startDate, this.end_date);
    } else {
      this.previewDays = 0;
    }
  }

  submit(): void {
    if (!this.startDate || !this.end_date) { this.toast.show('⚠️ Please select start and end dates', 'error'); return; }
    if (this.end_date < this.startDate) { this.toast.show('⚠️ End date must be after start date', 'error'); return; }
    if (!this.reason.trim()) { this.toast.show('⚠️ Please enter a reason', 'error'); return; }

    const payload: Partial<HolidayRequest> = {
      emp_id: this.emp.id,
      emp_name: this.emp.name,
      start_date: this.start_date,
      end_date: this.end_date,
      days: this.calcDays(this.startDate, this.end_date),
      reason: this.reason.trim()

    };

    this.holSvc.submit(payload).subscribe({
      next: () => {
        this.toast.show('✅ Holiday request submitted!');
        this.startDate = ''; this.end_date = ''; this.reason = ''; this.previewDays = 0;
        this.store.refresh();
      },
      error: () => this.toast.show('❌ Failed to submit request', 'error')
    });
  }

  fmt(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

  approvalText(req: HolidayRequest): string {
    if (req.managerStatus === 'rejected') {
      return `Rejected by manager (ID: ${req.manager_id})`;
    }
    if (req.gmStatus === 'rejected') {
      return `Rejected by general manager (ID: ${req.gmId})`;
    }
    if (req.managerStatus === 'pending') {
      return 'Waiting for manager approval';
    }
    if (req.managerStatus === 'approved' && req.gmStatus === 'pending') {
      return `Approved by manager (ID: ${req.manager_id}), waiting for general manager`;
    }
    if (req.managerStatus === 'approved' && req.gmStatus === 'approved') {
      return `Approved by manager (ID: ${req.manager_id}) and general manager (ID: ${req.gmId})`;
    }
    return '';
  }

  bc(s: string) { return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[s] ?? ''; }

  private calcDays(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }
}
