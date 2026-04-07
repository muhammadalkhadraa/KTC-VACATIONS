import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Role } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private supabaseSvc: SupabaseService) {}

  private readonly SELECT_ALL = 'id, name';

  getAll(): Observable<Role[]> {
    return from(this.supabaseSvc.supabase.from('roles').select(this.SELECT_ALL)).pipe(
      map(({ data }) => (data as unknown as Role[]) || [])
    );
  }

  create(name: string): Observable<Role> {
    return from(this.supabaseSvc.supabase.from('roles').insert([{ name }]).select(this.SELECT_ALL).single()).pipe(
      map(({ data }) => data as unknown as Role)
    );
  }

  delete(id: number): Observable<void> {
    return from(this.supabaseSvc.supabase.from('roles').delete().eq('id', id)).pipe(
      map(() => void 0)
    );
  }
}
