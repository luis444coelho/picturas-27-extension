#!/usr/bin/env python3
"""Preparar o ambiente e executar as suites existentes de vídeo do MVP."""

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import signal
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid


ROOT = Path(__file__).resolve().parents[1]
SERVICES = [
    "nginx", "frontend", "api_gateway", "projects", "users", "ws_gateway",
    "video_worker", "img_storage", "brightness_tool",
]
GROUPS = ("unit", "frontend", "integration", "browser")
FIXTURES = {
    "b004": ("basic_edit", ("base.mp4", "long.mp4", "image.png")),
    "b005": ("visual_edit", ("quad.mp4", "long.mp4", "logo.png")),
    "b007": ("convert", ("base.mp4", "base.mov", "silent.mp4", "incompatible.avi")),
    "b008": ("composition", ("wide.mp4", "tall.mp4", "short.mp4", "mark.png")),
}
UNIT_FILES = [
    "domain", "maintenance", "tasks", "access", "ingest", "task-domain",
    "basic-edits", "visual-edits", "convert", "composition", "result-name",
]
FRONTEND_FILES = ["chain", "visual", "edit", "access", "project", "task-state"]
INTEGRATION = {
    "integration-b004": ("b004", "e2e-basic-edits.test.js"),
    "integration-b005": ("b005", "e2e-visual-edits.test.js"),
    "integration-b007": ("b007", "e2e-convert.test.js"),
    "integration-b008": ("b008", "e2e-composition.test.js"),
}
SUITES = {
    "unit-projects": "unit", "unit-worker": "unit",
    "frontend-node": "frontend", "frontend-bun": "frontend",
    "frontend-types": "frontend",
    **{name: "integration" for name in INTEGRATION},
    "browser-visual": "browser", "browser-panels": "browser",
}
LABELS = {
    "PASS": "APROVADO", "FAIL": "FALHOU", "PARTIAL": "PARCIAL",
    "NOT_RUN": "NÃO EXECUTADO", "ERROR": "ERRO", "INTERRUPTED": "INTERROMPIDO",
}


