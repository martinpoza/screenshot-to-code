import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

// Shows the files in a folder as a numbered list and asks the user to pick one.
//   folder:  where to look, e.g. "examples"
//   pattern: which files to show, e.g. /\.png$/i for PNG images
// Returns the full path of the chosen file, e.g. "examples/login.png".
export async function chooseFile(folder, pattern) {
  // 1. List the folder, keeping only files that match the pattern.
  //    (If the folder doesn't exist yet, treat it as empty.)
  const files = fs.existsSync(folder)
    ? fs.readdirSync(folder).filter((name) => pattern.test(name))
    : [];

  if (files.length === 0) {
    throw new Error(`No matching files found in the "${folder}" folder.`);
  }

  // 2. Print the menu: 1) login.png, 2) photo1.png, ...
  console.log(`Files in the "${folder}" folder:`);
  files.forEach((name, index) => {
    console.log(`  ${index + 1}) ${name}`);
  });

  // 3. Ask the question and wait for the user to type an answer.
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await terminal.question("Which one? Type its number: ");
  terminal.close();

  // 4. Turn the typed text into a list position (people count from 1, lists from 0).
  const chosen = files[Number(answer) - 1];
  if (!chosen) {
    throw new Error(`"${answer}" is not a number from the list.`);
  }

  return path.join(folder, chosen);
}
