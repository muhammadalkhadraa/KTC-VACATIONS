import { Injectable } from '@angular/core';
import { catchError, from, map, Observable, of } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { HolidayRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private cache = new Map<string, HolidayRequest[]>();

  constructor(private supabaseSvc: SupabaseService) { }

  private readonly SELECT_ALL = 'requestId:request_id,empId:empId,emp_name:emp_name,startDate:start_date,end_date:end_date,days:days,reason:reason,status:status,manager_status:manager_status,manager_id:manager_id,gm_status:gm_status,gm_id:gm_id,submittedAt:submitted_at';

  getForEmployee(empId: string): Observable<HolidayRequest[]> {
    if (!empId) return of([]);
    const id = String(empId).trim().toUpperCase();
    const cached = this.cache.get(id);

    return from(
      this.supabaseSvc.supabase
        .from('holiday_requests')
        .select(this.SELECT_ALL)
        .eq('empId', id)
        .order('submitted_at', { ascending: false })
    ).pipe(
      map(({ data }) => {
        const reqs = (data as unknown as HolidayRequest[]) || [];
        if (!reqs.length && cached) return cached;
        this.cache.set(id, reqs);
        return reqs;
      }),
      catchError(() => of(this.cache.get(id) || []))
    );
  }

  submit(req: Partial<HolidayRequest>): Observable<HolidayRequest> {
    const newReq = {
      empId: req.empId,
      emp_name: req.emp_name,
      start_date: req.startDate || new Date().toISOString(),
      end_date: req.end_date || new Date().toISOString(),
      days: req.days,
      reason: req.reason,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      manager_status: 'pending',
      gm_status: 'pending',
      manager_id: req.manager_id
    };
    return from(this.supabaseSvc.supabase.from('holiday_requests').insert([newReq]).select(this.SELECT_ALL).single()).pipe(
      map(({ data }) => {
        const created = data as unknown as HolidayRequest;
        const id = created.empId.toUpperCase();
        const existing = this.cache.get(id) ?? [];
        this.cache.set(id, [...existing, created]);
        return created;
      })
    );
  }

  // admin helpers
  getAll(): Observable<HolidayRequest[]> {
    return from(this.supabaseSvc.supabase.from('holiday_requests').select(this.SELECT_ALL).order('submitted_at', { ascending: false })).pipe(
      map(({ data }) => (data as unknown as HolidayRequest[]) || [])
    );
  }

  getPending(role?: string): Observable<HolidayRequest[]> {
    let query = this.supabaseSvc.supabase.from('holiday_requests').select(this.SELECT_ALL).eq('status', 'pending');

    if (role === 'manager') {
      // Manager sees requests where manager hasn't acted yet
      query = query.eq('manager_status', 'pending');
    } else if (role === 'general manager') {
      // GM sees requests where manager approved but GM hasn't acted yet
      query = query.eq('manager_status', 'approved').eq('gm_status', 'pending');
    } else if (role === 'admin') {
      // Admin sees ALL pending requests system-wide (no additional manager_status filtering required)
    }

    return from(query.order('submitted_at', { ascending: false })).pipe(
      map(({ data }) => (data as unknown as HolidayRequest[]) || [])
    );
  }

  approve(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
    const update: any = {};
    if (approverRole === 'manager') {
      update.manager_status = 'approved';
      update.manager_id = approverId;
    } else if (approverRole === 'general manager') {
      update.gm_status = 'approved';
      update.gm_id = approverId;
      update.status = 'approved';
    } else if (approverRole === 'admin') {
      // Admin forces full approval
      update.manager_status = 'approved';
      update.manager_id = approverId;
      update.gm_status = 'approved';
      update.gm_id = approverId;
      update.status = 'approved';
    }

    return from(this.supabaseSvc.supabase.from('holiday_requests').update(update).eq('request_id', id).select(this.SELECT_ALL).single()).pipe(
      map(({ data }) => data as unknown as HolidayRequest)
    );
  }

  reject(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
    const update: any = { status: 'rejected' };
    if (approverRole === 'manager') {
      update.manager_status = 'rejected';
      update.manager_id = approverId;
    } else if (approverRole === 'general manager') {
      update.gm_status = 'rejected';
      update.gm_id = approverId;
    } else if (approverRole === 'admin') {
      // Admin forces full rejection
      update.manager_status = 'rejected';
      update.manager_id = approverId;
      update.gm_status = 'rejected';
      update.gm_id = approverId;
    }

    return from(this.supabaseSvc.supabase.from('holiday_requests').update(update).eq('request_id', id).select(this.SELECT_ALL).single()).pipe(
      map(({ data }) => data as unknown as HolidayRequest)
    );
  }
}
