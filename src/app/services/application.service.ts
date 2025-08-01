import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Application } from '../models/application';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private readonly baseUrl = '/api/applications';

  constructor(private http: HttpClient) {}

  /** Fetch all applications */
  getAll(): Observable<Application[]> {
    return this.http.get<Application[]>(this.baseUrl);
  }

  /** Delete a given application by ID */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** (Optional) Fetch a single application */
  getById(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.baseUrl}/${id}`);
  }

  /** (Optional) Create a new application */
  create(app: Partial<Application>): Observable<Application> {
    return this.http.post<Application>(this.baseUrl, app);
  }

  /** (Optional) Update an existing application */
  update(id: number, app: Partial<Application>): Observable<Application> {
    return this.http.put<Application>(`${this.baseUrl}/${id}`, app);
  }
}
