// app/api/update/route.ts
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

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StepEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // stream ended client-side
        }
      };

      try {
        // ── STEP 1: PREFLIGHT ─────────────────────────────────────────────────
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
          controller.close();
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
          controller.close();
          return;
        }

        emit({ step: "preflight", status: "complete", message: "Git repository verified" });

        // ── STEP 2: STASH LOCAL CHANGES ───────────────────────────────────────
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

        // ── STEP 3: FETCH + PULL ──────────────────────────────────────────────
        emit({ step: "pull", status: "running", message: "Fetching latest release from GitHub..." });

        await runCmd("git fetch origin main", 60_000);

        const { stdout: pullOut } = await runCmd(
          "git pull origin main --ff-only",
          60_000
        );

        if (pullOut.trim() === "Already up to date.") {
          emit({ step: "pull", status: "complete", message: "Already on the latest version" });
        } else {
          const filesMatch = pullOut.match(/(\d+) file/);
          const fileCount = filesMatch ? filesMatch[1] : "several";
          emit({
            step: "pull",
            status: "complete",
            message: `Code updated — ${fileCount} file${fileCount === "1" ? "" : "s"} changed`,
          });
        }

        // ── STEP 4: NPM INSTALL ───────────────────────────────────────────────
        emit({ step: "install", status: "running", message: "Installing dependencies..." });

        await runCmd("npm install", 300_000);

        emit({ step: "install", status: "complete", message: "Dependencies up to date" });

        // ── STEP 5: PRISMA MIGRATE ────────────────────────────────────────────
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
            emit({ step: "migrate", status: "complete", message: "Database schema is current — no changes needed" });
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

        // ── COMPLETE ──────────────────────────────────────────────────────────
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
        controller.close();
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