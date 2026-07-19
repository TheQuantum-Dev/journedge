#!/usr/bin/env node

/**
 * Journedge Changelog Generator
 *
 * Usage:
 *   node scripts/changelog.js <version> [from_tag] [--dry-run] [--no-write]
 *
 * Examples:
 *   node scripts/changelog.js 4.1.0
 *   node scripts/changelog.js 4.1.0 v4.0.0
 *   node scripts/changelog.js 4.1.0 v4.0.0 --dry-run
 *
 * Options:
 *   --dry-run    Print the generated entry but do not write to CHANGELOG.md
 *   --no-write   Same as --dry-run
 *
 * Commit format expected:
 *   <type>(<scope>): <description>  [#<pr>]
 *
 * Supported types:
 *   feat, fix, refactor, perf, docs, chore, test, style, revert
 */

const { execSync } = require("child_process");
const fs           = require("fs");
const path         = require("path");

const args    = process.argv.slice(2);
const version = args.find((a) => !a.startsWith("--"));
const fromTag = args.find((a) => !a.startsWith("--") && a !== version) || null;
const dryRun  = args.includes("--dry-run") || args.includes("--no-write");

if (!version) {
  console.error("Usage: node scripts/changelog.js <version> [from_tag] [--dry-run]");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Error: Version must be in semver format (e.g. 4.1.0), got: "${version}"`);
  process.exit(1);
}

const TYPE_CONFIG = {
  feat:     { label: "New Features",   emoji: "✨", order: 1 },
  fix:      { label: "Bug Fixes",      emoji: "🐛", order: 2 },
  perf:     { label: "Performance",    emoji: "⚡️", order: 3 },
  refactor: { label: "Improvements",   emoji: "♻️",  order: 4 },
  style:    { label: "UI & Style",     emoji: "🎨", order: 5 },
  docs:     { label: "Documentation",  emoji: "📚", order: 6 },
  test:     { label: "Tests",          emoji: "🧪", order: 7 },
  chore:    { label: "Maintenance",    emoji: "🔧", order: 8 },
  revert:   { label: "Reverts",        emoji: "⏪", order: 9 },
  other:    { label: "Other Changes",  emoji: "📦", order: 10 },
};

const GITHUB_REPO = "TheQuantum-Dev/journedge";

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

function getLastTag() {
  const tags = run("git tag -l --sort=-v:refname");
  return tags.split("\n").find((t) => t.trim()) || null;
}

function getCommits(from) {
  const range = from ? `${from}..HEAD` : "HEAD";
  const raw   = run(`git log ${range} --pretty=format:"%H|%s|%an|%ae|%cd" --date=short --no-merges`);
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, message, author, email, date] = line.split("|");
      return { hash: hash.slice(0, 7), message, author, email, date };
    });
}

function getRepoUrl() {
  const remote = run("git remote get-url origin");
  if (!remote) return `https://github.com/${GITHUB_REPO}`;
  return remote.replace(/\.git$/, "").replace(/^git@github\.com:/, "https://github.com/");
}

function parseCommit(commit) {
  const match = commit.message.match(
    /^(feat|fix|refactor|docs|chore|perf|test|style|revert)(\(([^)]+)\))?!?:\s+(.+?)(?:\s+\[?#(\d+)\]?)?$/i
  );

  if (!match) {
    return {
      type: "other", scope: null,
      description: commit.message,
      breaking: false, pr: null,
      hash: commit.hash, author: commit.author,
    };
  }

  const breaking = commit.message.includes("!:") ||
    commit.message.toLowerCase().includes("breaking change");

  return {
    type:        match[1].toLowerCase(),
    scope:       match[3] || null,
    description: match[4].trim(),
    breaking,
    pr:          match[5] || null,
    hash:        commit.hash,
    author:      commit.author,
  };
}

function buildStats(grouped) {
  const totalCommits = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);
  const contributors = new Set(
    Object.values(grouped).flat().map((c) => c.author).filter(Boolean)
  );
  const hasBreaking = Object.values(grouped).flat().some((c) => c.breaking);
  return { totalCommits, contributors: Array.from(contributors), hasBreaking };
}

