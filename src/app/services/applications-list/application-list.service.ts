import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ApplicationList, ApplicationListWrite} from "../../models/application-list";
import {Application} from "../../models/application";
import {BulkUploadResponse} from "../../models/bulk-upload-response";

@Injectable({
  providedIn: 'root'
})
export class ApplicationListService {
  private readonly API_URL = '/application-lists';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApplicationList[]> {
    return this.http.get<ApplicationList[]>(this.API_URL);
  }

  get(id: number): Observable<ApplicationList> {
    return this.http.get<ApplicationList>(`${this.API_URL}/${id}`);
  }

  getApplicationsByListId(id: number): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.API_URL}/${id}/applications`);
  }
  create(data: ApplicationListWrite): Observable<ApplicationList> {
    return this.http.post<ApplicationList>(this.API_URL, data);
  }

  update(id: number, data: ApplicationListWrite): Observable<ApplicationList> {
    return this.http.put<ApplicationList>(`${this.API_URL}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  uploadBulkCsv(listId: string, file: File): Observable<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<BulkUploadResponse>(
      `${this.API_URL}/${listId}/applications/bulk-upload`,
      formData
    );
  }
}
