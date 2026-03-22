import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const input = process.argv[2] ?? "worksheets/printables/weekly-review-template.md";
  const sourcePath = path.resolve(process.cwd(), input);
  const exportDir = path.resolve(process.cwd(), "exports/markdown");
  const raw = await readFile(sourcePath, "utf8");

  await mkdir(exportDir, { recursive: true });
  await writeFile(path.join(exportDir, path.basename(sourcePath)), raw, "utf8");

  console.log(`Exported ${input} to ${exportDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
