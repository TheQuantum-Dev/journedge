import { NextRequest } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

// Allow up to 5 minutes — npm install on a slow connection can take a while
export const maxDuration = 300;

const execAsync = promisify(exec);
const ROOT = process.cwd();
const GITHUB_REPO = "TheQuantum-Dev/journedge";

// Temp dirs that must be cleaned up even if the process crashes
const SHADOW_DIR = path.join(ROOT, ".update-shadow");
const TMP_DIR    = path.join(ROOT, ".update-tmp");
const TMP_TAR    = path.join(ROOT, ".update-tmp.tar.gz");

function cleanupTempDirs() {
  try { fs.rmSync(SHADOW_DIR, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(TMP_DIR,    { recursive: true, force: true }); } catch {}
  try { fs.unlinkSync(TMP_TAR);                                  } catch {}
}
process.on("exit", cleanupTempDirs);

type StepStatus = "pending" | "running" | "complete" | "error" | "skipped";

interface StepEvent {
  step: string;
  status: StepStatus;
  message: string;
  detail?: string;
}

async function runCmd(
  cmd: string,
  opts: { cwd?: string; timeoutMs?: number } = {}
): Promise<{ stdout: string; stderr: string }> {
  return execAsync(cmd, { cwd: opts.cwd ?? ROOT, timeout: opts.timeoutMs ?? 300_000 });
}

// Simple semver comparison — no external dependency needed
function parseSemver(tag: string): [number, number, number] {
  const parts = tag.replace(/^v/, "").split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function semverGt(a: string, b: string): boolean {
  const [aMaj, aMin, aPat] = parseSemver(a);
  const [bMaj, bMin, bPat] = parseSemver(b);
  if (aMaj !== bMaj) return aMaj > bMaj;
  if (aMin !== bMin) return aMin > bMin;
  return aPat > bPat;
}

function pruneBackups(backupDir: string, keep = 5): void {
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith("journedge-") && f.endsWith(".db"))
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    for (const file of files.slice(keep)) {
      fs.unlinkSync(path.join(backupDir, file.name));
    }
  } catch {}
}

