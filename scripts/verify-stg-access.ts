/* eslint-disable no-console */
const APPREG_API_STG = 'https://appreg-api.staging.platform.hmcts.net';
const ONE_MINUTE = 60_000;

async function check(): Promise<void> {
  try {
    const res = await fetch(`${APPREG_API_STG}/health`);

    if (!res.ok) {
      throw new Error(`Healthcheck failed with status ${res.status}`);
    }

    console.log('✅ Staging access verified');
  } catch (err) {
    console.error(
      '🚨 Staging not accessible, have you connected to the HMCTS VPN? https://portal.platform.hmcts.net/',
      err,
    );
  } finally {
    setTimeout(() => {
      void check();
    }, ONE_MINUTE);
  }
}

void check();

