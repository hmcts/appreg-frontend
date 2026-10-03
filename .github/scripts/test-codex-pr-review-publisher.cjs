'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  MAX_COMMENT_LENGTH,
  MARKER,
  redact,
  sanitizeComment,
  findMatchingBotComment,
} = require('./codex-pr-review-publisher.cjs');

const REDACTION_CASES = [
  [
    'private keys',
    '-----BEGIN PRIVATE KEY-----secret-----END PRIVATE KEY-----',
    '[REDACTED PRIVATE KEY]',
  ],
  ['GitHub tokens', 'ghp_123456789012345678901234567890', '[REDACTED TOKEN]'],
  [
    'GitHub fine-grained tokens',
    'github_pat_123456789012345678901234567890',
    '[REDACTED TOKEN]',
  ],
  ['GitLab tokens', 'glpat-123456789012345678901234567890', '[REDACTED TOKEN]'],
  ['OpenAI tokens', 'sk-123456789012345678901234567890', '[REDACTED TOKEN]'],
  ['AWS access keys', 'AKIA1234567890ABCDEF', '[REDACTED AWS ACCESS KEY]'],
  ['JWTs', 'eyJheader.payload.signature', '[REDACTED JWT]'],
  [
    'query-string secrets',
    '?token=value&api-key=key&password=pass&secret=secret&sig=signature',
    '?token=[REDACTED]&api-key=[REDACTED]&password=[REDACTED]&secret=[REDACTED]&sig=[REDACTED]',
  ],
  [
    'connection-string keys',
    'Server=tcp:example;AccountKey=connection-secret;',
    'Server=tcp:example;AccountKey=[REDACTED];',
  ],
  [
    'URL credentials',
    'https://user:password@example.test',
    'https://[REDACTED]@example.test',
  ],
  ['Bearer tokens', 'Bearer abcdefghijklmnop', 'Bearer [REDACTED]'],
];

for (const [name, input, expected] of REDACTION_CASES) {
  test(`redacts ${name}`, () => {
    assert.equal(redact(input), expected);
  });
}

test('preserves ordinary findings during redaction', () => {
  assert.equal(
    redact('Finding: simplify this branch.'),
    'Finding: simplify this branch.',
  );
});

test('neutralizes mentions and caps the complete marked comment', () => {
  const output = sanitizeComment(
    '@owner ' + 'x'.repeat(MAX_COMMENT_LENGTH),
    'a'.repeat(40),
  );
  assert.match(output, /^<!-- codex-pr-review:v1 head-sha=a{40} -->/);
  assert.ok(output.length <= MAX_COMMENT_LENGTH);
  assert.match(output, /truncated to fit/);
  assert.doesNotMatch(output, /@owner/);
});

test('allows a comment whose content exactly reaches the limit', () => {
  const sha = 'd'.repeat(40);
  const prefix = `${MARKER(sha)}\n`;
  const output = sanitizeComment(
    'x'.repeat(MAX_COMMENT_LENGTH - prefix.length),
    sha,
  );
  assert.equal(output.length, MAX_COMMENT_LENGTH);
  assert.doesNotMatch(output, /truncated to fit/);
});

test('truncates an over-limit comment while retaining its marker and notice', () => {
  const sha = 'e'.repeat(40);
  const output = sanitizeComment('x'.repeat(MAX_COMMENT_LENGTH + 1), sha);
  assert.equal(output.length, MAX_COMMENT_LENGTH);
  assert.match(output, new RegExp(`^${MARKER(sha)}`));
  assert.match(output, /truncated to fit/);
});

test('selects only the latest same-SHA Actions comment for retry updates', () => {
  const sha = 'b'.repeat(40);
  const comments = [
    {
      id: 1,
      user: { login: 'github-actions[bot]' },
      body: MARKER(sha) + '\nold',
    },
    { id: 2, user: { login: 'alice' }, body: MARKER(sha) + '\nspoof' },
    {
      id: 3,
      user: { login: 'github-actions[bot]' },
      body: MARKER(sha) + '\nlatest',
    },
  ];
  assert.equal(findMatchingBotComment(comments, sha).id, 3);
  assert.equal(findMatchingBotComment(comments, 'c'.repeat(40)), undefined);
});

test('ignores malformed, user-authored, and non-prefix markers', () => {
  const sha = 'f'.repeat(40);
  const comments = [
    {
      id: 1,
      user: { login: 'github-actions[bot]' },
      body: `text ${MARKER(sha)}`,
    },
    {
      id: 2,
      user: { login: 'github-actions[bot]' },
      body: MARKER('a'.repeat(39)),
    },
    { id: 3, user: { login: 'alice' }, body: MARKER(sha) },
    { id: 4, body: MARKER(sha) },
  ];
  assert.equal(findMatchingBotComment(comments, sha), undefined);
});

test('does not mutate the comment collection while selecting a match', () => {
  const sha = '1'.repeat(40);
  const comments = [
    { id: 1, user: { login: 'github-actions[bot]' }, body: MARKER(sha) },
  ];
  findMatchingBotComment(comments, sha);
  assert.equal(comments[0].id, 1);
});
