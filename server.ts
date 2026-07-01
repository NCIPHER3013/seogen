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
      
      const isImageModel = model && ['dall-e', 'flux', 'midjourney', 'sdxl', 'glm-image', 'cogview', 'gpt-image', 'seedream'].some(m => model.toLowerCase().includes(m));
      const hasCustomBaseUrl = config && config.baseUrl && config.baseUrl.trim() !== '';
      const isZAIModel = model && (model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("cogview"));
      const isSeedreamModel = model && model.toLowerCase().includes("seedream");
      
      // ---- IMAGE GENERATION (Seedream / OpenAI image) ----
      if (isImageModel && (apiKey.startsWith("sk-") || apiKey.startsWith("ark-") || hasCustomBaseUrl || isZAIModel || isSeedreamModel)) {
        try {
          let baseUrl = config?.baseUrl?.replace(/\/+$/, '');
          if (!baseUrl) {
             if (model && (model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("cogview"))) {
                  baseUrl = "https://open.bigmodel.cn/api/paas/v4";
             } else if (model && model.toLowerCase().includes("seedream")) {
                  baseUrl = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
             } else {
                  baseUrl = "https://api.openai.com/v1";
             }
          }
          const endpoint = baseUrl.endsWith('/images/generations') ? baseUrl : `${baseUrl}/images/generations`;

          console.log(`[Server] Image generation via: ${endpoint}, model: ${model}`);

          let imgResponse;
          try {
            imgResponse = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: model,
                prompt: contents.substring(0, 4000),
                n: 1,
                size: (model && model.toLowerCase().includes('seedream-4-0'))
                  ? (config?.aspectRatio === '16:9' ? '1280x720' : '1024x1024')
                  : (model && model.toLowerCase().includes('seedream'))
                    ? (config?.aspectRatio === '16:9' ? '2560x1440' : '1920x1920')
                    : (config?.aspectRatio === '16:9' ? '1024x768' : '1024x1024'),
                watermark: false
              }),
              signal: AbortSignal.timeout(180000)
            });
          } catch (fetchErr: any) {
            if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
              return res.status(500).json({ error: `Seedream API หมดเวลา (Timeout 180s) - กรุณาลองใหม่` });
            }
            return res.status(500).json({ error: `เชื่อมต่อ Seedream ไม่ได้: ${fetchErr.message}` });
          }
          
          let data;
          const respText = await imgResponse.text();
          try {
             data = JSON.parse(respText);
          } catch(e) {
             return res.status(500).json({ error: `Non-JSON image response (${imgResponse.status}): ${respText.substring(0, 200)}` });
          }

          if (!imgResponse.ok) {
            const errMsg = data.error?.message || data.error || JSON.stringify(data);
            console.error(`[Server] Seedream API error (${imgResponse.status}):`, errMsg);
            return res.status(imgResponse.status).json({ error: errMsg });
          }
          
          let base64Image = "";
          if (data.data && data.data[0] && data.data[0].b64_json) {
              base64Image = data.data[0].b64_json;
          } else if (data.data && data.data[0] && data.data[0].url) {
              const fetchImg = await fetch(data.data[0].url);
              const imgBuf = await fetchImg.arrayBuffer();
              base64Image = Buffer.from(imgBuf).toString('base64');
          } else {
              return res.status(500).json({ error: "No image data returned from Seedream: " + JSON.stringify(data) });
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
           return res.status(500).json({ error: e.message || "Unknown image proxy error" });
        }
      }

      const isImageReq = contents && !contents.includes("System Instructions:");
      if (isImageReq) {
        return res.status(400).json({ error: "Image generation requires Seedream API key. Please configure image API key in settings." });
      }

      // ---- TEXT GENERATION (Z.ai / Gemini) ----
      const isOpenAI = apiKey.startsWith("sk-") || apiKey.includes(".") || hasCustomBaseUrl || (model && (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3") || model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("claude-")));
      
      console.log(`[Server] Text generation model: ${model}, isOpenAI: ${isOpenAI}`);
      
      if (isOpenAI) {
          let baseUrl = config?.baseUrl?.replace(/\/+$/, '');
          if (!baseUrl) {
             if (model && model.toLowerCase().startsWith("glm-")) {
                  baseUrl = "https://api.z.ai/api/coding/paas/v4";
             } else {
                  baseUrl = "https://api.openai.com/v1";
             }
          }
          const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
          const actualModel = model || "glm-4.5";

          console.log(`[Server] Z.ai request → ${endpoint}, model: ${actualModel}`);

          let response;
          try {
            response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: actualModel,
                messages: [{ role: "user", content: contents }],
                stream: true
              }),
              signal: AbortSignal.timeout(900000)
            });
          } catch (fetchErr: any) {
            if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
              return res.status(500).json({ error: `Z.ai API หมดเวลา (Timeout 15 นาที) — กรุณาลองใหม่ หรือปรับลดความยาวเนื้อหาลง` });
            }
            return res.status(500).json({ error: `เชื่อมต่อ Z.ai ไม่ได้: ${fetchErr.message}` });
          }

          if (!response.ok) {
            let errMsg = `HTTP Error ${response.status}`;
            try {
              const errorData = await response.json();
              errMsg = errorData.error?.message || errorData.error || JSON.stringify(errorData);
            } catch (e) {
              errMsg = await response.text();
            }
            console.error(`[Server] Z.ai API error (${response.status}):`, errMsg);
            return res.status(response.status).json({ error: errMsg });
          }

          let fullText = "";
          let buffer = "";
          if (response.body) {
            // @ts-ignore - Node.js fetch body is a ReadableStream
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;
            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              if (value) {
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";
                for (const line of lines) {
                  const trimmedLine = line.trim();
                  if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                    try {
                      const dataObj = JSON.parse(trimmedLine.substring(6));
                      if (dataObj.choices?.[0]?.delta?.content) {
                        fullText += dataObj.choices[0].delta.content;
                      }
                    } catch (e) {}
                  }
                }
              }
            }
          }
          
          return res.json({ text: fullText });
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
        },
        signal: AbortSignal.timeout(15000)
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