def write_json(path, value):
    """Atomic private files: account tokens/passwords must never be Git artefacts."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    os.replace(temporary, path)
    path.chmod(0o600)


def public_command(command):
    return [re.sub(r"^(VIDEO_E2E_S3_SECRET)=.*", r"\1=<redigido>", item)
            for item in command]


def test_counts(output, kind):
    if kind == "tap":
        counts = {}
        for key, value in re.findall(
            r"^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$", output, re.M
        ):
            counts[key] = int(value)
        return counts or None
    if kind == "python":
        found = re.search(r"^Ran (\d+) tests? in ", output, re.M)
        if not found:
            return None
        counts = {"tests": int(found[1]), "fail": 0, "skipped": 0}
        for key, value in re.findall(r"(failures|errors|skipped)=(\d+)", output):
            counts["skipped" if key == "skipped" else "fail"] += int(value)
        counts["pass"] = counts["tests"] - counts["fail"] - counts["skipped"]
        return counts
    if kind == "bun":
        counts = {key: int(value) for value, key in re.findall(
            r"^\s*(\d+) (pass|fail|skip)\b", output, re.M
        )}
        if counts:
            counts["skipped"] = counts.pop("skip", 0)
            counts["tests"] = sum(counts.get(k, 0) for k in ("pass", "fail", "skipped"))
            return counts
    return None


def test_status(returncode, counts, kind):
    if returncode:
        return "FAIL"
    if kind and (not counts or counts.get("tests", 0) == 0):
        return "ERROR"
    if counts and (counts.get("fail", 0) or counts.get("cancelled", 0)):
        return "FAIL"
    if counts and (counts.get("skipped", 0) or counts.get("todo", 0)):
        return "PARTIAL"
    return "PASS"


class Run:
    def __init__(self, args):
        self.args = args
        self.base = args.output.resolve()
        self.base.mkdir(parents=True, exist_ok=True)
        self.stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        self.run_id = self.stamp + "-" + uuid.uuid4().hex[:8]
        self.report = self.base / "runs" / self.run_id
        self.report.mkdir(parents=True)
        self.remote = "/tmp/picturas-mvp/" + self.run_id
        self.records = []
        self.diagnostics = []
        selected = set(args.only or GROUPS)
        self.suites = {name: {"id": name, "group": group, "status": "NOT_RUN",
                              "reason": "Ainda não executado." if group in selected
                              else "Grupo não selecionado."}
                       for name, group in SUITES.items()}
        self.compose = ["docker", "compose"]
        if args.project:
            self.compose += ["--project-name", args.project]
        self.compose += ["--file", str(ROOT / "docker-compose.yaml")]
        self.environment = {**os.environ, "NO_COLOR": "1", "FORCE_COLOR": "0"}
        self.opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPSHandler(context=ssl._create_unverified_context()),
        )

    def exec(self, service, *command, env=None, workdir="/app"):
        result = self.compose + ["exec", "-T", "-w", workdir]
        for key, value in (env or {}).items():
            result += ["-e", f"{key}={value}"]
        return result + [service, *command]

    def step(self, name, command, *, kind=None, suite=None, required=True):
        log = self.report / f"{len(self.records) + 1:02d}-{name}.log"
        print(f"\n▶ {name}\n  Registo: {log}", flush=True)
        started = time.monotonic()
        record = {"id": suite or name, "command": public_command(command), "log": str(log), "status": "ERROR",
                  "started_utc": dt.datetime.now(dt.timezone.utc).isoformat()}
        self.records.append(record)
        process = None
        try:
            with log.open("w", encoding="utf-8") as handle:
                process = subprocess.Popen(command, cwd=ROOT, env=self.environment,
                                           stdout=handle, stderr=subprocess.STDOUT,
                                           start_new_session=True)
                heartbeat = started
                while process.poll() is None:
                    time.sleep(0.2)
                    now = time.monotonic()
                    if now - heartbeat >= 20:
                        print(f"  A executar… {int(now - started)} s", flush=True)
                        heartbeat = now
            output = log.read_text(encoding="utf-8", errors="replace")
            counts = test_counts(output, kind)
            record.update(returncode=process.returncode, counts=counts,
                          status=test_status(process.returncode, counts, kind))
        except KeyboardInterrupt:
            if process and process.poll() is None:
                os.killpg(process.pid, signal.SIGTERM)
                process.wait()
            record["status"] = "INTERRUPTED"
            raise
        except OSError as error:
            record["reason"] = str(error)
            log.write_text(str(error) + "\n", encoding="utf-8")
        finally:
            record["seconds"] = round(time.monotonic() - started, 2)
            if suite:
                self.suites[suite] = {**self.suites[suite], **record}
                self.suites[suite].pop("reason", None)
                if record.get("reason"):
                    self.suites[suite]["reason"] = record["reason"]
            self.save()
        print(f"  {LABELS[record['status']]} ({record['seconds']} s)", flush=True)
        if record.get("counts"):
            print("  " + json.dumps(record["counts"], ensure_ascii=False), flush=True)
        if record["status"] in ("FAIL", "ERROR"):
            print("\n".join(log.read_text(encoding="utf-8", errors="replace").splitlines()[-25:]), flush=True)
        if required and record["status"] != "PASS":
            raise RuntimeError(f"Etapa {name}: {LABELS[record['status']]}. Consultar {log}")
        return record["status"] == "PASS"

    def api(self, method, route, body=None, token=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        request = urllib.request.Request(
            self.args.url.rstrip("/") + route,
            data=json.dumps(body).encode() if body is not None else None,
            headers=headers, method=method,
        )
        try:
            with self.opener.open(request, timeout=15) as response:
                raw = response.read()
                return response.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as error:
            return error.code, None

    def ready(self):
        self.step("docker-compose", self.compose + ["version"])
        running = subprocess.check_output(
            self.compose + ["ps", "--status", "running", "--services"],
            cwd=ROOT, env=self.environment, text=True,
        ).splitlines()
        missing = set(SERVICES) - set(running)
        if missing:
            raise RuntimeError("Serviços em falta: " + ", ".join(sorted(missing)) +
                               ". Executar primeiro o comando up ou all.")
        print("\nA aguardar o ponto de entrada HTTPS…", flush=True)
        end = time.monotonic() + self.args.wait
        while time.monotonic() < end:
            try:
                with self.opener.open(self.args.url, timeout=5) as response:
                    if response.status == 200:
                        return
            except (OSError, urllib.error.URLError):
                pass
            time.sleep(1)
        raise RuntimeError("O frontend não ficou disponível dentro do tempo de espera.")

    def up(self):
        command = self.compose + ["up", "-d"]
        if not self.args.no_build:
            command += ["--build"]
        self.step("arranque", command + SERVICES)

    def accounts(self):
        target = self.base / "environment" / "accounts.json"
        if target.exists():
            data = json.loads(target.read_text(encoding="utf-8"))
            if data["url"] != self.args.url or data["project"] != self.args.project:
                raise RuntimeError("As contas guardadas pertencem a outro URL/projeto Compose. Usar outro --output.")
        else:
            data = {"url": self.args.url, "project": self.args.project, "accounts": []}
        for profile in ("free", "premium"):
            existing = next((a for a in data["accounts"] if a["type"] == profile), None)
            if existing:
                status, _ = self.api("GET", f"/api-gateway/users/validate/{existing['id']}",
                                     token=existing["jwt"])
                if status != 200:
                    raise RuntimeError("A conta de teste guardada deixou de ser válida. Usar outro --output para preparar novas contas.")
                print(f"  Conta {profile} reutilizada: {existing['email']}", flush=True)
                continue
            account = {"name": f"MVP {profile}", "type": profile,
                       "email": f"mvp-{profile}-{uuid.uuid4().hex[:12]}@example.com",
                       "password": "Mvp-" + secrets.token_urlsafe(18)}
            status, response = self.api("POST", "/api-gateway/users", account)
            if status != 201 or not isinstance(response, dict) or not response.get("jwt"):
                raise RuntimeError(f"Registo da conta {profile}: HTTP {status}; esperava HTTP 201 com JWT.")
            data["accounts"].append({**account, "id": response["user"]["_id"], "jwt": response["jwt"]})
            write_json(target, data)  # Preserve each ID even if the next registration fails.
            print(f"  Conta {profile} criada: {account['email']}", flush=True)
        self.account_file = str(target)
        print(f"  Palavras-passe e JWT guardados em {target} (permissões 600).", flush=True)
        self.save()

    def fixture_root(self):
        digest = hashlib.sha256()
        for path in sorted((ROOT / "Tools" / "video").rglob("*.py")):
            digest.update(str(path.relative_to(ROOT)).encode())
            digest.update(path.read_bytes())
        return self.base / "environment" / "fixtures" / digest.hexdigest()[:12]

    def fixtures(self, names):
        root = self.fixture_root()
        root.mkdir(parents=True, exist_ok=True)
        self.step("pasta-projetos", self.exec("projects", "mkdir", "-p", self.remote))
        for name in names:
            generator, required = FIXTURES[name]
            cached = root / name
            marker = cached / ".generated.json"
            valid = marker.is_file() and all((cached / f).is_file() for f in required)
            remote = f"{self.remote}/{name}"
            if not valid:
                # Never overwrite a partially copied directory or a user's manual file.
                if cached.exists():
                    raise RuntimeError(f"Cache incompleta: {cached}. Usar outro --output.")
                self.step(f"gerar-{name}", self.exec(
                    "video_worker", "python", "-m", f"tests.generate_{generator}_fixtures", remote,
                    env={"PYTHONPATH": "/app", "PYTHONDONTWRITEBYTECODE": "1"},
                ))
                self.step(f"copiar-{name}", self.compose + ["cp", f"video_worker:{remote}", str(cached)])
                files = [{"name": f.name, "bytes": f.stat().st_size}
                         for f in sorted(cached.iterdir()) if f.is_file()]
                write_json(marker, {"generator": generator, "files": files})
            else:
                print(f"\n  Vídeos {name} reutilizados: {cached}", flush=True)
            self.step(f"preparar-{name}", self.compose + ["cp", str(cached), f"projects:{remote}"])
        self.fixtures_path = str(root)
        self.save()

    def skip(self, name, reason):
        self.suites[name]["reason"] = reason
        print(f"\n  NÃO EXECUTADO — {name}: {reason}", flush=True)
        self.save()

    def diagnose_storage(self, since):
        result = subprocess.run(self.compose + ["logs", "--since", since, "--tail", "200", "seaweedfs"],
                                cwd=ROOT, env=self.environment, text=True, capture_output=True)
        if "No writable volumes and no free volumes left" in result.stdout:
            message = ("SeaweedFS recusou o carregamento: não há volumes graváveis nem volumes livres "
                       "para atribuir. A integração não conseguiu preparar os vídeos. "
                       "Este erro não demonstra, por si só, que o disco físico esteja cheio.")
            if message not in self.diagnostics:
                self.diagnostics.append(message)
                print("\n  Diagnóstico: " + message, flush=True)
                self.save()

    def tests(self):
        groups = set(self.args.only or GROUPS)
        if "unit" in groups:
            self.step("unit-projects", self.exec(
                "projects", "node", "--test", "--test-reporter=tap", "--experimental-test-coverage",
                *[f"test/video/{name}.test.js" for name in UNIT_FILES],
                env={"VIDEO_TEST_OPERATIONS": "1"},
            ), kind="tap", suite="unit-projects", required=False)
            self.step("unit-worker", self.exec(
                "video_worker", "python", "-m", "unittest", "-v",
                "tests.test_basic_edits", "tests.test_task", "tests.test_ingest",
                "tests.test_visual_edits", "tests.test_convert", "tests.test_composition",
                env={"VIDEO_TEST_OPERATIONS": "1", "PYTHONPATH": "/app", "PYTHONDONTWRITEBYTECODE": "1"},
            ), kind="python", suite="unit-worker", required=False)
        if "frontend" in groups:
            remote = self.remote + "/frontend"
            self.step("pasta-frontend", self.exec("projects", "mkdir", "-p", remote))
            for directory in ("lib", "test"):
                self.step(f"copiar-frontend-{directory}", self.compose + [
                    "cp", str(ROOT / "frontend" / directory), f"projects:{remote}/{directory}"])
            self.step("frontend-node", self.exec(
                "projects", "node", "--test", "--test-reporter=tap",
                *[f"test/video-{name}.test.mts" for name in FRONTEND_FILES], workdir=remote,
            ), kind="tap", suite="frontend-node", required=False)
            self.step("frontend-bun", self.exec(
                "frontend", "bun", "test", "test/video-convert.test.mts", workdir="/usr/src/app",
            ), kind="bun", suite="frontend-bun", required=False)
            self.step("frontend-types", self.exec(
                "frontend", "bun", "node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false",
                workdir="/usr/src/app",
            ), suite="frontend-types", required=False)
        if groups & {"integration", "browser"}:
            names = list(FIXTURES) if "integration" in groups else ["b005", "b008"]
            self.fixtures(names)
        if "integration" in groups:
            storage = subprocess.check_output(self.exec(
                "img_storage", "node", "-e",
                "process.stdout.write(JSON.stringify({"
                "VIDEO_E2E_S3_ACCESS:process.env.S3_ACCESS_KEY||'admin',"
                "VIDEO_E2E_S3_SECRET:process.env.S3_SECRET_KEY||'admin123'}))",
            ), cwd=ROOT, env=self.environment, text=True)
            storage_env = json.loads(storage)
            for name, (fixture, filename) in INTEGRATION.items():
                outputs = self.remote + "/outputs-" + fixture
                self.step("pasta-saidas-" + fixture, self.exec("projects", "mkdir", "-p", outputs))
                env = {**storage_env, "VIDEO_E2E_URL": "https://nginx", "VIDEO_E2E_FIXTURES": f"{self.remote}/{fixture}",
                       "NODE_TLS_REJECT_UNAUTHORIZED": "0", "VIDEO_E2E_OUTPUTS": outputs}
                for key in ("VIDEO_E2E_S3_ACCESS", "VIDEO_E2E_S3_SECRET"):
                    if key in os.environ:
                        env[key] = os.environ[key]
                if name == "integration-b008" and self.args.d88:
                    env["VIDEO_E2E_D88"] = "1"
                passed = self.step(name, self.exec("projects", "node", "--test", "--test-reporter=tap",
                                         "test/video/" + filename, env=env),
                          kind="tap", suite=name, required=False)
                if not passed:
                    self.diagnose_storage(self.suites[name]["started_utc"])
                # The fixture suites without persisted outputs simply produce an empty folder.
                destination = self.report / "outputs" / fixture
                destination.parent.mkdir(exist_ok=True)
                self.step("guardar-saidas-" + fixture,
                          self.compose + ["cp", f"projects:{outputs}", str(destination)], required=False)
        if "browser" in groups:
            self.browser()

    def browser(self):
        browser = self.args.browser
        if not browser or not Path(browser).is_file():
            for name in ("browser-visual", "browser-panels"):
                self.skip(name, "Indicar um binário Chromium existente com --browser.")
            return
        node = shutil.which("node")
        if not node or int(subprocess.check_output([node, "-p", "process.versions.node.split('.')[0]"], text=True)) < 22:
            for name in ("browser-visual", "browser-panels"):
                self.skip(name, "Os testes de navegador exigem Node.js 22 ou superior no anfitrião.")
            return
        original = self.environment.copy()
        try:
            self.environment.update(VIDEO_UI_URL=self.args.url, VIDEO_UI_BROWSER=str(Path(browser).resolve()),
                                    NODE_TLS_REJECT_UNAUTHORIZED="0", VIDEO_UI_SCREENSHOTS=str(self.report))
            self.environment["VIDEO_E2E_FIXTURES"] = str(self.fixture_root() / "b005")
            self.step("browser-visual", [node, "--test", "--test-reporter=tap",
                      str(ROOT / "projects/test/video/e2e-visual-ui.test.js")],
                      kind="tap", suite="browser-visual", required=False)
            snapshots = self.args.snapshots
            if not snapshots or not snapshots.is_dir() or not list(snapshots.glob("*.json")):
                self.skip("browser-panels", "Indicar a referência anterior dos painéis com --snapshots; não é gerada automaticamente.")
                return
            self.environment.update(VIDEO_E2E_FIXTURES=str(self.fixture_root() / "b008"),
                                    VIDEO_UI_SNAPSHOTS=str(snapshots.resolve()))
            self.environment.pop("VIDEO_UI_RECORD", None)
            self.step("browser-panels", [node, "--test", "--test-reporter=tap",
                      str(ROOT / "projects/test/video/e2e-panels-ui.test.js")],
                      kind="tap", suite="browser-panels", required=False)
        finally:
            self.environment = original

    def save(self):
        document = {"started_utc": self.stamp, "command": self.args.command,
                    "url": self.args.url, "project": self.args.project,
                    "steps": self.records, "suites": list(self.suites.values()),
                    "fixtures": getattr(self, "fixtures_path", None),
                    "accounts_file": getattr(self, "account_file", None),
                    "diagnostics": self.diagnostics,
                    "scope": "Suites correntes; não demonstra cobertura integral da ERS.",
                    "historical_not_run": [str(p.relative_to(ROOT)) for p in
                        sorted((ROOT / "projects/test/video").glob("e2e*.test.js"))
                        if p.name not in {f for _, f in INTEGRATION.values()} |
                        {"e2e-visual-ui.test.js", "e2e-panels-ui.test.js"}]}
        document["error"] = getattr(self, "error", None)
        document["revision"] = "arquivo sem Git"
        if shutil.which("git"):
            revision = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, capture_output=True)
            if revision.returncode == 0:
                document["revision"] = revision.stdout.strip()
                dirty = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, text=True, capture_output=True)
                document["working_tree_changed"] = bool(dirty.stdout.strip())
        write_json(self.report / "summary.json", document)
        lines = ["# Resultados dos testes do MVP", "", f"Início (UTC): {self.stamp}",
                 f"Revisão: {document['revision']}", "", "| Suite | Estado | Duração (s) | Registo / motivo |",
                 "| --- | --- | ---: | --- |"]
        for suite in self.suites.values():
            detail = suite.get("reason", Path(suite.get("log", "")).name)
            lines.append(f"| {suite['id']} | {LABELS[suite['status']]} | {suite.get('seconds', '')} | {detail} |")
        lines += ["", "## Preparação e recolha", ""]
        if document["error"]:
            lines += ["Erro de execução: " + document["error"], ""]
        lines += [f"- {r['id']}: {LABELS[r['status']]} ({r['seconds']} s); {Path(r['log']).name}"
                  for r in self.records if r['id'] not in self.suites]
        lines += ["", "## Limites", "", document["scope"],
                  "As contagens de suites sobrepostas não devem ser somadas como cobertura de requisitos.",
                  "A verificação TypeScript é análise estática. Critérios manuais continuam a exigir registo próprio.",
                  "", "Suites históricas com preparação própria, não executadas por este comando:", ""]
        lines += [f"- {p}" for p in document["historical_not_run"]]
        if self.diagnostics:
            lines += ["", "## Diagnóstico do ambiente", "", *self.diagnostics]
        (self.report / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    def finish(self):
        for suite in self.suites.values():
            if suite["status"] == "NOT_RUN" and suite.get("reason") == "Ainda não executado.":
                if getattr(self, "error", None):
                    suite["reason"] = "Execução impedida por erro ou interrupção; consultar o erro de execução."
                elif self.args.command not in ("all", "test"):
                    suite["reason"] = "Comando de preparação; não solicita execução de testes."
        self.save()
        print("\nResumo:", flush=True)
        for suite in self.suites.values():
            print(f"  {suite['id']:<23} {LABELS[suite['status']]}", flush=True)
        print(f"\nRelatório: {self.report / 'summary.md'}\nJSON: {self.report / 'summary.json'}", flush=True)
        for message in self.diagnostics:
            print("\nDiagnóstico: " + message, flush=True)
        if any(r["status"] in ("FAIL", "ERROR", "INTERRUPTED") for r in self.records):
            return 1
        if self.args.command in ("all", "test") and any(
            s["status"] in ("PARTIAL", "NOT_RUN") for s in self.suites.values()
            if s["group"] in set(self.args.only or GROUPS)
        ):
            return 2
        return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("all", "up", "prepare", "accounts", "test", "list"))
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/mvp")
    parser.add_argument("--only", choices=GROUPS, action="append", help="Grupo de testes; pode repetir-se.")
    parser.add_argument("--no-build", action="store_true", help="Reutilizar as imagens no arranque.")
    parser.add_argument("--project", help="Nome alternativo do projeto Docker Compose.")
    parser.add_argument("--url", default="https://localhost:8080")
    parser.add_argument("--browser", default=os.environ.get("VIDEO_UI_BROWSER"))
    parser.add_argument("--snapshots", type=Path, help="Referência anterior dos nove painéis.")
    parser.add_argument("--d88", action="store_true", help="Ativar os ensaios adicionais de composição.")
    parser.add_argument("--wait", type=int, default=180, help="Espera máxima pelo frontend, em segundos.")
    args = parser.parse_args(argv)
    if args.wait <= 0:
        parser.error("--wait deve ser superior a zero.")
    if args.command == "list":
        for name, group in SUITES.items():
            print(f"{name:<23} {group}")
        print("\nHistóricos e verificações manuais: consultar docs/executar-testes-mvp.md.")
        return 0
    if not shutil.which("docker"):
        parser.error("Docker não encontrado. Instalar Docker Engine e Compose v2.")
    run = Run(args)
    try:
        if args.command in ("all", "up"):
            run.up()
        run.ready()
        if args.command in ("all", "prepare", "accounts"):
            run.accounts()
        if args.command == "prepare":
            run.fixtures(list(FIXTURES))
        if args.command in ("all", "test"):
            run.tests()
    except KeyboardInterrupt:
        run.error = "Execução interrompida pelo utilizador."
        print("\nExecução interrompida; os resultados já recolhidos serão preservados.", file=sys.stderr)
        run.finish()
        return 130
    except (RuntimeError, OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        run.error = str(error)
        print(f"\nERRO: {error}", file=sys.stderr)
        run.finish()
        return 1
    return run.finish()


if __name__ == "__main__":
    sys.exit(main())
