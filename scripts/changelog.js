#!/usr/bin/env node

/**
 * Journedge Changelog Generator
 * 
 * Usage:
 *   node scripts/changelog.js <version> [tag_from]
 * 
 * Examples:
 *   node scripts/changelog.js 1.1.0
 *   node scripts/changelog.js 1.1.0 v1.0.0
 * 
 * This script reads git commits since the last tag and generates
 * a structured CHANGELOG entry grouped by type.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const version = process.argv[2];
const fromTag = process.argv[3];

if (!version) {
  console.error("Usage: node scripts/changelog.js <version> [tag_from]");
  process.exit(1);
}

// Get commits since last tag or beginning
function getCommits(from) {
  try {
    const range = from ? `${from}..HEAD` : "HEAD";
    const log = execSync(`git log ${range} --pretty=format:"%s|%an|%h" --no-merges`, {
      encoding: "utf8",
    });
    return log.trim().split("\n").filter(Boolean).map((line) => {
      const [message, author, hash] = line.split("|");
      return { message, author, hash };
    });
  } catch {
    return [];
  }
}

// Parse conventional commit format
function parseCommit(commit) {
  const match = commit.message.match(/^(feat|fix|refactor|docs|chore|perf)(\(.+\))?:\s+(.+)$/);
  if (!match) return { type: "other", scope: null, description: commit.message, hash: commit.hash };
  return {
    type: match[1],
    scope: match[2] ? match[2].replace(/[()]/g, "") : null,
    description: match[3],
    hash: commit.hash,
  };
}

const TYPE_LABELS = {
  feat: "New Features",
  fix: "Bug Fixes",
  refactor: "Improvements",
  perf: "Performance",
  docs: "Documentation",
  chore: "Maintenance",
  other: "Other Changes",
};

const TYPE_ORDER = ["feat", "fix", "refactor", "perf", "docs", "chore", "other"];

function generateChangelog(version, fromTag) {
  const commits = getCommits(fromTag);

  if (commits.length === 0) {
    console.warn("No commits found. Make sure you have commits since the last tag.");
  }

  const parsed = commits.map(parseCommit);

  // Group by type
  const grouped = {};
  for (const commit of parsed) {
    if (!grouped[commit.type]) grouped[commit.type] = [];
    grouped[commit.type].push(commit);
  }

  const date = new Date().toISOString().split("T")[0];
  const lines = [];

  lines.push(`## [${version}] - ${date}`);
  lines.push("");

  for (const type of TYPE_ORDER) {
    if (!grouped[type] || grouped[type].length === 0) continue;
    lines.push(`### ${TYPE_LABELS[type]}`);
    lines.push("");
    for (const commit of grouped[type]) {
      const scope = commit.scope ? `**${commit.scope}**: ` : "";
      lines.push(`- ${scope}${commit.description} (\`${commit.hash}\`)`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function updateChangelogFile(entry) {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");

  let existing = "";
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, "utf8");
  } else {
    existing = "# Changelog\n\nAll notable changes to Journedge are documented here.\n\n";
  }

  // Insert new entry after the header
  const headerEnd = existing.indexOf("\n## ");
  if (headerEnd === -1) {
    existing = existing.trimEnd() + "\n\n" + entry;
  } else {
    existing = existing.slice(0, headerEnd) + "\n" + entry + existing.slice(headerEnd);
  }

  fs.writeFileSync(changelogPath, existing, "utf8");
  console.log(`✓ CHANGELOG.md updated with version ${version}`);
}

const entry = generateChangelog(version, fromTag);
console.log("\n--- Generated Entry ---\n");
console.log(entry);
console.log("--- End ---\n");

updateChangelogFile(entry);

// Also create a git tag suggestion
console.log(`Next steps:`);
console.log(`  git add CHANGELOG.md`);
console.log(`  git commit -m "chore: release v${version}"`);
console.log(`  git tag v${version}`);
console.log(`  git push && git push --tags`);
