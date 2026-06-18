import { GoogleGenAI } from "@google/genai";
const apiKey = "process.env.GEMINI_API_KEY || """;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: "Hello",
    });
    console.log("SUCCESS:", res.text);
  } catch (e: any) {
    console.error("ERROR 1.5 pro:", e.message);
  }
  
  try {
    const res = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Hello",
    });
    console.log("SUCCESS:", res.text);
  } catch (e: any) {
    console.error("ERROR 1.5 flash:", e.message);
  }

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    console.log("SUCCESS:", res.text);
  } catch (e: any) {
    console.error("ERROR 2.5 flash:", e.message);
  }
}
test();
