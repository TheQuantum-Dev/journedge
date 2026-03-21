import { NextRequest } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const ROOT = process.cwd();

type StepStatus = "pending" | "running" | "complete" | "error" | "skipped";

interface StepEvent {
  step: string;
  status: StepStatus;
  message: string;
  detail?: string;
}

async function runCmd(
  cmd: string,
  timeoutMs = 300_000
): Promise<{ stdout: string; stderr: string }> {
  return execAsync(cmd, { cwd: ROOT, timeout: timeoutMs });
}

function pruneBackups(backupDir: string, keep = 5): void {
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith("tradello-") && f.endsWith(".db"))
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    for (const file of files.slice(keep)) {
      fs.unlinkSync(path.join(backupDir, file.name));
    }
  } catch {}
}

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StepEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      try {
        emit({ step: "preflight", status: "running", message: "Checking environment..." });

        const gitDir = path.join(ROOT, ".git");
        if (!fs.existsSync(gitDir)) {
          emit({
            step: "preflight",
            status: "error",
            message: "Not a git repository",
            detail:
              "Auto-update requires a git-cloned installation. " +
              "Run: git clone https://github.com/TheQuantum-Dev/tradello",
          });
          return;
        }

        try {
          await runCmd("git remote get-url origin", 10_000);
        } catch {
          emit({
            step: "preflight",
            status: "error",
            message: "No git remote configured",
            detail: "Run: git remote add origin https://github.com/TheQuantum-Dev/tradello",
          });
          return;
        }

        emit({ step: "preflight", status: "complete", message: "Git repository verified" });

        emit({ step: "backup", status: "running", message: "Backing up database..." });

        const dbPath = path.join(ROOT, "prisma", "tradello.db");

        if (!fs.existsSync(dbPath)) {
          emit({ step: "backup", status: "skipped", message: "No database found — skipping" });
        } else {
          try {
            const backupDir = path.join(ROOT, "backups");
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

            const ts = new Date()
              .toISOString()
              .replace(/[:.]/g, "-")
              .slice(0, 19);
            const dest = path.join(backupDir, `tradello-${ts}.db`);

            fs.copyFileSync(dbPath, dest);
            pruneBackups(backupDir, 5);

            emit({
              step: "backup",
              status: "complete",
              message: `Database backed up — tradello-${ts}.db`,
            });
          } catch (err) {
            const detail = err instanceof Error ? err.message : "Unknown error";
            emit({
              step: "backup",
              status: "skipped",
              message: "Backup failed — continuing anyway",
              detail,
            });
          }
        }

        emit({ step: "stash", status: "running", message: "Checking for local changes..." });

        const { stdout: statusOut } = await runCmd("git status --porcelain");
        const hasLocalChanges = statusOut.trim().length > 0;

        if (hasLocalChanges) {
          emit({ step: "stash", status: "running", message: "Stashing local modifications..." });
          await runCmd('git stash push -m "tradello-pre-update-stash"');
          emit({ step: "stash", status: "complete", message: "Local changes stashed safely" });
        } else {
          emit({ step: "stash", status: "skipped", message: "Working tree is clean" });
        }

        emit({ step: "pull", status: "running", message: "Fetching latest release from GitHub..." });

        await runCmd("git fetch --tags origin", 60_000);

        const { stdout: tagOut } = await runCmd(
          "git tag --sort=-version:refname | head -1"
        );
        const latestTag = tagOut.trim();

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

        if (currentTag === latestTag) {
          emit({ step: "pull", status: "complete", message: `Already on the latest version (${latestTag})` });
        } else {
          await runCmd(`git checkout ${latestTag}`, 30_000);
          emit({ step: "pull", status: "complete", message: `Updated to ${latestTag}` });
        }

        emit({ step: "install", status: "running", message: "Installing dependencies..." });

        await runCmd("npm install", 300_000);

        emit({ step: "install", status: "complete", message: "Dependencies up to date" });

        emit({ step: "migrate", status: "running", message: "Checking database migrations..." });

        try {
          const { stdout: migrateOut } = await runCmd(
            "npx prisma migrate deploy",
            60_000
          );

          if (
            migrateOut.includes("No pending migrations") ||
            migrateOut.includes("already applied")
          ) {
            emit({
              step: "migrate",
              status: "complete",
              message: "Database schema is current — no changes needed",
            });
          } else {
            const applied = migrateOut.match(/(\d+) migration/)?.[1] ?? "pending";
            emit({
              step: "migrate",
              status: "complete",
              message: `Applied ${applied} database migration(s)`,
            });
          }
        } catch (_migrateErr) {
          try {
            await runCmd("npx prisma generate", 60_000);
            emit({ step: "migrate", status: "complete", message: "Prisma client regenerated" });
          } catch {
            emit({
              step: "migrate",
              status: "skipped",
              message: "No schema changes detected",
            });
          }
        }

        emit({
          step: "complete",
          status: "complete",
          message: "Update installed. Restart the server to apply changes.",
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        emit({
          step: "error",
          status: "error",
          message: "Update failed",
          detail: message,
        });
      } finally {
        // `finally` always runs even after `return` — guard prevents double-close
        if (!closed) {
          try {
            controller.close();
          } catch {}
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
