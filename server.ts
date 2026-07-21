import { GoogleGenAI } from "@google/genai";
import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import https from "https";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ใช้ https module โดยตรงเพื่อหลีกเลี่ยง Headers Timeout Error ของ Node.js native fetch
  function fetchHttpsJson(url: string, body: string, headers: Record<string, string>, timeoutMs = 300000): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const req = https.request({
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: timeoutMs,
      }, (res) => {
        let rawData = '';
        res.on('data', (chunk: Buffer) => { rawData += chunk.toString(); });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, data: JSON.parse(rawData) });
          } catch (e) {
            resolve({ status: res.statusCode || 500, data: rawData });
          }
        });
      });
      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.write(body);
      req.end();
    });
  }

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
          let baseUrl = (config?.baseUrl && config.baseUrl !== 'undefined' && config.baseUrl.trim()) ? config.baseUrl.replace(/\/+$/, '').trim() : '';
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
      
      console.log(`[Server] Text generation model: ${model}, isOpenAI: ${isOpenAI}, config.baseUrl: "${config?.baseUrl}", hasCustomBaseUrl: ${hasCustomBaseUrl}`);
      
      if (isOpenAI) {
          let baseUrl = (config?.baseUrl && config.baseUrl !== 'undefined' && config.baseUrl.trim()) ? config.baseUrl.replace(/\/+$/, '').trim() : '';
          if (!baseUrl) {
             if (model && model.toLowerCase().startsWith("glm-")) {
                  baseUrl = "https://api.z.ai/api/coding/paas/v4";
             } else {
                  baseUrl = "https://api.openai.com/v1";
             }
          }
          const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
          const actualModel = model || "glm-5";

          console.log(`[Server] Z.ai request → ${endpoint}, model: ${actualModel}`);

          let responseData: { status: number; data: any };
          try {
            responseData = await fetchHttpsJson(
              endpoint,
              JSON.stringify({
                model: actualModel,
                messages: [{ role: "user", content: contents }]
              }),
              {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              }
            );
          } catch (fetchErr: any) {
            console.error(`[Server] Z.ai fetch failed: ${fetchErr.message}`, fetchErr.cause);
            if (fetchErr.message === 'Timeout') {
              return res.status(500).json({ error: `Z.ai API หมดเวลา (Timeout 15 นาที) — กรุณาลองใหม่ หรือปรับลดความยาวเนื้อหาลง` });
            }
            return res.status(500).json({ error: `เชื่อมต่อ Z.ai ไม่ได้: ${fetchErr.message}` });
          }

          const { status, data } = responseData;
          if (status < 200 || status >= 300) {
            let errMsg = `HTTP Error ${status}`;
            if (typeof data === 'object' && data !== null) {
              errMsg = data.error?.message || data.error || JSON.stringify(data);
            } else if (typeof data === 'string') {
              errMsg = data;
            }
            console.error(`[Server] Z.ai API error (${status}):`, errMsg);
            return res.status(status).json({ error: errMsg });
          }

          const fullText = data.choices?.[0]?.message?.content || "";
          console.log(`[Server] Z.ai response OK, text length: ${fullText.length}`);
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

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(`[Server] Unhandled error on ${req.method} ${req.url}:`, err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  // Streaming text generation endpoint (SSE) — ใช้ https module เพื่อหลีกเลี่ยง Headers Timeout Error
  app.post("/api/gemini/stream-text", async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      const apiKey = req.headers['x-api-key'] as string || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing API Key" });
      }

      const hasCustomBaseUrl = config && config.baseUrl && config.baseUrl.trim() !== '';
      const isOpenAI = apiKey.startsWith("sk-") || apiKey.includes(".") || hasCustomBaseUrl || (model && (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3") || model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("claude-")));

      if (!isOpenAI) {
        return res.status(400).json({ error: "Streaming supports OpenAI-compatible APIs only (Z.ai, OpenAI, etc.)" });
      }

      let baseUrl = (config?.baseUrl && config.baseUrl !== 'undefined' && config.baseUrl.trim()) ? config.baseUrl.replace(/\/+$/, '').trim() : '';
      if (!baseUrl) {
        if (model && model.toLowerCase().startsWith("glm-")) {
          baseUrl = "https://api.z.ai/api/coding/paas/v4";
        } else {
          baseUrl = "https://api.openai.com/v1";
        }
      }
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const actualModel = model || "glm-5";

      console.log(`[Server] Stream text → ${endpoint}, model: ${actualModel}`);

      const body = JSON.stringify({
        model: actualModel,
        messages: [{ role: "user", content: contents }],
        stream: true
      });

      const urlObj = new URL(endpoint);
      const httpsReq = https.request({
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 900000,
      }, (upstreamRes) => {
        if (upstreamRes.statusCode && upstreamRes.statusCode >= 400) {
          let errorBody = '';
          upstreamRes.on('data', (chunk) => { errorBody += chunk.toString(); });
          upstreamRes.on('end', () => {
            try {
              const errData = JSON.parse(errorBody);
              res.status(upstreamRes.statusCode!).json({ error: errData.error?.message || errorBody });
            } catch (e) {
              res.status(upstreamRes.statusCode!).json({ error: errorBody || 'Unknown error' });
            }
          });
          return;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        upstreamRes.on('data', (chunk: Buffer) => {
          try { res.write(chunk); } catch (e) { /* client disconnected */ }
        });
        upstreamRes.on('end', () => {
          try { res.end(); } catch (e) {}
        });
        upstreamRes.on('error', (err) => {
          console.error('[Server] Stream upstream error:', err.message);
          try { res.end(); } catch (e) {}
        });
      });

      httpsReq.on('error', (err) => {
        console.error('[Server] Stream fetch error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: `เชื่อมต่อไม่ได้: ${err.message}` });
        }
      });

      httpsReq.on('timeout', () => {
        httpsReq.destroy();
        if (!res.headersSent) {
          res.status(500).json({ error: 'Z.ai API หมดเวลา (Timeout 15 นาที)' });
        } else {
          try {
            res.write(`data: ${JSON.stringify({ error: 'Timeout' })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          } catch (e) {}
        }
      });

      httpsReq.write(body);
      httpsReq.end();
    } catch (error: any) {
      console.error("Stream endpoint error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Unknown stream error" });
      }
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
