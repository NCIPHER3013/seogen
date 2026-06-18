import fetch from "node-fetch";

async function testText() {
  const apiKey = "process.env.OPENAI_API_KEY || """;
  try {
    const res = await fetch("http://localhost:3000/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ model: "gpt-4o-mini", contents: "System Instructions: hello\n\nworld" })
    });
    console.log("Text status:", res.status);
    const text = await res.text();
    console.log("Text response:", text.substring(0, 100));
  } catch(e) {
    console.error("Text fetch failed:", e.message);
  }
}
testText();
