import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: "process.env.GEMINI_API_KEY || """ }); 
  const models = ['gemini-2.0-flash-image', 'gemini-1.5-pro-image'];
  for (const model of models) {
    try {
      console.log(`Trying imagen for ${model}`);
      const res = await ai.models.generateContent({
         model,
         contents: "a dog"
      });
      console.log(`Success with ${model}`);
    } catch (e: any) {
      console.error(`Error with ${model}:`, e.message);
    }
  }
}
test();
