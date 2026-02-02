/// <reference types="cypress" />
import { ApiBaseHelper } from '../apiBase/ApiBaseHelper';

export class ApiDeleteHelper {
  static makeDeleteRequest(endpoint: string): void {
    ApiBaseHelper.makeRequest('DELETE', endpoint);
  }
}
