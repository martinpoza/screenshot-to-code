
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qllama3.1"; //qwen2.5vl:3b

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
   // console.log(data); to see the full response from Ollama
  return data.message.content;
}
console.log("Thinking... (the first answer can take a minute)");

const answer = await askOllama("Explain what a React component is in one sentence.");
console.log("AI says:", answer);