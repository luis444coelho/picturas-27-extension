"""Regression tests for reporting failures, skips and managed test accounts."""

import contextlib
import io
import json
from pathlib import Path
import stat
import sys
import tempfile
import unittest
from unittest.mock import patch

import mvp


class FeedbackTest(unittest.TestCase):
    def test_skipped_tap_is_partial_even_with_successful_exit(self):
        counts = mvp.test_counts(
            "# tests 3\n# pass 2\n# fail 0\n# cancelled 0\n# skipped 1\n# todo 0\n", "tap"
        )
        self.assertEqual(mvp.test_status(0, counts, "tap"), "PARTIAL")

    def test_failure_is_not_hidden_by_partial_output_or_zero_exit(self):
        self.assertEqual(mvp.test_status(1, None, "tap"), "FAIL")
        self.assertEqual(mvp.test_status(0, {"tests": 2, "fail": 1}, "tap"), "FAIL")
        self.assertEqual(mvp.test_status(0, {"tests": 1, "cancelled": 1}, "tap"), "FAIL")

    def test_missing_or_empty_test_summary_is_not_a_pass(self):
        self.assertEqual(mvp.test_status(0, None, "tap"), "ERROR")
        self.assertEqual(mvp.test_status(0, {"tests": 0}, "tap"), "ERROR")

    def test_python_errors_and_skips_are_counted(self):
        counts = mvp.test_counts(
            "Ran 8 tests in 0.42s\n\nFAILED (failures=1, errors=1, skipped=2)\n", "python"
        )
        self.assertEqual(counts, {"tests": 8, "pass": 4, "fail": 2, "skipped": 2})

    def test_bun_results_and_static_check_are_distinct(self):
        counts = mvp.test_counts("\n 8 pass\n 0 fail\n", "bun")
        self.assertEqual(counts["tests"], 8)
        self.assertEqual(mvp.test_status(0, counts, "bun"), "PASS")
        self.assertEqual(mvp.test_status(0, None, None), "PASS")

    def test_storage_secret_is_not_in_report_command(self):
        command = ["docker", "exec", "-e", "VIDEO_E2E_S3_SECRET=test-secret", "node"]
        self.assertNotIn("test-secret", " ".join(mvp.public_command(command)))
        self.assertIn("test-secret", " ".join(command))


class ManagedEnvironmentTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.args = type("Args", (), {
            "output": Path(self.directory.name), "project": None,
            "url": "https://localhost:8080", "command": "test", "only": ["unit"],
        })()
        self.run = mvp.Run(self.args)

    def test_partial_account_creation_preserves_id_and_does_not_duplicate_it(self):
        calls = []

        def first_api(method, route, body=None, token=None):
            calls.append((method, body))
            if body["type"] == "premium":
                return 503, None
            return 201, {"user": {"_id": "free-id"}, "jwt": "free-jwt"}

        with patch.object(self.run, "api", side_effect=first_api), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(RuntimeError):
                self.run.accounts()
        target = self.args.output / "environment/accounts.json"
        data = json.loads(target.read_text())
        self.assertEqual([a["id"] for a in data["accounts"]], ["free-id"])
        self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o600)

        def retry_api(method, route, body=None, token=None):
            if method == "GET":
                self.assertEqual(token, "free-jwt")
                return 200, {}
            self.assertEqual(body["type"], "premium")
            return 201, {"user": {"_id": "premium-id"}, "jwt": "premium-jwt"}

        with patch.object(self.run, "api", side_effect=retry_api), contextlib.redirect_stdout(io.StringIO()):
            self.run.accounts()
        self.assertEqual(len(json.loads(target.read_text())["accounts"]), 2)
        summary = (self.run.report / "summary.json").read_text()
        self.assertNotIn("free-jwt", summary)
        self.assertNotIn(data["accounts"][0]["password"], summary)

    def test_accounts_from_another_environment_are_not_reused(self):
        target = self.args.output / "environment/accounts.json"
        mvp.write_json(target, {"url": "https://different.invalid", "project": None, "accounts": []})
        with patch.object(self.run, "api") as api:
            with self.assertRaises(RuntimeError):
                self.run.accounts()
            api.assert_not_called()

    def test_storage_failure_has_a_specific_diagnostic_without_copying_raw_logs(self):
        result = type("Result", (), {"stdout": "No writable volumes and no free volumes left https://secret.invalid"})()
        with patch.object(mvp.subprocess, "run", return_value=result), contextlib.redirect_stdout(io.StringIO()):
            # Stub save: the mock is only the Docker call, not a Git invocation.
            with patch.object(self.run, "save"):
                self.run.diagnose_storage("2026-10-23T00:00:00+00:00")
        self.assertEqual(len(self.run.diagnostics), 1)
        self.assertNotIn("secret.invalid", self.run.diagnostics[0])

    def test_report_can_be_written_from_a_delivery_archive_without_git(self):
        with patch.object(mvp.shutil, "which", return_value=None):
            self.run.save()
        report = json.loads((self.run.report / "summary.json").read_text())
        self.assertEqual(report["revision"], "arquivo sem Git")

    def test_selected_but_unexecuted_suites_return_partial(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(self.run.finish(), 2)

    def test_actual_child_failure_is_recorded_and_does_not_prevent_next_step(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.run.step("failing-child", [sys.executable, "-c", "raise SystemExit(7)"],
                          suite="unit-projects", kind="tap", required=False)
            self.run.step("next-child", [sys.executable, "-c", "print('next step ran')"])
            result = self.run.finish()
        self.assertEqual(result, 1)
        summary = json.loads((self.run.report / "summary.json").read_text())
        suite = next(s for s in summary["suites"] if s["id"] == "unit-projects")
        self.assertEqual(suite["status"], "FAIL")
        self.assertEqual(suite["returncode"], 7)
        self.assertEqual(summary["steps"][1]["status"], "PASS")


if __name__ == "__main__":
    unittest.main()
