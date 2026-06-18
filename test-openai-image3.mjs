import fetch from "node-fetch";

async function test() {
  const apiKey = "process.env.OPENAI_API_KEY || """;
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "dall-e-2",
      prompt: "A beautiful sunset",
      n: 1,
      size: "256x256",
      response_format: "b64_json"
    })
  });
  const data = await response.json();
  console.log(JSON.stringify(data).substring(0, 500));
}

test();
