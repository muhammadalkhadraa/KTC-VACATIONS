import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Role } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private supabaseSvc: SupabaseService) {}

  getAll(): Observable<Role[]> {
    return from(this.supabaseSvc.supabase.from('roles').select('*')).pipe(
      map(({ data }) => (data || []) as Role[])
    );
  }

  create(name: string): Observable<Role> {
    return from(this.supabaseSvc.supabase.from('roles').insert([{ name }]).select().single()).pipe(
      map(({ data }) => data as Role)
    );
  }

  delete(id: number): Observable<void> {
    return from(this.supabaseSvc.supabase.from('roles').delete().eq('id', id)).pipe(
      map(() => void 0)
    );
  }
}
