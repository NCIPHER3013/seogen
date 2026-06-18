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
  if (data.data) {
    console.log("Success:", data.data[0].b64_json.substring(0, 50));
  } else {
    console.log("Error:", JSON.stringify(data));
  }
}

test();
