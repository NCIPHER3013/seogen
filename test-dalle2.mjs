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
      size: "256x256"
    })
  });
  const data = await response.json();
  if (data.data) {
    console.log("Success:", data.data);
  } else {
    console.log("Error:", JSON.stringify(data));
  }
}

test();
