import { GoogleGenAI } from "@google/genai";
import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API proxy route using standard Gemini API
  app.post("/api/proxy/completions", async (req, res) => {
    try {
      let { messages, temperature } = req.body;
      
      // Using the API Key provided by the user
      const customApiKey = "";
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Server GEMINI_API_KEY is not configured." });
      }

      // Convert OpenAI style messages to plain text prompt (since the client expects generating articles)
      // The current client (ai.ts) sends system and user messages.
      const systemMessage = messages.find((m: any) => m.role === 'system')?.content || '';
      const userMessage = messages.find((m: any) => m.role === 'user')?.content || '';
      const prompt = `System Instructions: ${systemMessage}\n\nUser Request: ${userMessage}`;

      const ai = new GoogleGenAI({ apiKey });
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const streamResponse = await ai.models.generateContentStream({
          model: 'gemini-1.5-flash', // Best model for writing complex/long articles
          contents: prompt,
        });

        for await (const chunk of streamResponse) {
          if (chunk.text) {
             res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk.text } }] })}\n\n`);
          }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
      } catch (genError: any) {
        console.error("Gemini Generate stream error:", genError);
        res.write(`data: ${JSON.stringify({ error: genError.message || "Unknown error during streaming" })}\n\n`);
        res.end();
      }
    } catch (error: any) {
      console.error("Proxy fetch error:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      
      const apiKey = req.headers['x-api-key'] as string || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing API Key" });
      }
      
      const isImageModel = model && ['dall-e', 'flux', 'midjourney', 'sdxl', 'glm-image', 'cogview', 'gpt-image'].some(m => model.toLowerCase().includes(m));
      const hasCustomBaseUrl = config && config.baseUrl && config.baseUrl.trim() !== '';
      const isZAIModel = model && (model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("cogview"));
      
      if (isImageModel && (apiKey.startsWith("sk-") || hasCustomBaseUrl || isZAIModel)) {
        try {
          let baseUrl = config?.baseUrl?.replace(/\/+$/, '');
          if (!baseUrl) {
             if (model && model.toLowerCase().startsWith("glm-") || model?.toLowerCase().startsWith("cogview")) {
                 baseUrl = "https://open.bigmodel.cn/api/paas/v4";
             } else {
                 baseUrl = "https://api.openai.com/v1";
             }
          }
          const endpoint = `${baseUrl}/images/generations`;

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              prompt: contents.substring(0, 4000), // OpenAI limits prompt length
              n: 1,
              size: "1024x1024"
            })
          });
          
          let data;
          const respText = await response.text();
          try {
             data = JSON.parse(respText);
          } catch(e) {
             return res.status(500).json({ error: `Non-JSON proxy response (${response.status}): ${respText.substring(0, 100)}` });
          }

          if (!response.ok && (data?.error?.message?.includes('Insufficient balance') || data?.error?.message?.includes('resource package') || data?.error?.code === 'insufficient_quota')) {
              console.log('[Server] Image API insufficient balance for', model, '- falling back to Pollinations AI');
              const prompt = contents.substring(0, 1000);
              const encodedPrompt = encodeURIComponent(prompt);
              const fallbackImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=500&nologo=true&model=flux&enhance=true`;
              
              const imageRes = await fetch(fallbackImageUrl);
              if (imageRes.ok) {
                  const arrayBuffer = await imageRes.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  const base64Data = buffer.toString('base64');
                  return res.json({
                    candidates: [
                      {
                        content: { parts: [{ inlineData: { data: base64Data, mimeType: "image/jpeg" } }] }
                      }
                    ]
                  });
              }
          }

          if (!response.ok) {
             return res.status(500).json({ error: data.error?.message || data.error || JSON.stringify(data) });
          }
          
          let base64Image = "";
          if (data.data && data.data[0] && data.data[0].b64_json) {
              base64Image = data.data[0].b64_json;
          } else if (data.data && data.data[0] && data.data[0].url) {
              // try to fetch the URL if b64_json is not provided
              const fetchImg = await fetch(data.data[0].url);
              const imgBuf = await fetchImg.arrayBuffer();
              base64Image = Buffer.from(imgBuf).toString('base64');
          } else {
              return res.status(500).json({ error: "No image data returned from API: " + JSON.stringify(data) });
          }
          
          return res.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        data: base64Image,
                        mimeType: "image/png"
                      }
                    }
                  ]
                }
              }
            ]
          });
        } catch (e: any) {
           return res.status(500).json({ error: e.message || "Unknown proxy error" });
        }
      }

      const isImageReq = contents && !contents.includes("System Instructions:");
      if (isImageReq) {
        // Use Pollinations AI for reliable and free image generation 
        // bypassing any model limitations and quotas
        try {
          const prompt = contents.substring(0, 1000);
          const encodedPrompt = encodeURIComponent(prompt);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=500&nologo=true&model=flux&enhance=true`;
          
          const imageRes = await fetch(imageUrl);
          if (!imageRes.ok) {
            return res.status(500).json({ error: "Failed to generate image via Pollinations AI" });
          }
          
          const arrayBuffer = await imageRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          
          return res.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                      }
                    }
                  ]
                }
              }
            ]
          });
        } catch (pollError: any) {
           return res.status(500).json({ error: pollError.message || "Pollinations Image Error" });
        }
      }

      const isOpenAI = apiKey.startsWith("sk-") || hasCustomBaseUrl || (model && (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3") || model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("claude-")));
      
      console.log(`[Server] Generating content with model: ${model}, isOpenAI: ${isOpenAI}, isImageModel: ${isImageModel}`);
      
      if (isOpenAI) {
          let baseUrl = config?.baseUrl?.replace(/\/+$/, '');
          if (!baseUrl) {
             if (model && model.toLowerCase().startsWith("glm-")) {
                 baseUrl = "https://open.bigmodel.cn/api/paas/v4";
             } else {
                 baseUrl = "https://api.openai.com/v1";
             }
          }
          const endpoint = `${baseUrl}/chat/completions`;
          
          const actualModel = model || "gpt-4o-mini";
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: actualModel,
              messages: [{ role: "user", content: contents }]
            })
          });
          
          let data;
          const respText = await response.text();
          try {
             data = JSON.parse(respText);
          } catch(e) {
             return res.status(500).json({ error: `Non-JSON proxy response (${response.status}): ${respText.substring(0, 100)}` });
          }
          
          // Fallback logic for text models when quota/balance runs out
          if (!response.ok && (data?.error?.message?.includes('Insufficient balance') || data?.error?.message?.includes('resource package') || data?.error?.code === 'insufficient_quota' || response.status === 429)) {
              console.log(`[Server] Text API insufficient balance/quota for ${actualModel} - falling back to Pollinations AI`);
              const fallbackResponse = await fetch('https://text.pollinations.ai/', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: [{ role: "user", content: contents }]
                })
              });
              if (fallbackResponse.ok) {
                  const textOutput = await fallbackResponse.text();
                  return res.json({ text: textOutput });
              }
          }

          if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || data.error || JSON.stringify(data) });
          }
          return res.json({ text: data.choices[0].message.content });
      } else {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents,
          config
        });

        // Send back the structured response safely without spreading the complex response object
        return res.json({
          text: response.text,
          candidates: response.candidates
        });
      }
    } catch (error: any) {
      console.error("Backend proxy error generating content:", error);
      res.status(500).json({ error: error.message || "Unknown proxy error" });
    }
  });

  app.post("/api/fetch-url", async (req, res) => {
    try {
      const { url } = req.body;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const html = await response.text();
      const text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                       .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                       .replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();
      res.json({ text: text.substring(0, 15000) }); // Limit to 15k chars to avoid token limits
    } catch (error: any) {
      console.error("fetch-url error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch URL" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
