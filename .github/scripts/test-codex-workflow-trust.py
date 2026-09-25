#!/usr/bin/env python3
"""Mutation tests for the declarative workflow trust contract."""
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / ".github/scripts/check-codex-workflow-trust.rb"


class WorkflowTrustTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        shutil.copytree(ROOT / ".github/workflows", self.root / ".github/workflows")

    def check(self, expected=True):
        result = subprocess.run(
            ["ruby", str(CHECKER), str(self.root)],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode == 0, expected, result.stdout + result.stderr)

    def replace(self, filename, before, after):
        path = self.root / ".github/workflows" / filename
        source = path.read_text()
        self.assertIn(before, source)
        path.write_text(source.replace(before, after, 1))

    def test_current_contract(self):
        self.check()

    def test_feature_branch_guard_is_rejected(self):
        self.replace("codex_jira_dispatch.yml", "github.ref == format(", "github.ref != format(")
        self.check(False)

    def test_alternate_workflow_ref_is_rejected(self):
        self.replace("codex_runner_smoke.yml", "@refs/heads/{1}", "@refs/tags/{1}")
        self.check(False)

    def test_pr_review_trigger_is_rejected(self):
        for event in ("pull_request_review", "pull_request_review_comment", "pull_request_target"):
            with self.subTest(event=event):
                path = self.root / ".github/workflows/codex_pr_review_feedback.yml"
                original = path.read_text()
                self.replace(path.name, "  issue_comment:", f"  {event}:")
                self.check(False)
                path.write_text(original)

    def test_automatic_pr_review_requires_pull_request_target(self):
        self.replace("codex_pr_review.yml", "  pull_request_target:", "  pull_request:")
        self.check(False)

    def test_automatic_pr_review_requires_master_base_branch(self):
        self.replace("codex_pr_review.yml", "    branches: [master]", "    branches: [develop]")
        self.check(False)

    def test_automatic_pr_review_requires_all_configured_pr_activity(self):
        self.replace(
            "codex_pr_review.yml",
            "types: [opened, reopened, synchronize, ready_for_review]",
            "types: [opened, reopened, ready_for_review]",
        )
        self.check(False)

    def test_automatic_pr_review_rejects_draft_transition_trigger(self):
        self.replace(
            "codex_pr_review.yml",
            "types: [opened, reopened, synchronize, ready_for_review]",
            "types: [opened, reopened, synchronize, ready_for_review, converted_to_draft]",
        )
        self.check(False)

    def test_automatic_pr_review_rejects_forks(self):
        self.replace(
            "codex_pr_review.yml",
            "github.event.pull_request.head.repo.full_name == github.repository",
            "github.event.pull_request.head.repo.full_name != github.repository",
        )
        self.check(False)

    def test_automatic_pr_review_requires_draft_exclusion(self):
        self.replace(
            "codex_pr_review.yml",
            "github.event.pull_request.draft == false &&",
            "",
        )
        self.check(False)

    def test_automatic_pr_review_requires_review_state_gate(self):
        self.replace("codex_pr_review.yml", "needs: review-state\n", "")
        self.check(False)

    def test_automatic_pr_review_requires_successful_review_state_output(self):
        self.replace(
            "codex_pr_review.yml",
            "needs.review-state.outputs.skip == 'false' &&",
            "needs.review-state.outputs.skip != 'true' &&",
        )
        self.check(False)

    def test_automatic_pr_review_requires_dependency_bot_exclusion(self):
        self.replace("codex_pr_review.yml", "github.actor != 'dependabot[bot]' &&", "")
        self.check(False)

    def test_automatic_pr_review_cannot_checkout_pr_code(self):
        self.replace(
            "codex_pr_review.yml",
            "ref: ${{ github.event.pull_request.base.sha }}",
            "ref: ${{ github.event.pull_request.head.sha }}",
        )
        self.check(False)

    def test_automatic_pr_review_requires_full_base_history(self):
        self.replace("codex_pr_review.yml", "fetch-depth: 0", "fetch-depth: 1")
        self.check(False)

    def test_automatic_pr_review_cannot_fetch_a_different_head(self):
        self.replace(
            "codex_pr_review.yml",
            "${PR_HEAD_SHA}:refs/remotes/origin/codex-pr/${PR_NUMBER}",
            "refs/pull/${PR_NUMBER}/head:refs/remotes/origin/codex-pr/${PR_NUMBER}",
        )
        self.check(False)

    def test_automatic_pr_review_requires_a_verified_merge_base(self):
        self.replace("codex_pr_review.yml", "id: merge-base", "id: merge-base-disabled")
        self.check(False)

    def test_automatic_pr_review_must_diff_from_the_merge_base(self):
        self.replace(
            "codex_pr_review.yml",
            "git diff --no-ext-diff ${{ steps.merge-base.outputs.sha }} ${{ github.event.pull_request.head.sha }}",
            "git diff --no-ext-diff ${{ github.event.pull_request.base.sha }} ${{ github.event.pull_request.head.sha }}",
        )
        self.check(False)

    def test_automatic_pr_review_must_be_read_only(self):
        self.replace("codex_pr_review.yml", "permission-profile: ':read-only'", "permission-profile: ':workspace'")
        self.check(False)

    def test_automatic_pr_review_cannot_publish_before_analysis(self):
        self.replace("codex_pr_review.yml", "    needs: [review-state, analyze]", "    needs: []")
        self.check(False)

    def test_publisher_requires_successful_review_state_output(self):
        self.replace(
            "codex_pr_review.yml",
            "if: needs.review-state.outputs.skip == 'false' && needs.analyze.outputs.final_message != ''",
            "if: needs.review-state.outputs.skip != 'true' && needs.analyze.outputs.final_message != ''",
        )
        self.check(False)

    def test_automatic_pr_review_failure_is_non_blocking(self):
        self.replace("codex_pr_review.yml", "    continue-on-error: true", "    continue-on-error: false")
        self.check(False)

    def test_missing_protected_environment_is_rejected(self):
        self.replace("codex_jira_dispatch.yml", "    environment: codex-model\n", "")
        self.check(False)

    def test_publisher_environment_on_model_job_is_rejected(self):
        self.replace("codex_jira_dispatch.yml", "environment: codex-model", "environment: codex-publisher")
        self.check(False)

    def test_unknown_secret_is_rejected(self):
        self.replace("codex_jira_dispatch.yml", "secrets.CODEX_OPENAI_API_KEY", "secrets.UNRELATED_CREDENTIAL")
        self.check(False)

    def test_dynamic_secret_is_rejected(self):
        self.replace("codex_jira_dispatch.yml", "secrets.CODEX_OPENAI_API_KEY", "secrets[inputs.credential]")
        self.check(False)

    def test_post_model_execution_is_rejected(self):
        self.replace("codex_runner_smoke.yml", "\n  verify-auth-response:", "\n      - run: git status\n\n  verify-auth-response:")
        self.check(False)

    def test_publisher_on_arc_is_rejected(self):
        self.replace("codex_runner_smoke.yml", "    needs: verify-auth-response\n    runs-on: ubuntu-latest", "    needs: verify-auth-response\n    runs-on: codex-example-aks")
        self.check(False)

    def test_model_runner_group_cannot_be_omitted(self):
        self.replace("codex_jira_dispatch.yml", "      group: appreg-codex\n", "")
        self.check(False)

    def test_dispatch_sha_checkout_is_rejected(self):
        self.replace("codex_runner_smoke.yml", "github.workflow_sha", "github.sha")
        self.check(False)

    def test_implicit_write_token_is_rejected(self):
        self.replace("codex_runner_smoke.yml", "\npermissions: {}\n", "\npermissions: write-all\n")
        self.check(False)

    def test_hosted_trust_job_cannot_be_optional(self):
        self.replace("codex_trust_checks.yml", "    runs-on: ubuntu-latest",
                     "    if: false\n    runs-on: ubuntu-latest")
        self.check(False)

    def test_hosted_trust_failure_cannot_be_ignored(self):
        self.replace("codex_trust_checks.yml", "    runs-on: ubuntu-latest",
                     "    continue-on-error: true\n    runs-on: ubuntu-latest")
        self.check(False)

    def test_hosted_checker_cannot_be_guarded(self):
        self.replace("codex_trust_checks.yml",
                     "run: ruby .github/scripts/check-codex-workflow-trust.rb",
                     "run: command -v ruby && ruby .github/scripts/check-codex-workflow-trust.rb")
        self.check(False)

    def test_hosted_mutations_cannot_be_skipped(self):
        self.replace("codex_trust_checks.yml",
                     "      - name: Test workflow mutations",
                     "      - if: false\n        name: Test workflow mutations")
        self.check(False)


if __name__ == "__main__":
    unittest.main()
