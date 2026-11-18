import fs from "node:fs";
import path from "node:path";                       // builds file paths: "examples" + "login.png"
import { askOllama } from "./ollama.js";
import { chooseFile } from "./choose-file.js";      // our reusable menu

const VISION_MODEL = "qwen2.5vl:3b"; // qwen2.5vl:3b, qwen2.5vl:7b, qwen2.5vl:14b, qwen2.5vl:30b
const PROMPT = `You are looking at a UI screenshot. Your job is to describe the structure, not the styling.

Output a JSON description with this shape:
{
  "layout": "single-column" | "two-column" | "grid" | "centered",
  "components": [
    {
      "type": "header" | "hero" | "card" | "button" | "input" | "list" | "footer" | "text" | "link",
      "content": "the visible text",
      "children": []
    }
  ]
}

Rules:
- Identify only what you can see clearly. Don't guess at hidden state.
- Use the smallest accurate type. A "Sign up" element is a button, not a form.
- Put components that sit inside another one (for example, inside a card) in its "children" list.
- Skip decorative elements that don't have semantic meaning.
- If text is too small or blurry, return "[unclear]".
- Return ONLY the JSON. No explanation.`;

async function describeUI(imagePath) {
  // 1. Read the image and convert it to base64 text.
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");

  // 2. Send it to the vision model together with the prompt.
  const answer = await askOllama({
    model: VISION_MODEL,
    prompt: PROMPT,
    images: [imageBase64],
    format: "json",
  });

  // 3. Turn the JSON text into a real JavaScript object.
  try {
    return JSON.parse(answer);
  } catch {
    throw new Error("The AI did not return valid JSON. It said:\n" + answer);
  }
}

// If an image was typed after the command, use it.
// Otherwise (?? means "if nothing"), show the menu of images and let the user choose.
const imagePath = process.argv[2] ?? (await chooseFile("examples", /\.(png|jpe?g|webp)$/i));

console.log(`Looking at ${imagePath}... (this can take a few minutes)`);
const start = Date.now();                     // remember the start time

const description = await describeUI(imagePath);

// JSON.stringify(..., null, 2) turns the object into nicely indented text.
// (No need to print it: askOllama already showed the answer live.)
const jsonText = JSON.stringify(description, null, 2);

// Save the JSON to a file, so the next step (generate.js) can use it
// without waiting for the slow vision model again.
// path.parse("examples/login.png").name  ->  "login"
const outputPath = path.join("output", path.parse(imagePath).name + ".json");
fs.mkdirSync("output", { recursive: true });  // create the folder if it doesn't exist
fs.writeFileSync(outputPath, jsonText);

console.log(`Saved to ${outputPath}`);
console.log(`Done in ${Math.round((Date.now() - start) / 1000)} seconds.`);