import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = process.cwd();
const client = join(root, "client");

function gitFiles(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
}

try {
  const files = gitFiles([
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMRT",
    "-z",
    "--",
    "client/",
  ]);
  if (files.length === 0) process.exit(0);

  const unstaged = new Set(gitFiles(["diff", "--name-only", "-z", "--", "client/"]));
  if (files.some((file) => unstaged.has(file))) {
    console.error("Stage or stash unstaged changes in staged client files before committing.");
    process.exit(1);
  }

  // Pass literal staged paths, including spaces, without shell interpolation.
  const paths = files.map((file) => resolve(root, file));
  const scripts = paths.filter((file) => /\.(?:js|mjs|cjs|ts|tsx)$/.test(file));
  function run(tool, args, targets) {
    for (let offset = 0; offset < targets.length; offset += 100) {
      execFileSync(
        join(client, "node_modules", ".bin", tool),
        [...args, "--", ...targets.slice(offset, offset + 100)],
        { cwd: client, stdio: "inherit" },
      );
    }
  }

  run("eslint", ["--fix", "--max-warnings=0", "--no-warn-ignored"], scripts);
  run("prettier", ["--write", "--ignore-unknown"], paths);

  const changed = new Set(gitFiles(["diff", "--name-only", "-z", "--", "client/"]));
  if (files.some((file) => changed.has(file))) {
    console.error("ESLint or Prettier applied fixes. Review and stage them, then commit again.");
    process.exit(1);
  }
} catch (error) {
  console.error(
    "Pre-commit checks failed. Install client dependencies and resolve any reported errors.",
  );
  process.exit(error.status || 1);
}
