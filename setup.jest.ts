import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
setupZoneTestEnv();

// Mock govuk and moj frontend bundles so tests can run without dom errors
// Shared in all tests so if we need specific behaviour then a local mock is needed
jest.mock('govuk-frontend', () => ({ initAll: jest.fn() }), { virtual: true });
jest.mock('govuk-frontend/dist/govuk/all.bundle', () => ({}), {
  virtual: true,
});
class MojComponentMock {
  init = jest.fn().mockName('no-op init avoids DOM dependency in tests');
}

const mojFrontendCtor = jest.fn(() => new MojComponentMock());
jest.mock(
  '@ministryofjustice/frontend',
  () => ({
    SortableTable: mojFrontendCtor,
    default: { SortableTable: mojFrontendCtor },
  }),
  { virtual: true },
);

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: jest.fn(),
});
