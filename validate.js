import fs from "node:fs";
import ts from "typescript";                   
import { askOllama } from "./ollama.js";
import { chooseFile } from "./choose-file.js";

const REVIEW_MODEL = "llama3.1";
function checkSyntax(code) {
  const result = ts.transpileModule(code, {
    fileName: "Component.tsx",                     
    reportDiagnostics: true,                       
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX },
  });
  return result.diagnostics.map((problem) => {
    const message = ts.flattenDiagnosticMessageText(problem.messageText, "\n");
    if (problem.file && problem.start !== undefined) {
      const { line } = problem.file.getLineAndCharacterOfPosition(problem.start);
      return `Line ${line + 1}: ${message}`;      
    }
    return message;
  });
}
function buildReviewPrompt(code) {
  return `Here is a generated React component:

${code}

Check for:
1. Syntax errors that would prevent compilation
2. Hooks used outside of components
3. Missing imports
4. Accessibility issues that block screen readers
5. Type errors that TypeScript would catch

Rules:
- For each problem, say which element it is about (for example: the password input).
- Only list real problems you are sure about.
- Do NOT rewrite the code. Do NOT explain. Just the list.

If anything is wrong, answer in exactly this format:
ISSUES:
- (describe the first problem)
- (describe the second problem)

If nothing is wrong, answer with just the word: OK`;
}

const componentPath = process.argv[2] ?? (await chooseFile("output", /\.tsx$/i));
const code = fs.readFileSync(componentPath, "utf8");

// --- Check 1 ---
console.log("\nCheck 1: syntax (TypeScript compiler)");
const syntaxProblems = checkSyntax(code);

if (syntaxProblems.length === 0) {
  console.log("✅ No syntax errors.");
} else {
  console.log("❌ Syntax errors found:");
  syntaxProblems.forEach((problem) => console.log("  - " + problem));
}

// --- Check 2 --- 
console.log(`\nCheck 2: AI review by ${REVIEW_MODEL} (a second opinion: it can be wrong!)`);
await askOllama({ model: REVIEW_MODEL, prompt: buildReviewPrompt(code) });

// --- Verdict ---
if (syntaxProblems.length === 0) {
  console.log("Verdict: ✅ the code compiles. Read the AI review above and judge it yourself.");
} else {
  console.log("Verdict: ❌ the code does NOT compile. It must be fixed or generated again.");
  process.exitCode = 1;                         
}