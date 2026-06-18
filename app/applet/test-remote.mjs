import fetch from "node-fetch";

async function test() {
  try {
    const res = await fetch("https://ais-dev-uz4ke55grhnjejecivzkvq-10080150621.asia-southeast1.run.app/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-pro",
        contents: "hello"
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
