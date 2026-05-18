/// <reference types="cypress" />

import { DOWNLOAD_CONSTANTS } from '../../constants/ProjectConstants';
import { TestDataGenerator } from '../../utils/TestDataGenerator';

export class BaseDownloadHelper {
  protected static readonly DOWNLOADS_FOLDER =
    DOWNLOAD_CONSTANTS.DOWNLOADS_FOLDER;

  static getDownloadsPath(): string {
    return `${Cypress.config('projectRoot')}/${this.DOWNLOADS_FOLDER}`;
  }

  static ensureDownloadsFolderExists(): Cypress.Chainable<null> {
    const downloadsPath = this.getDownloadsPath();
    return cy.task('ensureDownloadsFolder', downloadsPath);
  }

  protected static listFiles(
    listTaskName: string,
  ): Cypress.Chainable<string[]> {
    return this.ensureDownloadsFolderExists().then(() => {
      const downloadsPath = this.getDownloadsPath();
      return cy.task<string[]>(listTaskName, downloadsPath);
    });
  }

  protected static getLatestOrFail(
    listTaskName: string,
    fileType: string,
  ): Cypress.Chainable<string> {
    return this.listFiles(listTaskName).then((files) => {
      if (!files.length) {
        throw new Error(
          `Expected at least 1 ${fileType} file in downloads folder (${this.DOWNLOADS_FOLDER}), but found none`,
        );
      }
      const latest = files[files.length - 1];
      Cypress.log({
        name: `getLatest${fileType}OrFail`,
        message: `Latest ${fileType} detected: "${latest}"`,
      });
      return latest;
    });
  }

  protected static findByName(
    listTaskName: string,
    fileType: string,
    partialName: string,
    timeout = DOWNLOAD_CONSTANTS.DEFAULT_FIND_TIMEOUT_MS,
  ): Cypress.Chainable<string> {
    const processedName = TestDataGenerator.parseValue(partialName);
    const startTime = Date.now();

    const attemptFind = (): Cypress.Chainable<string> => {
      return this.listFiles(listTaskName).then((files) => {
        const matchedFile = [...files]
          .reverse()
          .find((file) => file.includes(processedName));

        if (matchedFile) {
          Cypress.log({
            name: `find${fileType}ByName`,
            message: `Found ${fileType}: "${matchedFile}" (searched for: "${processedName}")`,
          });
          return matchedFile;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= timeout) {
          throw new Error(
            `No ${fileType} found with name containing "${processedName}" after ${timeout}ms. Found files: ${files.join(', ')}`,
          );
        }

        Cypress.log({
          name: `find${fileType}ByName`,
          message: `${fileType} not found yet, retrying... (elapsed: ${elapsed}ms)`,
        });
        return cy
          .wait(DOWNLOAD_CONSTANTS.POLL_INTERVAL_MS)
          .then(() => attemptFind() as unknown) as Cypress.Chainable<string>;
      }) as Cypress.Chainable<string>;
    };

    return attemptFind();
  }

  protected static clearFiles(
    clearTaskName: string,
    fileType: string,
  ): Cypress.Chainable<null> {
    const downloadsPath = this.getDownloadsPath();
    Cypress.log({
      name: 'clearDownloadsFolder',
      message: `Clearing ${fileType} downloads folder`,
    });
    return cy.task(clearTaskName, downloadsPath);
  }
}
