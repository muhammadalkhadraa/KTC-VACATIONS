import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Role } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  getAll(): Observable<Role[]> {
    return from(this.supabase.from('roles').select('*')).pipe(
      map(({ data }) => (data || []) as Role[])
    );
  }

  create(name: string): Observable<Role> {
    return from(this.supabase.from('roles').insert([{ name }]).select().single()).pipe(
      map(({ data }) => data as Role)
    );
  }

  delete(id: number): Observable<void> {
    return from(this.supabase.from('roles').delete().eq('id', id)).pipe(
      map(() => void 0)
    );
  }
}
