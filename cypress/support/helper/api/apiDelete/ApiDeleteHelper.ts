/// <reference types="cypress" />
import { ObjectBuilder } from '../../../utils/ObjectBuilder';
import { ApiBaseHelper } from '../apiBase/ApiBaseHelper';

export class ApiDeleteHelper {
  static makeDeleteRequest(endpoint: string): void {
    ApiBaseHelper.makeRequest('DELETE', endpoint);
  }

  static deleteWithBuilder(
    endpoint: string,
    flatProcessedRow: Record<string, string>,
  ): void {
    const nestedBody = ObjectBuilder.buildNestedObject(flatProcessedRow);
    ApiBaseHelper.resolveBodyPlaceholders(nestedBody).then((resolvedBody) => {
      const processedBody = ApiBaseHelper.processDynamicValues(
        resolvedBody,
      ) as Cypress.RequestBody;
      ApiBaseHelper.makeRequest('DELETE', endpoint, processedBody);
    });
  }
}
