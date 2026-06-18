import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

// Intercept fetch calls to log URL
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log("SDK is fetching:", url);
  return originalFetch(url, options);
};

async function test() {
  const ai = new GoogleGenAI({ apiKey: "process.env.GEMINI_API_KEY || """ }); 
  const models = ["gemini-3.1-pro-preview", "gemini-3.1-flash-image-preview", "gemini-3.1-flash-preview", "gemini-3.1-flash"];
  for (const model of models) {
     try {
       await ai.models.generateContent({ model: model, contents: "a dog" });
       console.log(model, "Success!");
     } catch(e) { console.error(model, "error:", JSON.parse(e.message).error.code); }
  }
}
test();
