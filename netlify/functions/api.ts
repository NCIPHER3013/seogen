import serverless from "serverless-http";
import { createApp } from "../../server.js";

// We create the app asynchronously but cache it globally 
// so subsequent serverless invocations reuse it
let cachedHandler: any = null;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    // Set NETLIFY environment flag so our server.ts knows not to run Vite middleware
    process.env.NETLIFY = "true";
    
    const app = await createApp();
    cachedHandler = serverless(app);
  }
  
  return cachedHandler(event, context);
};
