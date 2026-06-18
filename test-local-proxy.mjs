import fetch from "node-fetch";

async function testText() {
  try {
    const res = await fetch("http://localhost:3000/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", contents: "System Instructions: hello\n\nworld" })
    });
    console.log("Text status:", res.status);
    const text = await res.text();
    console.log("Text response:", text.substring(0, 100));
  } catch(e) {
    console.error("Text fetch failed:", e.message);
  }
}

async function testImage() {
  try {
    const res = await fetch("http://localhost:3000/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemini-1.5-flash", contents: "A beautiful sunset" })
    });
    console.log("Image status:", res.status);
    const text = await res.text();
    console.log("Image response:", text.substring(0, 100));
  } catch(e) {
    console.error("Image fetch failed:", e.message);
  }
}

async function run() {
  await testText();
  await testImage();
}
run();
