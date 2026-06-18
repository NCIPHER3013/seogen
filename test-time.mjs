import fetch from "node-fetch";

async function testTime() {
  const start = Date.now();
  const imageUrl = `https://image.pollinations.ai/prompt/a%20beautiful%20sunset?width=800&height=500&nologo=true&model=flux`;
  try {
    const res = await fetch(imageUrl);
    console.log("Status:", res.status);
    console.log("Time (ms):", Date.now() - start);
  } catch (e) {
    console.error(e.message);
  }
}

testTime();
