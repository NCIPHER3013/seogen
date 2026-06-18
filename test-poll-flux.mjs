import fetch from "node-fetch";

async function test() {
  const imageUrl = `https://image.pollinations.ai/prompt/a%20beautiful%20sunset?width=800&height=500&nologo=true&model=flux`;
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) { 
    console.error("Failed");
  } else {
    console.log("Success with flux");
  }
}
test();
