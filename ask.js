
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.1";

async function askOllama(question) {

  const response = await fetch(OLLAMA_URL, {
    method: "POST",                                  
    headers: { "Content-Type": "application/json" },  
    body: JSON.stringify({                           
      model: MODEL,
      messages: [{ role: "user", content: question }],
      stream: false,                                  
    }),
  });

  
  if (!response.ok) {
    throw new Error(`Ollama answered with error ${response.status}`);
  }
   const data = await response.json();  
  return data.message.content;
}
console.log("Thinking... (the first answer can take a minute)");

const answer = await askOllama("Explain what a React component is in one sentence, and who is Newton.");
console.log("AI says:", answer);