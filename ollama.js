const OLLAMA_URL = "http://localhost:11434/api/chat";
export async function askOllama({ model, prompt, images = [], format }) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,                                            // qllama3.1, qwen2.5vl:3b
      messages: [{ role: "user", content: prompt, images }],
      stream: false,
      format,                                          
      options: { temperature: 0 },                    
    }),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Ollama answered with error ${response.status}: ${details}`);
  }

  const data = await response.json();
  return data.message.content;
}