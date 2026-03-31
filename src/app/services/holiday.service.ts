import { Injectable } from '@angular/core';
import { catchError, from, map, Observable, of, tap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { HolidayRequest } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private cache = new Map<string, HolidayRequest[]>();

  constructor(private supabaseSvc: SupabaseService) {}

  getForEmployee(empId: string): Observable<HolidayRequest[]> {
    if (!empId) return of([]);
    const id = String(empId).trim().toUpperCase();
    const cached = this.cache.get(id);

    return from(
      this.supabaseSvc.supabase.from('holiday_requests').select('*').eq('empId', id).order('submittedAt', { ascending: false })
    ).pipe(
      map(({ data }) => {
        const reqs = (data || []) as HolidayRequest[];
        if (!reqs.length && cached) return cached;
        this.cache.set(id, reqs);
        return reqs;
      }),
      catchError(() => of(this.cache.get(id) || []))
    );
  }

  submit(req: Partial<HolidayRequest>): Observable<HolidayRequest> {
    const newReq = {
      ...req,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      managerStatus: 'pending',
      gmStatus: 'pending'
    };
    return from(this.supabaseSvc.supabase.from('holiday_requests').insert([newReq]).select().single()).pipe(
      map(({ data }) => {
        const created = data as HolidayRequest;
        const id = created.empId.toUpperCase();
        const existing = this.cache.get(id) ?? [];
        this.cache.set(id, [...existing, created]);
        return created;
      })
    );
  }

  // admin helpers
  getAll(): Observable<HolidayRequest[]> {
    return from(this.supabaseSvc.supabase.from('holiday_requests').select('*').order('submittedAt', { ascending: false })).pipe(
      map(({ data }) => (data || []) as HolidayRequest[])
    );
  }

  getPending(role?: string): Observable<HolidayRequest[]> {
    let query = this.supabaseSvc.supabase.from('holiday_requests').select('*').eq('status', 'pending');

    if (role === 'manager') {
      query = query.eq('managerStatus', 'pending');
    } else if (role === 'general manager') {
      query = query.eq('managerStatus', 'approved').eq('gmStatus', 'pending');
    }

    return from(query.order('submittedAt', { ascending: false })).pipe(
      map(({ data }) => (data || []) as HolidayRequest[])
    );
  }

  approve(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
    const update: any = {};
    if (approverRole === 'manager') {
      update.managerStatus = 'approved';
      update.managerId = approverId;
    } else if (approverRole === 'general manager') {
      update.gmStatus = 'approved';
      update.gmId = approverId;
      update.status = 'approved'; 
    }

    return from(this.supabaseSvc.supabase.from('holiday_requests').update(update).eq('requestId', id).select().single()).pipe(
      map(({ data }) => data as HolidayRequest)
    );
  }

  reject(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
    const update: any = { status: 'rejected' };
    if (approverRole === 'manager') {
      update.managerStatus = 'rejected';
      update.managerId = approverId;
    } else if (approverRole === 'general manager') {
      update.gmStatus = 'rejected';
      update.gmId = approverId;
    }

    return from(this.supabaseSvc.supabase.from('holiday_requests').update(update).eq('requestId', id).select().single()).pipe(
      map(({ data }) => data as HolidayRequest)
    );
  }
}
