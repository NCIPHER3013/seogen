import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "process.env.GEMINI_API_KEY || """ }); 
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      await ai.models.generateContent({ 
          model: model, 
          contents: "hello" 
      });
      console.log(`Success with ${model}`);
    } catch (e: any) {
      console.error(`Error with ${model}:`, e.message);
    }
  }
}
test();