function formatEntry(version, fromTag, grouped, stats, repoUrl) {
  const date       = new Date().toISOString().split("T")[0];
  const lines      = [];
  const compareUrl = fromTag
    ? `${repoUrl}/compare/${fromTag}...v${version}`
    : `${repoUrl}/releases/tag/v${version}`;

  lines.push(`## [${version}](${compareUrl}) — ${date}`);
  lines.push("");

  if (stats.hasBreaking) {
    lines.push("> ⚠️ **Breaking changes** are included in this release. Review entries marked `BREAKING` before upgrading.");
    lines.push("");
  }

  const contribStr = stats.contributors.length === 1
    ? `1 contributor`
    : `${stats.contributors.length} contributors`;
  lines.push(`> ${stats.totalCommits} commit${stats.totalCommits !== 1 ? "s" : ""} · ${contribStr}`);
  lines.push("");

  const orderedTypes = Object.keys(TYPE_CONFIG).sort(
    (a, b) => TYPE_CONFIG[a].order - TYPE_CONFIG[b].order
  );

  for (const type of orderedTypes) {
    const commits = grouped[type];
    if (!commits || commits.length === 0) continue;

    const cfg = TYPE_CONFIG[type];
    lines.push(`### ${cfg.emoji} ${cfg.label}`);
    lines.push("");

    for (const commit of commits) {
      const scope    = commit.scope ? `**${commit.scope}**: ` : "";
      const breaking = commit.breaking ? " **`BREAKING`**" : "";
      const prLink   = commit.pr
        ? ` ([#${commit.pr}](${repoUrl}/pull/${commit.pr}))`
        : "";
      const hashLink = `[\`${commit.hash}\`](${repoUrl}/commit/${commit.hash})`;
      lines.push(`- ${scope}${commit.description}${breaking}${prLink} ${hashLink}`);
    }

    lines.push("");
  }

  if (stats.contributors.length > 0) {
    lines.push("### 👥 Contributors");
    lines.push("");
    for (const contributor of stats.contributors) {
      lines.push(`- ${contributor}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function writeChangelog(entry) {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");

  let existing = "";
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, "utf8");
  } else {
    existing = "# Changelog\n\nAll notable changes to Journedge are documented here.\nThis project follows [Semantic Versioning](https://semver.org/).\n\n";
  }

  if (existing.includes(`## [${version}]`)) {
    console.warn(`\n⚠️  Version ${version} already exists in CHANGELOG.md. Skipping write.`);
    console.warn("   Remove the existing entry or use a different version number.\n");
    return;
  }

  const headerEnd = existing.indexOf("\n## ");
  if (headerEnd === -1) {
    existing = existing.trimEnd() + "\n\n" + entry;
  } else {
    existing = existing.slice(0, headerEnd) + "\n" + entry + existing.slice(headerEnd);
  }

  fs.writeFileSync(changelogPath, existing, "utf8");
  console.log(`\n✓ CHANGELOG.md updated with v${version}`);
}

function main() {
  const detectedFrom = fromTag || getLastTag();
  const repoUrl      = getRepoUrl();

  console.log(`\nJournedge Changelog Generator`);
  console.log(`  Version : v${version}`);
  console.log(`  Range   : ${detectedFrom ? `${detectedFrom}..HEAD` : "entire history"}`);
  console.log(`  Repo    : ${repoUrl}`);
  console.log(`  Dry run : ${dryRun ? "yes" : "no"}`);
  console.log("");

  const commits = getCommits(detectedFrom);

  if (commits.length === 0) {
    console.warn("⚠️  No commits found in range.");
    console.warn(`   Try: node scripts/changelog.js ${version} <previous-tag>\n`);
    process.exit(0);
  }

  console.log(`Found ${commits.length} commit${commits.length !== 1 ? "s" : ""}\n`);

  const parsed  = commits.map(parseCommit);
  const grouped = {};

  for (const commit of parsed) {
    if (!grouped[commit.type]) grouped[commit.type] = [];
    grouped[commit.type].push(commit);
  }

  const stats = buildStats(grouped);
  const entry = formatEntry(version, detectedFrom, grouped, stats, repoUrl);

  console.log("─".repeat(60));
  console.log(entry);
  console.log("─".repeat(60));

  if (dryRun) {
    console.log("\n[Dry run] CHANGELOG.md was not modified.\n");
  } else {
    writeChangelog(entry);
    console.log("\nNext steps:");
    console.log(`  git add CHANGELOG.md`);
    console.log(`  git commit -m "chore: release v${version}"`);
    console.log(`  git tag v${version}`);
    console.log(`  git push && git push --tags\n`);
  }
}

main();
