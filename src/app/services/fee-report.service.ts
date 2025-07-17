import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class FeeReportService {
  constructor(private http: HttpClient) {}

  downloadReport(filters: any) {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    if (filters.standardApplicantCode) {
      params = params.set('standardApplicantCode', filters.standardApplicantCode);
    }
    if (filters.applicantSurname) {
      params = params.set('applicantSurname', filters.applicantSurname);
    }
    if (filters.courthouseCode) {
      params = params.set('courthouseCode', filters.courthouseCode);
    }

    return this.http.get('/reports/fees', {
      params,
      responseType: 'blob'
    });
  }
}
