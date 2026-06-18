import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "process.env.GEMINI_API_KEY || """ }); 
  try {
    const res = await ai.models.generateImages({
      model: "gemini-3.1-flash-image-preview",
      prompt: "a cat"
    });
    console.log("Success with generateImages:", res.generatedImages?.[0]?.image?.imageBytes ? "has image bytes" : res);
  } catch(e: any) {
    console.error("error generateImages:", e.message);
  }
}
test();
