import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

async function main() {
  const repoRoot = process.cwd();
  const privateProfilesDir = path.join(repoRoot, "data/private/profiles");
  const privateErrorLogsDir = path.join(repoRoot, "data/private/error-logs");
  const privateSessionHistoryDir = path.join(
    repoRoot,
    "data/private/session-history"
  );

  await mkdir(privateProfilesDir, { recursive: true });
  await mkdir(privateErrorLogsDir, { recursive: true });
  await mkdir(privateSessionHistoryDir, { recursive: true });

  await copyFile(
    path.join(repoRoot, "data/user/profile_guy.json"),
    path.join(privateProfilesDir, "profile_guy.local.json")
  );
  await copyFile(
    path.join(repoRoot, "data/user/profile_wife.json"),
    path.join(privateProfilesDir, "profile_wife.local.json")
  );
  await copyFile(
    path.join(repoRoot, "data/user/error_log.json"),
    path.join(privateErrorLogsDir, "error_log.local.json")
  );
  await copyFile(
    path.join(repoRoot, "data/user/session_history_template.json"),
    path.join(privateSessionHistoryDir, "session_history.local.json")
  );

  console.log("Seeded local-only learner files under data/private/.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
