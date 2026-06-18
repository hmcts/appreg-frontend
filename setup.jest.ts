import '@angular/compiler';
import '@angular/common/locales/global/en-GB';
import 'zone.js';
import 'zone.js/testing';

import {
  COMPILER_OPTIONS,
  NgModule,
  provideZoneChangeDetection,
} from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { TextDecoder, TextEncoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

class TestModule {}

NgModule({
  providers: [provideZoneChangeDetection()],
})(TestModule);

getTestBed().initTestEnvironment(
  [BrowserTestingModule, TestModule],
  platformBrowserTesting([
    {
      provide: COMPILER_OPTIONS,
      useValue: {},
      multi: true,
    },
  ]),
);

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
