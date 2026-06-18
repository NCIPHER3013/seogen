import fetch from "node-fetch";

async function test() {
  const apiKey = "process.env.OPENAI_API_KEY || """;
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });
  const data = await response.json();
  const models = data.data.map(m => m.id);
  console.log("Models: " + models.slice(0, 10).join(", ") + " ... " + models.length + " total");
}

test();
