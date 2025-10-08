import fs from 'node:fs/promises';
import path from 'node:path';

import { Octokit } from '@octokit/rest';
import { Minimatch } from 'minimatch';
import YAML from 'yaml';

// Repo env
const repoEnv = process.env.GITHUB_REPOSITORY || '';
const [owner, repo] = repoEnv.split('/');
const token = process.env.GITHUB_TOKEN;
if (!owner || !repo || !token) {
  process.exit(1);
}
const octokit = new Octokit({ auth: token });

const MODE = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1]
  : process.env.MODE || 'dry-run'; // dry-run | enforce | auto

const OUT_DIR = path.join('.github', 'branch-retention', 'out');

async function loadConfig() {
  const cfgPath = path.join(
    '.github',
    'branch-retention',
    'branch-retention.yml',
  );
  try {
    const yml = await fs.readFile(cfgPath, 'utf8');
    return YAML.parse(yml);
  } catch (err) {
    void err;
    return {
      inactivityDays: 60,
      graceDays: 7,
      protectedPatterns: ['master', 'develop', 'release/*'],
      autoDeletePatterns: [],
      doNotDelete: {
        label: 'do-not-delete',
        namePatterns: ['do-not-delete/*', '*[do-not-delete]*'],
      },
      notify: { githubIssueLabel: 'branch-cleanup' },
    };
  }
}

function daysAgo(date) {
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function anyMatch(name, patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return false;
  }
  return patterns.some((p) => new Minimatch(p).match(name));
}

async function listBranches() {
  return octokit.paginate(octokit.rest.repos.listBranches, {
    owner,
    repo,
    per_page: 100,
  });
}

async function getCommit(sha) {
  const { data } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

  const commit = data && data.commit ? data.commit : {};
  const authorDate =
    commit.author && commit.author.date ? commit.author.date : undefined;
  const committerDate =
    commit.committer && commit.committer.date
      ? commit.committer.date
      : undefined;
  const authored = authorDate || committerDate;

  const login =
    data.author && data.author.login ? data.author.login : undefined;
  const commitAuthorName =
    commit.author && commit.author.name ? commit.author.name : undefined;
  const commitCommitterName =
    commit.committer && commit.committer.name
      ? commit.committer.name
      : undefined;
  const authorName =
    login || commitAuthorName || commitCommitterName || 'unknown';

  return { date: authored, author: authorName, sha: data.sha };
}

async function hasOpenPRForBranch(branch) {
  const prs = await octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: 'open',
    per_page: 100,
    head: `${owner}:${branch}`,
  });
  return prs.length > 0;
}

async function prHasLabelForBranch(branch, label) {
  if (!label) {
    return false;
  }

  const prs = await octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: 'all',
    head: `${owner}:${branch}`,
    per_page: 100,
  });
  return prs.some((pr) => {
    const labels = Array.isArray(pr.labels) ? pr.labels : [];
    return labels.some((l) =>
      typeof l === 'string' ? l === label : l && l.name === label,
    );
  });
}

async function computeCandidates(config) {
  const { inactivityDays, protectedPatterns, doNotDelete } = config;
  const branches = await listBranches();
  const autoDeletePatterns = Array.isArray(config.autoDeletePatterns)
    ? config.autoDeletePatterns
    : [];

  const candidates = [];
  const scanned = [];

  for (const b of branches) {
    const name = b.name;
    const protectedByPattern = anyMatch(name, protectedPatterns || []);
    const doNotDeleteByName = anyMatch(
      name,
      doNotDelete && Array.isArray(doNotDelete.namePatterns)
        ? doNotDelete.namePatterns
        : [],
    );
    const forcedByPattern = anyMatch(name, autoDeletePatterns);

    const commit = await getCommit(b.commit.sha);
    const inactive = daysAgo(commit.date) >= inactivityDays;
    const eligibleByInactivity = inactive || forcedByPattern;

    const openPR = await hasOpenPRForBranch(name);
    let doNotDeleteByLabel = false;

    if (
      eligibleByInactivity &&
      !protectedByPattern &&
      !doNotDeleteByName &&
      !openPR
    ) {
      const dndLabel =
        doNotDelete && doNotDelete.label ? doNotDelete.label : '';
      doNotDeleteByLabel = await prHasLabelForBranch(name, dndLabel);
    }

    const reasons = [];
    if (protectedByPattern) {
      reasons.push('protected-pattern');
    }
    if (doNotDeleteByName) {
      reasons.push('do-not-delete-name');
    }
    if (doNotDeleteByLabel) {
      reasons.push('do-not-delete-label');
    }
    if (openPR) {
      reasons.push('open-pr');
    }
    if (!inactive) {
      reasons.push('not-inactive');
    }
    if (!eligibleByInactivity) {
      reasons.push('not-inactive');
    }
    if (forcedByPattern) {
      reasons.push('auto-delete-pattern');
    }

    scanned.push({
      branch: name,
      lastCommitDate: commit.date,
      lastCommitSHA: commit.sha,
      author: commit.author,
      inactiveDays: daysAgo(commit.date),
      excludedReasons: reasons,
    });

    if (
      eligibleByInactivity &&
      !protectedByPattern &&
      !doNotDeleteByName &&
      !doNotDeleteByLabel &&
      !openPR
    ) {
      candidates.push({
        branch: name,
        lastCommitDate: commit.date,
        lastCommitSHA: commit.sha,
        author: commit.author,
        inactiveDays: daysAgo(commit.date),
      });
    }
  }
  return { scanned, candidates };
}

