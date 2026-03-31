import { Injectable, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  /** The shared Supabase client instance. */
  public readonly supabase: SupabaseClient;

  constructor(private ngZone: NgZone) {
    // We run the initialization outside sub-Angular zones to prevent
    // conflicts with Navigator LockManager (WebView Locks API)
    this.supabase = this.ngZone.runOutsideAngular(() => {
      return createClient(
        environment.supabaseUrl,
        environment.supabaseKey
      );
    });
  }

  /**
   * Optional helper to check connection or table existence.
   */
  getTodos() {
    return this.supabase.from('todos').select('*');
  }
}
