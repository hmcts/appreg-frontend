'use strict';

const path = require('node:path');

process.env.NODE_CONFIG_DIR =
  process.env.NODE_CONFIG_DIR || path.resolve(process.cwd(), 'config');
process.env.PV_PRELOADED = '1';

const config = require('config');

try {
  const pvm = require('@hmcts/properties-volume');
  const _ = require('lodash');
  pvm.addTo(config);
  const aik = _.get(config, 'secrets.rpe.AppInsightsInstrumentationKey');
  if (aik) {_.set(config, 'appInsights.instrumentationKey', aik);}
} catch (_err) {
  // ignore
  void _err;
}
