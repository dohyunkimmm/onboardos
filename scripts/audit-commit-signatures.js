'use strict';

// Informational only: report GitHub's canonical signature-verification decision
// for each PR commit. The actual enforcement switch is a repository ruleset.
const fs = require('node:fs');

async function main() {
  const repository = process.env.GITHUB_REPOSITORY || '';
  const token = process.env.GITHUB_TOKEN || '';
  const eventPath = process.env.GITHUB_EVENT_PATH || '';
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !token || !eventPath) {
    throw new Error('Missing GitHub Actions repository, token, or event context');
  }

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const number = event.pull_request?.number;
  if (!Number.isInteger(number)) throw new Error('Expected a pull_request event');

  const commits = [];
  for (let page = 1; page <= 30; page += 1) {
    const url = `https://api.github.com/repos/${repository}/pulls/${number}/commits?per_page=100&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status} while reading PR commits`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Expected an array of commits');
    commits.push(...batch);
    if (batch.length < 100) break;
    if (page === 30) throw new Error('PR exceeded audit pagination limit');
  }

  // For GitHub's actual branch rule, ONLY "verified" is authoritative.
  const unsigned = commits.filter((entry) => entry.commit?.verification?.verified !== true);
  const safeReason = (entry) => {
    const reason = entry.commit?.verification?.reason;
    return /^[a-z_]+$/.test(reason || '') ? reason : 'not_verified';
  };
  const rows = unsigned.map((entry) => {
    const sha = String(entry.sha || '').slice(0, 12);
    console.log(`::warning title=Unverified PR commit::Commit ${sha} is ${safeReason(entry)}; enable signing before enforcing the repository ruleset.`);
    return `| \`${sha}\` | \`${safeReason(entry)}\` |`;
  });

  const summary = [
    '## Commit signature readiness (audit only)',
    '',
    `GitHub-verified commits: **${commits.length - unsigned.length}/${commits.length}**.`,
    '',
    'This audit is informational and does **not** enforce signed commits. The',
    '`Require signed commits` repository ruleset is the enforcement mechanism.',
    '',
    ...(rows.length ? ['| Unverified commit | GitHub reason |', '| --- | --- |', ...rows] : ['All commits are verified by GitHub.']),
    '',
    'See [commit signing instructions](https://github.com/dohyunkimmm/onboardos/blob/main/.github/COMMIT_SIGNING.md) or the repository documentation.',
    '',
  ].join('\n');

  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  process.stdout.write(`Commit signature audit: ${commits.length - unsigned.length}/${commits.length} verified; ${unsigned.length} need attention.\n`);
}

main().catch((error) => {
  // A broken audit must not silently claim commits are verified.
  console.error(error.message);
  process.exitCode = 1;
});
