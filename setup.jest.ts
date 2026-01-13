import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
setupZoneTestEnv();

jest.mock('govuk-frontend', () => ({ initAll: jest.fn() }), { virtual: true });
jest.mock('govuk-frontend/dist/govuk/all.bundle', () => ({}), {
  virtual: true,
});
jest.mock('@ministryofjustice/frontend', () => ({}), { virtual: true });

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: jest.fn(),
});
