#!/usr/bin/env python3
"""Security regressions for trusted Codex Jira patch verification."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path


SOURCE_DIR = Path(__file__).parent
VERIFIER_SOURCE = SOURCE_DIR / "codex-jira-verify.sh"
RUNTIME_SOURCE = SOURCE_DIR / "codex-action-runtime.sh"
PIPELINE_SOURCE = SOURCE_DIR.parents[1] / "bin" / "codex-local-pipeline.sh"
YARN_PATH = Path(".yarn/releases/yarn-4.10.3.cjs")
UNAPPROVED_PATH = Path(".github/workflows/unapproved.yml")


def run(
    command: list[str],
    *,
    cwd: Path,
    env: dict[str, str] | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        env=env,
        check=check,
        capture_output=True,
        text=True,
    )


def git(repo: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return run(["git", *args], cwd=repo)


def make_executable(path: Path) -> None:
    path.chmod(path.stat().st_mode | stat.S_IXUSR)


class CodexJiraVerifyTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.repo = self.root / "repository"
        self.output_dir = self.root / "output"
        self.plan_dir = self.root / "plan"
        self.runner_temp = self.root / "runner-temp"
        self.fake_bin = self.root / "fake-bin"

        self.repo.mkdir()
        git(self.repo, "init", "--quiet", "--initial-branch=master")
        git(self.repo, "config", "user.name", "Codex Test")
        git(self.repo, "config", "user.email", "codex-test@example.invalid")

        verifier = self.repo / ".github/scripts/codex-jira-verify.sh"
        runtime = self.repo / ".github/scripts/codex-action-runtime.sh"
        pipeline = self.repo / "bin/codex-local-pipeline.sh"
        yarn = self.repo / YARN_PATH
        for path in (verifier, runtime, pipeline, yarn):
            path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(VERIFIER_SOURCE, verifier)
        shutil.copy2(RUNTIME_SOURCE, runtime)
        shutil.copy2(PIPELINE_SOURCE, pipeline)
        yarn.write_text("// trusted test fixture\n", encoding="utf-8")
        (self.repo / ".gitignore").write_text("node_modules/\n", encoding="utf-8")

        git(self.repo, "add", "-A")
        git(self.repo, "commit", "--quiet", "-m", "base")
        git(self.repo, "update-ref", "refs/remotes/origin/master", "HEAD")

        prettier = self.repo / "node_modules/.bin/prettier"
        prettier.parent.mkdir(parents=True)
        prettier.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
        make_executable(prettier)

        self.output_dir.mkdir()
        (self.output_dir / "metadata.env").write_text(
            "branch_name=codex/formatter-side-effect\n", encoding="utf-8"
        )
        (self.output_dir / "codex-pr-body.md").write_text(
            "Generated test PR body.\n", encoding="utf-8"
        )
        self._write_plan_bundle()
        self._write_fake_git()

    def _write_plan_bundle(self, allowed_paths: tuple[Path, ...] = (YARN_PATH,)) -> None:
        plan = {
            "acceptance_criteria": ["The planned Yarn file is updated."],
            "alternatives_considered": ["No repository tooling change."],
            "assumptions": ["The fixture models a validated plan."],
            "blockers": [],
            "cross_system_change": False,
            "implementation_steps": [
                {
                    "change": "Update an approved repository file.",
                    "path": path.as_posix(),
                    "reason": "Exercise verifier path enforcement.",
                }
                for path in allowed_paths
            ],
            "problem_analysis": "Repository tooling runs while verifying a generated patch.",
            "ready_to_implement": True,
            "risk_level": "high",
            "risks": ["Repository tooling can create additional files."],
            "root_cause": "The previous verifier staged the entire worktree.",
            "scope_decision": "Limit every rebuilt patch to the validated path set.",
            "tests_required": ["Reject formatter-created files outside the plan."],
        }
        plan_bytes = (json.dumps(plan, indent=2, sort_keys=True) + "\n").encode("utf-8")
        self.plan_dir.mkdir(exist_ok=True)
        (self.plan_dir / "plan.json").write_bytes(plan_bytes)
        (self.plan_dir / "plan.sha256").write_text(
            f"{hashlib.sha256(plan_bytes).hexdigest()}\n", encoding="ascii"
        )
        (self.plan_dir / "allowed-paths.txt").write_text(
            "".join(f"{path.as_posix()}\n" for path in allowed_paths), encoding="utf-8"
        )

    def _write_fake_git(self) -> None:
        real_git = shutil.which("git")
        if not real_git:
            self.fail("git is required")
        self.fake_bin.mkdir()
        wrapper = self.fake_bin / "git"
        wrapper.write_text(
            "#!/usr/bin/env bash\n"
            "for arg in \"$@\"; do\n"
            "  if [[ \"${arg}\" == \"fetch\" ]]; then\n"
            "    exit 0\n"
            "  fi\n"
            "done\n"
            f'exec "{real_git}" "$@"\n',
            encoding="utf-8",
        )
        make_executable(wrapper)

    def _write_yarn_patch(self, source: str) -> tuple[Path, bytes]:
        yarn = self.repo / YARN_PATH
        yarn.write_text(source, encoding="utf-8")
        patch = run(
            [
                "git",
                "diff",
                "--binary",
                "--full-index",
                "--no-renames",
                "HEAD",
                "--",
                YARN_PATH.as_posix(),
            ],
            cwd=self.repo,
        ).stdout.encode("utf-8")
        self.assertTrue(patch)
        patch_path = self.output_dir / "changes.patch"
        patch_path.write_bytes(patch)
        git(self.repo, "checkout", "--", YARN_PATH.as_posix())
        return patch_path, patch

    def _run_verifier(self) -> subprocess.CompletedProcess[str]:
        environment = {
            **os.environ,
            "DEFAULT_BRANCH": "master",
            "EXPECTED_BRANCH_NAME": "codex/formatter-side-effect",
            "GITHUB_ACTIONS": "true",
            "GITHUB_RUN_ATTEMPT": "1",
            "GITHUB_RUN_ID": "formatter-side-effect-test",
            "OUTPUT_DIR": str(self.output_dir),
            "PATH": f"{self.fake_bin}{os.pathsep}{os.environ['PATH']}",
            "PLAN_DIR": str(self.plan_dir),
            "RUNNER_TEMP": str(self.runner_temp),
            "SKIP_LOCAL_PIPELINE": "true",
        }
        environment.pop("GH_TOKEN", None)
        environment.pop("SONAR_TOKEN", None)
        return run(
            ["bash", ".github/scripts/codex-jira-verify.sh"],
            cwd=self.repo,
            env=environment,
            check=False,
        )

    def test_rejects_formatter_side_effect_before_rewriting_patch(self) -> None:
        patch_path, patch = self._write_yarn_patch(
            "const fs = require('fs');\n"
            "fs.mkdirSync('.github/workflows', { recursive: true });\n"
            "fs.writeFileSync('.github/workflows/unapproved.yml', 'name: unapproved\\n');\n"
        )
        completed = self._run_verifier()

        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("formatter changes outside the validated plan", completed.stderr)
        self.assertIn(UNAPPROVED_PATH.as_posix(), completed.stderr)
        self.assertTrue((self.repo / UNAPPROVED_PATH).is_file())
        self.assertEqual(patch_path.read_bytes(), patch)
        self.assertFalse((self.output_dir / "verification.env").exists())

    def test_rebuilds_patch_from_approved_formatter_side_effects(self) -> None:
        formatted_path = Path("formatted.txt")
        self._write_plan_bundle((YARN_PATH, formatted_path))
        patch_path, original_patch = self._write_yarn_patch(
            "const fs = require('fs');\n"
            "fs.writeFileSync('formatted.txt', 'approved formatter output\\n');\n"
        )

        completed = self._run_verifier()

        self.assertEqual(completed.returncode, 0, completed.stderr)
        rebuilt_patch = patch_path.read_bytes()
        self.assertNotEqual(rebuilt_patch, original_patch)
        self.assertIn(b"diff --git a/.yarn/releases/yarn-4.10.3.cjs", rebuilt_patch)
        self.assertIn(b"diff --git a/formatted.txt", rebuilt_patch)
        self.assertTrue((self.output_dir / "verification.env").is_file())


if __name__ == "__main__":
    unittest.main()
