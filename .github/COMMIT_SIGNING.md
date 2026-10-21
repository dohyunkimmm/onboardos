# Commit signing and required-signature rollout

This repository currently protects `main` with PR-only changes, verified CI checks,
non-fast-forward protection, and linear history. The active ruleset is
[`protect-main`](https://github.com/dohyunkimmm/onboardos/settings/rules/24772212).

## Current status: audit-only

The [Commit signature readiness](./workflows/commit-signature-audit.yml)
workflow reports GitHub's `commit.verification.verified` for every PR commit.
It **does not block merging on unsigned commits**; the check should not be
mistaken for enforcing signatures. Signatures must be enforced with GitHub's
`Require signed commits` ruleset after all contribution methods work.

Historical audit (2026-10-22):
- Dependabot PR #108 and #111 commits: verified.
- Work PR #113 and all seven commits of #115: unsigned.
- GitHub Contents API commits produced by the current ChatGPT GitHub connection:
  unsigned; require a signed-commit-capable workflow before enforcing the rule.

## Ways to create verified commits

### Edit through the GitHub web interface

GitHub automatically signs commits made through its web interface. Check the
**Verified** badge on the commit before using this workflow to validate PRs.

### Local Git: SSH signing (Git 2.34+)

Generate a dedicated signing key locally if you do not already have one:

```sh
ssh-keygen -t ed25519 -C "git commit signing" -f ~/.ssh/id_ed25519_signing
```

On GitHub, open **Settings > SSH and GPG keys > New SSH key** and choose
**Key type: Signing key**. Upload only the **public** contents of
`~/.ssh/id_ed25519_signing.pub`; never upload your private key. You can also
use `gh ssh-key add ~/.ssh/id_ed25519_signing.pub --type signing`.

Configure Git on the machine making commits:

```sh
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519_signing.pub
git config --global commit.gpgsign true
```

Ensure `user.email` is an email verified in your GitHub account, commit to a
test branch, and confirm GitHub displays **Verified** on the commit. For a
single commit use `git commit -S` if your global configuration is off.
GitHub Desktop uses your Git signing configuration.

### Dependabot and API-based contributors

Dependabot-created commits have been observed as verified, but **verify every
automation path before enabling enforcement**. The GitHub Contents API used by
the current connected automation creates unsigned branch commits. If required
signatures are turned on now, PRs with these commits may be blocked even when
GitHub would sign the final squash commit. Use a signing-capable Git client,
GitHub web editor, or another verified signing route for all such changes.

## When to turn on enforcement

1. Confirm **Verified** on every commit of at least one ordinary human PR and
   one PR made by each bot or automation still used for this repository.
2. Resolve any unsigned commits by rewriting/signing *only the feature branch*
   (never rewrite protected `main` history). Respect collaborators before
   rewriting shared branches.
3. Run the standard PR CI and confirm checks pass.
4. In [`protect-main`](https://github.com/dohyunkimmm/onboardos/settings/rules/24772212),
   enable **Require signed commits**, keeping every existing protection.
5. Prove that a deliberately unsigned test PR is blocked; close the PR and
   delete the test branch without merging.
6. Record results in [issue #114](https://github.com/dohyunkimmm/onboardos/issues/114).

References: [GitHub signing documentation](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
and [Ruleset rule behavior](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).
