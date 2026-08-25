import { toProxyForwardingLogMessage } from '../../../server/utils/proxy-forwarding-log-message';

describe('toProxyForwardingLogMessage', () => {
  it('logs only the pathname for sensitive application list entry searches', () => {
    const message = toProxyForwardingLogMessage(
      '/application-list-entries?applicantSurname=SyntheticApplicant&respondentSurname=SyntheticRespondent&respondentPostcode=AB1%202CD&accountReference=SYNTHETIC-ACC-1&pageNumber=0&pageSize=10',
      true,
    );

    expect(message).toBe(
      '[proxy] forwarding /application-list-entries tokenPresent=true',
    );
    expect(message).not.toContain('SyntheticApplicant');
    expect(message).not.toContain('SyntheticRespondent');
    expect(message).not.toContain('AB1%202CD');
    expect(message).not.toContain('SYNTHETIC-ACC-1');
  });

  it('preserves the token flag in the log message', () => {
    expect(
      toProxyForwardingLogMessage('/reports/activity-audit/jobs', false),
    ).toBe(
      '[proxy] forwarding /reports/activity-audit/jobs tokenPresent=false',
    );
  });
});
