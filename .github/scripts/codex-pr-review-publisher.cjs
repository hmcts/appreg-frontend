'use strict';

// Script to sanitize, publish comment

// Regexp
const MAX_COMMENT_LENGTH = 65536;
const MARKER = (sha) => `<!-- codex-pr-review:v1 head-sha=${sha} -->`;
const TRUNCATION_NOTICE =
  '\n\n[Codex review truncated to fit the GitHub comment limit.]';
const PRIVATE_KEY_PATTERN =
  /-----BEGIN[A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END[A-Z0-9 ]*PRIVATE KEY-----/gi;
const API_TOKEN_PATTERN =
  /\b(?:gh[pousr]_\w{20,}|github_pat_\w{20,}|glpat-[\w-]{20,}|sk-[\w-]{20,})\b/g;
const AWS_ACCESS_KEY_PATTERN = /\bAKIA[0-9A-Z]{16}\b/g;
const JWT_PATTERN = /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g;
const QUERY_SECRET_PATTERN =
  /([?&](?:token|api[_-]?key|password|secret|sig)=)[^&\s]+/gi;
const CONNECTION_STRING_KEY_PATTERN = /(AccountKey=)[^;\s]+/gi;
const URL_CREDENTIAL_PATTERN = /(https?:\/\/)([^\s/@:]+):([^\s/@]+)@/gi;
const BEARER_TOKEN_PATTERN = /\b(Bearer\s+)[\w.~+/=-]{16,}/gi;

function redact(text) {
  return text
    .replace(PRIVATE_KEY_PATTERN, '[REDACTED PRIVATE KEY]')
    .replace(API_TOKEN_PATTERN, '[REDACTED TOKEN]')
    .replace(AWS_ACCESS_KEY_PATTERN, '[REDACTED AWS ACCESS KEY]')
    .replace(JWT_PATTERN, '[REDACTED JWT]')
    .replace(QUERY_SECRET_PATTERN, '$1[REDACTED]')
    .replace(CONNECTION_STRING_KEY_PATTERN, '$1[REDACTED]')
    .replace(URL_CREDENTIAL_PATTERN, '$1[REDACTED]@')
    .replace(BEARER_TOKEN_PATTERN, '$1[REDACTED]');
}

function sanitizeComment(result, sha) {
  const safe = redact(String(result || '')).replaceAll('@', '@\u200b');
  const prefix = `${MARKER(sha)}\n`;
  const available = MAX_COMMENT_LENGTH - prefix.length;
  if (safe.length <= available) {
    return prefix + safe;
  }
  const limit = Math.max(0, available - TRUNCATION_NOTICE.length);
  return prefix + safe.slice(0, limit) + TRUNCATION_NOTICE;
}

function findMatchingBotComment(comments, sha) {
  // This is used to find previous reviews
  return comments
    .slice()
    .reverse()
    .find(
      (comment) =>
        comment.user &&
        comment.user.login === 'github-actions[bot]' &&
        comment.body &&
        comment.body.indexOf(MARKER(sha)) === 0,
    );
}

async function publishReview({ github, context, result }) {
  const sha = context.payload.pull_request.head.sha;
  const body = sanitizeComment(result, sha);

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    per_page: 100,
  });

  const existing = findMatchingBotComment(comments, sha);

  const payload = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body,
  };

  if (existing) {
    await github.rest.issues.updateComment({
      ...payload,
      comment_id: existing.id,
    });
  } else {
    await github.rest.issues.createComment(payload);
  }
}

module.exports = {
  MAX_COMMENT_LENGTH,
  MARKER,
  redact,
  sanitizeComment,
  findMatchingBotComment,
  publishReview,
};