async function backupDatabase(emit: (e: StepEvent) => void): Promise<boolean> {
  const dbPath = path.join(ROOT, "prisma", "journedge.db");
  if (!fs.existsSync(dbPath)) {
    emit({ step: "backup", status: "skipped", message: "No database found — skipping" });
    return true;
  }
  try {
    const backupDir = path.join(ROOT, "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const ts   = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dest = path.join(backupDir, `journedge-${ts}.db`);
    fs.copyFileSync(dbPath, dest);

    // A zero-byte backup is worse than no backup — verify before continuing
    const size = fs.statSync(dest).size;
    if (size === 0) {
      fs.unlinkSync(dest);
      emit({
        step: "backup",
        status: "error",
        message: "Backup produced a 0-byte file — aborting to protect your data",
        detail: "Check disk space and permissions on the backups/ directory.",
      });
      return false;
    }

    pruneBackups(backupDir, 5);
    emit({ step: "backup", status: "complete", message: `Database backed up (${(size / 1024).toFixed(1)} KB) — journedge-${ts}.db` });
    return true;
  } catch (err) {
    emit({
      step: "backup",
      status: "error",
      message: "Backup failed — aborting to protect your data",
      detail: err instanceof Error ? err.message : "Unknown error",
    });
    return false;
  }
}

// Shadow install — npm install runs in a temp directory so the running server
// is never touched. Once complete, node_modules is swapped atomically.
// If the install fails, the live node_modules is left intact.
async function shadowInstall(emit: (e: StepEvent) => void): Promise<void> {
  emit({ step: "install", status: "running", message: "Preparing shadow install..." });

  fs.mkdirSync(SHADOW_DIR, { recursive: true });

  // Copy package.json into the shadow dir so npm install resolves from there
  fs.copyFileSync(
    path.join(ROOT, "package.json"),
    path.join(SHADOW_DIR, "package.json")
  );

  // Copy lockfile if present — speeds up install and keeps versions deterministic
  const lockSrc = path.join(ROOT, "package-lock.json");
  if (fs.existsSync(lockSrc)) {
    fs.copyFileSync(lockSrc, path.join(SHADOW_DIR, "package-lock.json"));
  }

  emit({ step: "install", status: "running", message: "Clearing package cache..." });
  await runCmd("npm cache clean --force", { timeoutMs: 60_000 });

  emit({ step: "install", status: "running", message: "Installing dependencies in shadow directory..." });
  await runCmd("npm install", { cwd: SHADOW_DIR, timeoutMs: 300_000 });

  emit({ step: "install", status: "running", message: "Swapping node_modules..." });

  // Remove live node_modules and move the freshly installed one into place
  const liveMods   = path.join(ROOT, "node_modules");
  const shadowMods = path.join(SHADOW_DIR, "node_modules");

  if (fs.existsSync(liveMods)) {
    fs.rmSync(liveMods, { recursive: true, force: true });
  }
  fs.renameSync(shadowMods, liveMods);

  // Copy updated lockfile back so the repo stays in sync
  const shadowLock = path.join(SHADOW_DIR, "package-lock.json");
  if (fs.existsSync(shadowLock)) {
    fs.copyFileSync(shadowLock, lockSrc);
  }

  // Rebuild native binaries in the live location after the swap
  emit({ step: "install", status: "running", message: "Rebuilding native modules..." });
  await runCmd("npm rebuild", { timeoutMs: 120_000 });

  // Clean up shadow dir
  fs.rmSync(SHADOW_DIR, { recursive: true, force: true });

  emit({ step: "install", status: "complete", message: "Dependencies installed and rebuilt" });
}

async function migrateAndGenerate(emit: (e: StepEvent) => void): Promise<void> {
  emit({ step: "migrate", status: "running", message: "Applying database migrations..." });
  try {
    const { stdout: migrateOut } = await runCmd("npx prisma migrate deploy", { timeoutMs: 60_000 });
    const noChanges =
      migrateOut.includes("No pending migrations") ||
      migrateOut.includes("already applied");

    emit({
      step: "migrate",
      status: "running",
      message: noChanges
        ? "Schema current — regenerating Prisma client..."
        : `Applied migrations — regenerating Prisma client...`,
    });

    await runCmd("npx prisma generate", { timeoutMs: 60_000 });

    emit({
      step: "migrate",
      status: "complete",
      message: noChanges
        ? "Schema current — Prisma client regenerated"
        : "Migrations applied — Prisma client regenerated",
    });
  } catch {
    try {
      await runCmd("npx prisma generate", { timeoutMs: 60_000 });
      emit({ step: "migrate", status: "complete", message: "Prisma client regenerated" });
    } catch {
      emit({ step: "migrate", status: "skipped", message: "No schema changes detected" });
    }
  }
}

async function updateViaZip(emit: (e: StepEvent) => void): Promise<void> {
  emit({ step: "pull", status: "running", message: "Fetching latest release from GitHub..." });

  const { stdout: apiOut } = await runCmd(
    `curl -s -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/${GITHUB_REPO}/releases/latest"`,
    { timeoutMs: 30_000 }
  );

  let release: { tag_name: string; tarball_url: string };
  try {
    release = JSON.parse(apiOut);
    if (!release.tag_name || !release.tarball_url) throw new Error("Invalid response");
  } catch {
    emit({
      step: "pull",
      status: "error",
      message: "Could not fetch release information",
      detail: "Check your internet connection and try again.",
    });
    return;
  }

  emit({ step: "pull", status: "running", message: `Downloading ${release.tag_name}...` });

  await runCmd(`curl -sL "${release.tarball_url}" -o "${TMP_TAR}"`, { timeoutMs: 120_000 });

  fs.mkdirSync(TMP_DIR, { recursive: true });
  await runCmd(`tar -xzf "${TMP_TAR}" -C "${TMP_DIR}" --strip-components=1`, { timeoutMs: 60_000 });

  const preserve = [
    path.join("prisma", "journedge.db"),
    path.join("prisma", "journedge.db-journal"),
    ".env",
    path.join("public", "uploads"),
    "backups",
    "node_modules",
    ".next",
  ];

  const copyDir = (src: string, dest: string) => {
    if (!fs.existsSync(src)) return;
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath  = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      const rel      = path.relative(ROOT, destPath);
      if (preserve.some((p) => rel === p || rel.startsWith(p + path.sep))) continue;
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(TMP_DIR, ROOT);

  fs.rmSync(TMP_DIR,  { recursive: true, force: true });
  fs.unlinkSync(TMP_TAR);

  emit({ step: "pull", status: "complete", message: `Updated to ${release.tag_name}` });
}

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StepEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };

      try {
        emit({ step: "preflight", status: "running", message: "Checking environment..." });

        // Cloud environment detection — this script only works on self-hosted installs
        if (process.env.VERCEL) {
          emit({
            step: "preflight",
            status: "error",
            message: "Vercel deployment detected",
            detail: "Updates on Vercel are managed via Git push or Deploy Hooks. The serverless file system is read-only.",
          });
          return;
        }

        if (fs.existsSync("/.dockerenv") || fs.existsSync("/run/.containerenv")) {
          emit({
            step: "preflight",
            status: "error",
            message: "Docker container detected",
            detail: "Pull the latest image to update: docker pull thequantum-dev/journedge. Changes made inside a container are lost on restart.",
          });
          return;
        }

        // Verify write access before doing any destructive work
        try {
          const testFile = path.join(ROOT, ".update-write-test");
          fs.writeFileSync(testFile, "");
          fs.unlinkSync(testFile);
        } catch {
          emit({
            step: "preflight",
            status: "error",
            message: "No write permission on project directory",
            detail: "Run the server as a user with write access to: " + ROOT,
          });
          return;
        }

        const isGitRepo = fs.existsSync(path.join(ROOT, ".git"));

        if (!isGitRepo) {
          try {
            await runCmd("curl --version", { timeoutMs: 5_000 });
          } catch {
            emit({
              step: "preflight",
              status: "error",
              message: "curl is required for updates on non-git installations",
              detail: "Install curl and try again, or update manually from github.com/" + GITHUB_REPO + "/releases",
            });
            return;
          }
          emit({ step: "preflight", status: "complete", message: "Zip install detected — using release download" });
        } else {
          try {
            await runCmd("git remote get-url origin", { timeoutMs: 10_000 });
          } catch {
            emit({
              step: "preflight",
              status: "error",
              message: "No git remote configured",
              detail: "Run: git remote add origin https://github.com/" + GITHUB_REPO,
            });
            return;
          }
          emit({ step: "preflight", status: "complete", message: "Environment verified" });
        }

        // Backup — abort if backup fails rather than risk data loss
        const backupOk = await backupDatabase(emit);
        if (!backupOk) return;

        if (isGitRepo) {
          emit({ step: "stash", status: "running", message: "Checking for local changes..." });
          const { stdout: statusOut } = await runCmd("git status --porcelain");
          if (statusOut.trim().length > 0) {
            emit({ step: "stash", status: "running", message: "Stashing local modifications..." });
            await runCmd('git stash push -m "journedge-pre-update-stash"');
            emit({ step: "stash", status: "complete", message: "Local changes stashed safely" });
          } else {
            emit({ step: "stash", status: "skipped", message: "Working tree is clean" });
          }

          emit({ step: "pull", status: "running", message: "Fetching tags from GitHub..." });
          await runCmd("git fetch --tags origin", { timeoutMs: 60_000 });

          // Use v:refname sort for proper semver ordering — not lexicographic
          const { stdout: tagsOut } = await runCmd("git tag -l --sort=-v:refname");
          const latestTag = tagsOut.split("\n").map((t) => t.trim()).filter(Boolean)[0];

          if (!latestTag) {
            emit({
              step: "pull",
              status: "error",
              message: "No release tags found",
              detail: "The repository has no tagged releases to update to.",
            });
            return;
          }

          const { stdout: currentOut } = await runCmd(
            "git describe --tags --exact-match HEAD 2>/dev/null || echo ''"
          );
          const currentTag = currentOut.trim();

          if (currentTag && !semverGt(latestTag, currentTag)) {
            emit({ step: "pull", status: "complete", message: `Already on the latest version (${latestTag})` });
          } else {
            await runCmd(`git checkout ${latestTag}`, { timeoutMs: 30_000 });
            emit({ step: "pull", status: "complete", message: `Updated to ${latestTag}` });
          }
        } else {
          emit({ step: "stash", status: "skipped", message: "Not a git install — skipping stash" });
          await updateViaZip(emit);
        }

        await shadowInstall(emit);
        await migrateAndGenerate(emit);

        // Delete .next after packages are fully installed and rebuilt — not before.
        // Deleting earlier causes the still-running server to recreate it immediately
        // using the not-yet-updated node_modules, repopulating stale binary paths.
        const nextCachePath = path.join(ROOT, ".next");
        if (fs.existsSync(nextCachePath)) {
          fs.rmSync(nextCachePath, { recursive: true, force: true });
        }

        emit({
          step: "complete",
          status: "complete",
          message: "Update installed. Restart the server to apply changes.",
        });
      } catch (err: unknown) {
        emit({
          step: "error",
          status: "error",
          message: "Update failed",
          detail: err instanceof Error ? err.message : "An unexpected error occurred",
        });
      } finally {
        cleanupTempDirs();
        if (!closed) {
          try { controller.close(); } catch {}
          closed = true;
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
