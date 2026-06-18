import fetch from "node-fetch";

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "process.env.GEMINI_API_KEY || """ },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        contents: "hello"
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0,200));
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

test();
