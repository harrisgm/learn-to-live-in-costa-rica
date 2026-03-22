import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function normalizeTranscript(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  const input = process.argv[2];

  if (!input) {
    throw new Error("Usage: normalize-transcripts.ts <file>");
  }

  const transcriptPath = path.resolve(process.cwd(), input);
  const raw = await readFile(transcriptPath, "utf8");
  const normalized = normalizeTranscript(raw);

  await writeFile(transcriptPath, `${normalized}\n`, "utf8");
  console.log(`Normalized ${input}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
