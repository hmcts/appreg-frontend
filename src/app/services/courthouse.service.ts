import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {CourtHouse} from "../models/court-house";

@Injectable({ providedIn: 'root' })
export class CourthouseService {
  constructor(private http: HttpClient) {}

  getCourthouses(): Observable<CourtHouse[]> {
    return this.http.get<CourtHouse[]>('/courthouses');
  }
}
