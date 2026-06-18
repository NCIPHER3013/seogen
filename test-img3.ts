import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "process.env.GEMINI_API_KEY || """ }); 
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: "a dog"
    });
    console.log("Success with generateContent:");
    const candidates = res.candidates;
    if (candidates && candidates[0]) {
      const parts = candidates[0].content.parts;
      if (parts && parts[0]) {
        console.log("Part keys:", Object.keys(parts[0]));
        if (parts[0].inlineData) {
            console.log("has inlineData! Mime:", parts[0].inlineData.mimeType);
        } else if (parts[0].text) {
            console.log("has text:", parts[0].text.substring(0, 50));
        }
      }
    }
  } catch(e: any) {
    console.error("error:", e.message);
  }
}
test();
