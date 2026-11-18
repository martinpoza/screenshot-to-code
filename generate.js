import fs from "node:fs";
import path from "node:path";
import { askOllama } from "./ollama.js";
import { chooseFile } from "./choose-file.js";

const CODE_MODEL = "llama3.1";

// The prompt from prompts.md (Step 2). ${...} inserts the JSON into the text.
function buildPrompt(jsonText) {
  return `You are a React engineer. Given this JSON description of a UI, generate a working React component.

JSON:
${jsonText}

Requirements:
- TypeScript
- Tailwind classes for styling (no inline styles)
- Functional component, default export
- No external dependencies beyond React
- Realistic placeholder content where the JSON says "[unclear]"
- Accessible: semantic HTML, alt text, aria labels where needed
- Use only the components listed in the JSON. Don't invent extra sections.

Return ONLY the component code. No explanation, no markdown fence.`;
}

// AIs often ignore "no markdown fence" and wrap code like this:
//   ```tsx
//   ...code...
//   ```
// This function keeps only the code between the fences (if there are any).
function cleanCode(text) {
  const fenced = text.match(/```[a-z]*\n([\s\S]*?)```/i);
  const code = fenced ? fenced[1] : text;
  return code.trim() + "\n";
}

async function generateComponent(jsonText) {
  const answer = await askOllama({ model: CODE_MODEL, prompt: buildPrompt(jsonText) });
  return cleanCode(answer);
}

// Pick a JSON file made by describe.js (or use the one typed after the command).
const jsonPath = process.argv[2] ?? (await chooseFile("output", /\.json$/i));

console.log(`Writing a React component from ${jsonPath}... (this can take a few minutes)`);
const start = Date.now();

const jsonText = fs.readFileSync(jsonPath, "utf8");   // "utf8" = read it as text
const code = await generateComponent(jsonText);

// Save it next to the JSON: output/login.json -> output/login.tsx
const outputPath = path.join("output", path.parse(jsonPath).name + ".tsx");
fs.writeFileSync(outputPath, code);

console.log(`Saved to ${outputPath}`);
console.log(`Done in ${Math.round((Date.now() - start) / 1000)} seconds.`);
