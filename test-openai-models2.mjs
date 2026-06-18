import fetch from "node-fetch";

async function test() {
  const apiKey = "process.env.OPENAI_API_KEY || """;
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });
  const data = await response.json();
  const dalles = data.data.filter(m => m.id.includes("dall") || m.id.includes("dall-e"));
  console.log(dalles.map(m => m.id));
}

test();
