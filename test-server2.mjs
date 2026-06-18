import fetch from "node-fetch";

async function test() {
  const apiKey = "process.env.OPENAI_API_KEY || """;
  try {
    const res = await fetch("http://localhost:3000/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ model: "gemini-1.5-flash", contents: "System Instructions: hello text\n\nhello" })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 500));
  } catch(e) {
    console.error(e);
  }
}
test();
