import type { AccountInfo } from '@azure/msal-node';
import express from 'express';

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
};

function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('MSAL session cache isolation', () => {
  test('keeps interleaved token acquisitions isolated by session', async () => {
    jest.resetModules();
    jest.doMock('uuid', () => ({ v4: jest.fn() }), { virtual: true });

    const accountAGate = deferred();
    const accountBGate = deferred();
    const gates = new Map<string, Deferred>([
      ['account-a', accountAGate],
      ['account-b', accountBGate],
    ]);
    const instances: unknown[] = [];

    jest.doMock('@azure/msal-node', () => {
      class ConfidentialClientApplication {
        private cache = '';

        constructor() {
          instances.push(this);
        }

        getTokenCache() {
          return {
            deserialize: (cache: string) => {
              this.cache = cache;
            },
            serialize: () => this.cache,
          };
        }

        async acquireTokenSilent({
          account,
        }: {
          account: AccountInfo;
        }): Promise<{ accessToken: string }> {
          await gates.get(account.homeAccountId)?.promise;
          const activeCache = this.cache;
          this.cache = `${activeCache}:updated`;
          return { accessToken: `token-from-${activeCache}` };
        }
      }

      return { ConfidentialClientApplication };
    });

    const { acquireApiTokenFromSession, setupSsoRoutes } =
      await import('../../server/routes/sso');

    setupSsoRoutes(express(), {
      tenantId: 'tenant-id',
      clientId: 'client-id',
      clientSecret: 'client-secret',
    });

    const sessionA = {
      account: { homeAccountId: 'account-a' } as AccountInfo,
      tokenCache: 'cache-a',
    };
    const sessionB = {
      account: { homeAccountId: 'account-b' } as AccountInfo,
      tokenCache: 'cache-b',
    };

    const tokenA = acquireApiTokenFromSession(sessionA, ['api-scope']);
    const tokenB = acquireApiTokenFromSession(sessionB, ['api-scope']);

    accountBGate.resolve();
    const resultB = await tokenB;
    accountAGate.resolve();
    const resultA = await tokenA;

    expect(instances).toHaveLength(2);
    expect(resultA?.accessToken).toBe('token-from-cache-a');
    expect(resultB?.accessToken).toBe('token-from-cache-b');
    expect(sessionA.tokenCache).toBe('cache-a:updated');
    expect(sessionB.tokenCache).toBe('cache-b:updated');
  });
});
