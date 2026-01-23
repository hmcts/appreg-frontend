/// <reference types="cypress" />
import { ApiBaseHelper } from '../apiBase/ApiBaseHelper';

export class ApiDeleteHelper {
	/**
	 * Stores the response under the `@lastApiResponse` alias.
	 */
	static makeDeleteRequest(endpoint: string): void {
		ApiBaseHelper.makeRequest('DELETE', endpoint);
	}
}

