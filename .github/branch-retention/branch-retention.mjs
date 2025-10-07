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

(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await main();
})();

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
      doNotDelete: {
        label: 'do-not-delete',
        namePatterns: ['do-not-delete/*', '*[do-not-delete]*'],
      },
      notify: {
        teamsWebhookSecret: 'TEAMS_WEBHOOK_URL',
        githubIssueLabel: 'branch-cleanup',
      },
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

  const candidates = [];
  const scanned = [];

  const namePatterns =
    doNotDelete && Array.isArray(doNotDelete.namePatterns)
      ? doNotDelete.namePatterns
      : [];
  const dndLabel = doNotDelete && doNotDelete.label ? doNotDelete.label : '';

  for (const b of branches) {
    const name = b.name;
    const protectedByPattern = anyMatch(name, protectedPatterns || []);
    const doNotDeleteByName = anyMatch(name, namePatterns);

    const commit = await getCommit(b.commit.sha);
    const inactive = daysAgo(commit.date) >= inactivityDays;

    const openPR = await hasOpenPRForBranch(name);
    const doNotDeleteByLabel = await prHasLabelForBranch(name, dndLabel);

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

    scanned.push({
      branch: name,
      lastCommitDate: commit.date,
      lastCommitSHA: commit.sha,
      author: commit.author,
      inactiveDays: daysAgo(commit.date),
      excludedReasons: reasons,
    });

    if (
      inactive &&
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

async function postTeams(config, payload) {
  const secretName =
    (config.notify && config.notify.teamsWebhookSecret) || 'TEAMS_WEBHOOK_URL';
  const webhook = process.env[secretName || 'TEAMS_WEBHOOK_URL'];
  if (!webhook) {
    return;
  }

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: [
        `Branch cleanup (dry-run): ${payload.candidates.length} candidate(s)`,
        ...payload.candidates
          .slice(0, 10)
          .map(
            (c) => `• ${c.branch} (${c.inactiveDays}d, ${c.lastCommitDate})`,
          ),
        payload.candidates.length > 10
          ? `…and ${payload.candidates.length - 10} more`
          : '',
      ].join('\n'),
      summary: 'Branch cleanup (dry run)',
    }),
  }).catch(() => {});
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

  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: `${label},dry-run`,
    per_page: 50,
  });

  const now = new Date();
  issues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  let target = null;
  for (const is of issues) {
    const payload = parseJsonBlockFromIssue(is.body || '');
    if (!payload || !payload.candidates) {
      continue;
    }
    const notifiedAtLine = (is.body || '')
      .split('\n')
      .find((l) => l.startsWith('**Notified at:**'));
    const notifiedAt = notifiedAtLine
      ? notifiedAtLine.split('**Notified at:**')[1].trim()
      : is.created_at;
    const readyAt = new Date(isoPlusDays(notifiedAt, config.graceDays || 7));
    if (readyAt <= now) {
      target = { issue: is, payload, readyAt };
      break;
    }
  }

  if (!target) {
    return;
  }

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
      const namePatterns =
        config.doNotDelete && Array.isArray(config.doNotDelete.namePatterns)
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
              `- \`${d.branch}\` @ \`${d.lastCommitSHA.slice(
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
  await postTeams(config, payload);
}

async function main() {
  const config = await loadConfig();
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