function toMarkdownTable(rows) {
  const header = `| Branch | Last Commit Date | Author | Last SHA | Inactive (days) |
|---|---|---|---|---|`;
  const lines = rows.map(
    (r) =>
      `| \`${r.branch}\` | ${r.lastCommitDate} | ${r.author} | \`${(
        r.lastCommitSHA || ''
      ).slice(0, 7)}\` | ${r.inactiveDays} |`,
  );
  return [header, ...lines].join('\n');
}

async function ensureLabel(name, color = 'ededed', description = '') {
  try {
    const existing = await octokit.paginate(
      octokit.rest.issues.listLabelsForRepo,
      { owner, repo, per_page: 100 },
    );
    if (!existing.find((l) => l.name === name)) {
      await octokit.rest.issues
        .createLabel({ owner, repo, name, color, description })
        .catch(() => {});
    }
  } catch {
    /* noop */
  }
}

async function findOrCreatePendingIssue(config, payload) {
  const label =
    (config.notify && config.notify.githubIssueLabel) || 'branch-cleanup';
  const mentions = Array.isArray(config.notify && config.notify.mentions)
    ? config.notify.mentions
    : [];
  const assignees = Array.isArray(config.notify && config.notify.assignees)
    ? config.notify.assignees
    : [];

  await ensureLabel(label, '0e8a16', 'Branch cleanup batch');
  await ensureLabel('dry-run', '5319e7', 'Awaiting grace period');
  await ensureLabel('enforced', 'd93f0b', 'Deletion completed');

  const title = `[Branch Cleanup] Candidates – ${new Date()
    .toISOString()
    .slice(0, 10)}`;
  const body = [
    '**Status:** _dry run – awaiting grace period_',
    '',
    `**Notified at:** ${new Date().toISOString()}`,
    '',
    mentions.length ? `**Pinging:** ${mentions.join(' ')}` : '',
    '',
    '### Candidates',
    toMarkdownTable(payload.candidates),
    '',
    '### JSON (machine-readable)',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    '',
    '> This issue was created by a scheduled workflow. Do not edit the JSON block.',
  ].join('\n');

  const { data: created } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
    labels: [label, 'dry-run'],
    assignees,
  });
  return created;
}

function parseJsonBlockFromIssue(body) {
  const start = body.indexOf('```json');
  const end = body.indexOf('```', start + 7);
  if (start === -1 || end === -1) {
    return null;
  }
  try {
    return JSON.parse(body.slice(start + 7, end).trim());
  } catch (err) {
    void err;
    return null;
  }
}

function isoPlusDays(iso, days) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

