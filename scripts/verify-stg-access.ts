import axios from 'axios';

const APPREG_API_STG = 'https://appreg-api.staging.platform.hmcts.net';
const ONE_MINUTE = 60000;

(async function check() {
  try {
    await axios.get(`${APPREG_API_STG}/health`);
    console.log('✅ Staging access verified');
    setTimeout(check, ONE_MINUTE);
  } catch (err) {
    console.error('🚨 Staging not accessible, have you connected to the HMCTS VPN? https://portal.platform.hmcts.net/');
    setTimeout(check, ONE_MINUTE);
  }
})();
