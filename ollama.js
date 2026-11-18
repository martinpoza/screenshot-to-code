const OLLAMA_URL = "http://localhost:11434/api/chat";

// Sends a prompt (and optionally images) to a local Ollama model and returns its full answer.
//   showProgress: true -> print the answer live in the terminal while the AI writes it
export async function askOllama({ model, prompt, images = [], format, showProgress = true }) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,                                            // llama3.1, qwen2.5vl:3b
      messages: [{ role: "user", content: prompt, images }],
      // STREAMING: Ollama sends the answer in small pieces as it writes it,
      // instead of one big message at the end. Two benefits:
      //   1. we can show progress live
      //   2. the connection never sits silent for more than 5 minutes
      //      (Node gives up on a silent connection after 5 minutes)
      stream: true,
      format,
      options: {
        temperature: 0,      // no randomness: same input, same output
        num_predict: 2500,   // safety limit: stop after ~2500 tokens (pieces of words),
                             // so a model stuck in a loop can't run forever
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Ollama answered with error ${response.status}: ${details}`);
  }

  // Each piece Ollama sends is one line of JSON, like:
  //   {"message":{"content":"Hel"},"done":false}
  //   {"message":{"content":"lo!"},"done":false}
  //   {"message":{"content":""},"done":true}
  // We glue the "content" parts together to get the full answer.
  const decoder = new TextDecoder();   // turns raw bytes into text
  let leftover = "";                   // a line that arrived only half-finished
  let fullAnswer = "";

  for await (const chunk of response.body) {
    const lines = (leftover + decoder.decode(chunk, { stream: true })).split("\n");
    leftover = lines.pop();            // the last line may be incomplete: keep it for later

    for (const line of lines) {
      if (line.trim() === "") continue;            // skip empty lines
      const piece = JSON.parse(line);
      if (piece.error) throw new Error(`Ollama error: ${piece.error}`);

      const text = piece.message?.content ?? "";
      fullAnswer += text;
      if (showProgress) process.stdout.write(text);   // print without a new line
    }
  }

  // Safety net: if the very last line didn't end with "\n", handle it too.
  if (leftover.trim() !== "") {
    fullAnswer += JSON.parse(leftover).message?.content ?? "";
  }

  if (showProgress) process.stdout.write("\n\n");
  return fullAnswer;
}