async function enforce(config) {
  const label =
    (config.notify && config.notify.githubIssueLabel) || 'branch-cleanup';
  const markerLabels = Array.isArray(config.notify?.markerLabels)
    ? config.notify.markerLabels
    : ['dry-run', 'run', 'pending']; // accept any of these markers

  // 1) Pull open issues with the primary label; filter marker in code (more reliable)
  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: label,
    per_page: 100,
  });

  // Debug: show what we see
  console.log(
    'Open issues with label',
    label,
    issues.map((i) => ({
      n: i.number,
      title: i.title,
      labels: (i.labels || []).map((l) => (typeof l === 'string' ? l : l.name)),
    })),
  );

  const now = new Date();
  issues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  let target = null;
  for (const is of issues) {
    const labelNames = (is.labels || []).map((l) =>
      typeof l === 'string' ? l : l.name,
    );
    const hasBatchMarker = markerLabels.some((m) => labelNames.includes(m));
    if (!hasBatchMarker) {
      continue;
    }

    const payload = parseJsonBlockFromIssue(is.body || '');
    if (!payload || !payload.candidates) {
      continue;
    }

    // Robust "Notified at" parsing; fall back to issue creation time
    const m = (is.body || '').match(/\*\*Notified at:\*\*\s*([0-9T:\.\-Z]+)/);
    const notifiedAtISO = m ? m[1] : is.created_at;

    // If graceDays <= 0, make it immediately eligible
    const readyAt =
      (config.graceDays || 0) <= 0
        ? new Date(0)
        : new Date(isoPlusDays(notifiedAtISO, config.graceDays));

    if (readyAt <= now) {
      target = { issue: is, payload, readyAt };
      break;
    }
  }

  if (!target) {
    console.log(
      'No eligible dry-run batch issue found (open, labeled, grace satisfied).',
    );
    return;
  }

  // 2) Recompute current candidates, then intersect with original payload
  const current = await computeCandidates(config);
  const currentSet = new Set(current.candidates.map((c) => c.branch));
  const survivors = target.payload.candidates.filter((c) =>
    currentSet.has(c.branch),
  );

  const deleted = [];
  const skipped = [];

  for (const c of survivors) {
    try {
      const stillOpenPR = await hasOpenPRForBranch(c.branch);
      const stillHasPRLabel = await prHasLabelForBranch(
        c.branch,
        (config.doNotDelete && config.doNotDelete.label) || '',
      );
      const stillProtected = anyMatch(c.branch, config.protectedPatterns || []);
      const namePatterns = Array.isArray(config.doNotDelete?.namePatterns)
        ? config.doNotDelete.namePatterns
        : [];
      const byName = anyMatch(c.branch, namePatterns);

      if (stillOpenPR || stillHasPRLabel || stillProtected || byName) {
        skipped.push({ ...c, reason: 'recheck-exclusion' });
        continue;
      }

      await octokit.rest.git.deleteRef({
        owner,
        repo,
        ref: `heads/${c.branch}`,
      });
      deleted.push({ ...c, deletedAt: new Date().toISOString() });
    } catch (e) {
      skipped.push({
        ...c,
        reason: `error: ${e.status || ''} ${e.message || e}`,
      });
    }
  }

  const body = [
    `**Enforcement run at:** ${new Date().toISOString()}`,
    '',
    `### Deleted (${deleted.length})`,
    deleted.length
      ? deleted
          .map(
            (d) =>
              `- \`${d.branch}\` @ \`${(d.lastCommitSHA || '').slice(
                0,
                7,
              )}\` by ${d.author} (deleted ${d.deletedAt})`,
          )
          .join('\n')
      : '_none_',
    '',
    `### Skipped (${skipped.length})`,
    skipped.length
      ? skipped.map((s) => `- \`${s.branch}\` (${s.reason})`).join('\n')
      : '_none_',
    '',
    '### JSON (deleted)',
    '```json',
    JSON.stringify({ deleted, skipped }, null, 2),
    '```',
  ].join('\n');

  await fs.writeFile(
    path.join(OUT_DIR, `deleted-${Date.now()}.json`),
    JSON.stringify({ deleted, skipped }, null, 2),
  );

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: target.issue.number,
    body,
  });

  await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: target.issue.number,
    state: 'closed',
    labels: [
      ...target.issue.labels.map((l) => (typeof l === 'string' ? l : l.name)),
      'enforced',
    ],
  });
}

async function dryRun(config) {
  const { scanned, candidates } = await computeCandidates(config);
  await fs.writeFile(
    path.join(OUT_DIR, `scanned-${Date.now()}.json`),
    JSON.stringify(scanned, null, 2),
  );
  await fs.writeFile(
    path.join(OUT_DIR, `candidates-${Date.now()}.json`),
    JSON.stringify(candidates, null, 2),
  );

  const payload = { candidates, generatedAt: new Date().toISOString() };
  await findOrCreatePendingIssue(config, payload);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const config = await loadConfig();
  console.log('Policy loaded: .github/branch-retention/branch-retention.yml');
  console.log(
    'graceDays =',
    config.graceDays,
    'inactivityDays =',
    config.inactivityDays,
  );
  if (MODE === 'dry-run') {
    return dryRun(config);
  }
  if (MODE === 'enforce') {
    return enforce(config);
  }
  return dryRun(config);
}

main().catch(() => {
  process.exit(1);
});
