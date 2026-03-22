import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const outputDir = path.resolve(process.cwd(), "data/lessons/generated");
  const starterUnit = {
    unitId: "generated-template",
    title: "Generated Lesson Template",
    week: 0,
    level: "beginner",
    objectives: ["Replace this with generated lesson objectives."],
    activities: [
      {
        type: "dialogue",
        title: "Starter drill",
        instructions: "Replace this with a generated drill."
      }
    ],
    review: ["Replace this with review targets."]
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "lesson-template.json"),
    `${JSON.stringify(starterUnit, null, 2)}\n`,
    "utf8"
  );

  console.log(`Wrote starter lesson template to ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
