import fs from "node:fs";
import path from "node:path";                       // builds file paths: "examples" + "login.png"
import readline from "node:readline/promises";      // asks questions in the terminal
import { askOllama } from "./ollama.js"; 

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

const EXAMPLES_FOLDER = "examples";

// Shows the images in the examples folder as a numbered list
// and asks the user to pick one by typing its number.
async function chooseImage() {
  // 1. List every file in the folder, keeping only images.
  const images = fs
    .readdirSync(EXAMPLES_FOLDER)
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name));

  if (images.length === 0) {
    throw new Error(`No images found in the "${EXAMPLES_FOLDER}" folder.`);
  }

  // 2. Print the menu: 1) login.png, 2) photo1.png, ...
  console.log("Images in the examples folder:");
  images.forEach((name, index) => {
    console.log(`  ${index + 1}) ${name}`);
  });

  // 3. Ask the question and wait for the user to type an answer.
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await terminal.question("Which one? Type its number: ");
  terminal.close();

  // 4. Turn the typed text into a list position (people count from 1, lists from 0).
  const chosen = images[Number(answer) - 1];
  if (!chosen) {
    throw new Error(`"${answer}" is not a number from the list.`);
  }

  return path.join(EXAMPLES_FOLDER, chosen);
}

// If an image was typed after the command, use it.
// Otherwise (?? means "if nothing"), show the menu and let the user choose.
const imagePath = process.argv[2] ?? (await chooseImage());

console.log(`Looking at ${imagePath}... (this can take a few minutes)`);
const start = Date.now();                     // remember the start time

const description = await describeUI(imagePath);

// JSON.stringify(..., null, 2) prints the object nicely indented.
console.log(JSON.stringify(description, null, 2));
console.log(`Done in ${Math.round((Date.now() - start) / 1000)} seconds.`);