import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Role } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:5000/api/role';

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.API_URL).pipe(
      catchError(() => of([]))
    );
  }

  create(name: string): Observable<Role> {
    return this.http.post<Role>(this.API_URL, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
