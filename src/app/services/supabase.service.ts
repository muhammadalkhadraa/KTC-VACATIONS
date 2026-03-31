import { Injectable, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public supabase!: SupabaseClient;

  constructor(private ngZone: NgZone) {
    if (!this.supabase) {
      // Initialize Supabase outside NgZone to avoid 'Navigator LockManager' and infinite change detection loops
      this.supabase = this.ngZone.runOutsideAngular(() => {
        return createClient(environment.supabaseUrl, environment.supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'sb-auth-token', // Custom key to avoid collisions
          }
        });
      });
    }
  }
}
