import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "process.env.GEMINI_API_KEY || """ });
  try {
    await ai.models.generateContent({ 
        model: "gemini-2.5-pro", 
        contents: { parts: [{ text: "hello" }] } 
    } as any);
    console.log("Success with object");
  } catch (e: any) {
    console.error("SDK Error object:", e.message);
  }

  try {
    await ai.models.generateContent({ 
        model: "gemini-2.5-pro", 
        contents: "hello" 
    });
    console.log("Success with string");
  } catch (e: any) {
    console.error("SDK Error string:", e.message);
  }
}
test();
