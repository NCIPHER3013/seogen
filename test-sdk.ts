import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "invalid" });
  try {
    await ai.models.generateContent({ model: "gemini-2.5-pro", contents: "hello" });
  } catch (e: any) {
    console.error("SDK Error message:", e.message);
  }
}
test();
