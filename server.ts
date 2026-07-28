import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // โหลด .env.local ก่อนเริ่มทำงาน

import { GoogleGenAI } from "@google/genai";
import express from "express";

import cors from "cors";
import path from "path";
import https from "https";
import { createClient } from "@supabase/supabase-js";

export async function createApp() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ใช้ https module โดยตรงเพื่อหลีกเลี่ยง Headers Timeout Error ของ Node.js native fetch
  function fetchHttpsJson(url: string, body: string, headers: Record<string, string>, timeoutMs = 600000): Promise<{ status: number; data: any }> {
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

  // Seeddream Image Generation API
  app.post("/api/seeddream-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      const seedreamKey = process.env.SEEDREAM_API_KEY;
      
      if (!seedreamKey) {
        return res.status(500).json({ error: "SEEDREAM_API_KEY not configured in server" });
      }

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const url = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
      const bodyStr = JSON.stringify({
        model: 'seedream-4-5-251128',
        prompt: prompt,
        n: 1,
        size: '2560x1440',
        watermark: false
      });

      const response = await fetchHttpsJson(
        url, 
        bodyStr, 
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${seedreamKey}`
        }
      );

      if (response.status === 200 && response.data?.data?.[0]) {
        const imgData = response.data.data[0];
        if (imgData.b64_json) {
          return res.json({ url: `data:image/jpeg;base64,${imgData.b64_json}` });
        } else if (imgData.url) {
          try {
            const fetchImg = await fetch(imgData.url);
            const imgBuf = await fetchImg.arrayBuffer();
            const base64Image = Buffer.from(imgBuf).toString('base64');
            return res.json({ url: `data:image/jpeg;base64,${base64Image}` });
          } catch (e) {
            console.error('Failed to download image on server:', e);
            return res.status(500).json({ error: "Failed to download generated image on server" });
          }
        }
      }
      
      return res.status(response.status).json({ error: "Failed to generate image", details: response.data });

    } catch (err: any) {
      console.error("Seeddream API Error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // API proxy route using standard Gemini API
  app.post("/api/proxy/completions", async (req, res) => {
    try {
      let { messages } = req.body;
      
      const clientApiKey = req.headers['x-api-key'] as string;
      const useGlobal = !clientApiKey || clientApiKey === '__USE_GLOBAL__';
      let apiKey = clientApiKey;
      let model = 'gemini-1.5-flash';
      let baseUrl = '';

      if (useGlobal) {
        const globalConfig = await getGlobalAISettings();
        if (globalConfig) {
          apiKey = globalConfig.text_api_key || '';
          model = globalConfig.text_api_model || 'deepseek-v4-flash-260425';
          baseUrl = globalConfig.text_api_base_url || 'https://ark.ap-southeast.bytepluses.com/api/v3';
        }
      }

      if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY || '';
      }

      if (!apiKey) {
        return res.status(500).json({ error: "ไม่มีการตั้งค่า API Key ของระบบ" });
      }

      // Convert OpenAI style messages to plain text prompt (since the client expects generating articles)
      // The current client (ai.ts) sends system and user messages.
      const systemMessage = messages.find((m: any) => m.role === 'system')?.content || '';
      const userMessage = messages.find((m: any) => m.role === 'user')?.content || '';
      const prompt = `System Instructions: ${systemMessage}\n\nUser Request: ${userMessage}`;

      const isDeepSeek = model.toLowerCase().startsWith('deepseek-');
      const isArk = apiKey.startsWith('ark-');
      const isOpenAI = isArk || isDeepSeek || baseUrl.includes('ark.') || baseUrl.includes('z.ai') || baseUrl.includes('openai.com');

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (isOpenAI) {
        // Handle OpenAI-compatible streaming
        const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
        try {
          // Note: using node fetch for streaming
          const streamResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: messages,
              stream: true,
              max_tokens: isArk ? 16384 : 8192
            })
          });

          if (!streamResponse.ok) {
            const errBody = await streamResponse.text();
            res.write(`data: ${JSON.stringify({ error: `API Error: ${streamResponse.status} ${errBody}` })}\n\n`);
            return res.end();
          }

          if (streamResponse.body) {
            const reader = streamResponse.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            while (!done) {
              const { value, done: readDone } = await reader.read();
              done = readDone;
              if (value) {
                res.write(decoder.decode(value, { stream: true }));
              }
            }
          }
          res.end();
        } catch (err: any) {
          console.error("OpenAI stream error:", err);
          res.write(`data: ${JSON.stringify({ error: err.message || "Unknown stream error" })}\n\n`);
          res.end();
        }
      } else {
        // Fallback to Gemini
        const prompt = `System Instructions: ${systemMessage}\n\nUser Request: ${userMessage}`;
        const ai = new GoogleGenAI({ apiKey });
        
        try {
          const streamResponse = await ai.models.generateContentStream({
            model: model || 'gemini-1.5-flash',
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
      }
    } catch (error: any) {
      console.error("Proxy fetch error:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      let { model, contents, config } = req.body;
      
      const clientApiKey = req.headers['x-api-key'] as string;
      const useGlobal = !clientApiKey || clientApiKey === '__USE_GLOBAL__';
      let apiKey = clientApiKey;
      let globalConfig: GlobalAISettings | null = null;

      if (useGlobal) {
        globalConfig = await getGlobalAISettings();
        if (!globalConfig) {
          return res.status(500).json({ error: "ไม่มีการตั้งค่า API Key ของระบบ — กรุณาแจ้ง Admin ตั้งค่า AI" });
        }
        // ตรวจจับประเภท request จาก marker
        const isImageRequest = model === '__GLOBAL_IMAGE__';
        if (isImageRequest) {
          apiKey = globalConfig.image_api_key || '';
          model = globalConfig.image_api_model || undefined;
          config = config || {};
          config.baseUrl = globalConfig.image_api_base_url || undefined;
        } else {
          // text request (model === '__GLOBAL_TEXT__' หรือค่าอื่นๆ)
          apiKey = globalConfig.text_api_key || '';
          model = globalConfig.text_api_model || undefined;
          config = config || {};
          config.baseUrl = globalConfig.text_api_base_url || undefined;
        }
        if (!apiKey) {
          return res.status(500).json({ error: isImageRequest ? "ไม่มี Image API Key ในระบบ" : "ไม่มี Text API Key ในระบบ" });
        }
        console.log(`[Server] GLOBAL ${isImageRequest ? 'IMAGE' : 'TEXT'} → model: ${model}, baseUrl: ${config.baseUrl}`);
      } else if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        return res.status(500).json({ error: "Missing API Key" });
      }
      
      const isImageModel = model && ['dall-e', 'flux', 'midjourney', 'sdxl', 'glm-image', 'cogview', 'gpt-image', 'seedream'].some(m => model.toLowerCase().includes(m));
      const hasCustomBaseUrl = config && config.baseUrl && config.baseUrl.trim() !== '';
      const isZAIModel = model && (model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("cogview"));
      const isSeedreamModel = model && model.toLowerCase().includes("seedream");
      
      // NOTE: เมื่อ useGlobal ค่า model/baseUrl/apiKey ถูก override จาก DB ทั้งหมดแล้วด้านบน
      
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
                // Seedream 1K resolution — เล็กเพื่อ SEO (โหลดเร็ว, Core Web Vitals ดี)
                // รองรับ 1K/2K/4K และ explicit pixel sizes 512-8192
                size: (model && model.toLowerCase().includes('seedream'))
                  ? (config?.aspectRatio === '16:9' ? '1280x720'
                    : config?.aspectRatio === '4:3' ? '1152x864'
                    : config?.aspectRatio === '3:4' ? '864x1152'
                    : config?.aspectRatio === '9:16' ? '720x1280'
                    : '1024x1024')
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

      // (image request ถูกจัดการที่ block ด้านบนแล้ว — ถึงตรงนี้คือ text request แน่นอน)

      // ---- TEXT GENERATION (ByteDance Ark / Z.ai / Gemini) ----
      const isArkKey = apiKey.startsWith("ark-");
      const isDeepSeekModel = model && model.toLowerCase().startsWith("deepseek-");
      const isOpenAI = apiKey.startsWith("sk-") || apiKey.includes(".") || isArkKey || hasCustomBaseUrl || (model && (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3") || model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("claude-") || model.toLowerCase().startsWith("deepseek-")));
      
      console.log(`[Server] Text generation model: ${model}, isOpenAI: ${isOpenAI}, config.baseUrl: "${config?.baseUrl}", hasCustomBaseUrl: ${hasCustomBaseUrl}`);
      
      if (isOpenAI) {
          let baseUrl = (config?.baseUrl && config.baseUrl !== 'undefined' && config.baseUrl.trim()) ? config.baseUrl.replace(/\/+$/, '').trim() : '';
          if (!baseUrl) {
             if (isArkKey || isDeepSeekModel) {
                  baseUrl = "https://ark.ap-southeast.bytepluses.com/api/v3";
             } else if (model && model.toLowerCase().startsWith("glm-")) {
                  baseUrl = "https://api.z.ai/api/coding/paas/v4";
             } else {
                  baseUrl = "https://api.openai.com/v1";
             }
          }
          const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
          let actualModel = model || (isArkKey ? "deepseek-v4-flash-260425" : "glm-5");

          // Detect provider name จาก endpoint เพื่อแสดง log ที่ถูกต้อง
          const providerName = endpoint.includes('bytepluses') ? 'ByteDance Ark'
            : endpoint.includes('z.ai') ? 'Z.ai'
            : endpoint.includes('openai.com') ? 'OpenAI'
            : endpoint.includes('bigmodel') ? 'ZhipuAI'
            : 'AI';
          console.log(`[Server] ${providerName} request → ${endpoint}, model: ${actualModel}`);

          let responseData: { status: number; data: any };
          try {
            responseData = await fetchHttpsJson(
              endpoint,
              JSON.stringify({
                model: actualModel,
                messages: [{ role: "user", content: contents }],
                max_tokens: isArkKey ? 16384 : 8192
              }),
              {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              }
            );
          } catch (fetchErr: any) {
            console.error(`[Server] ${providerName} fetch failed: ${fetchErr.message}`, fetchErr.cause);
            if (fetchErr.message === 'Timeout') {
              return res.status(500).json({ error: `${providerName} API หมดเวลา (Timeout 15 นาที) — กรุณาลองใหม่ หรือปรับลดความยาวเนื้อหาลง` });
            }
            return res.status(500).json({ error: `เชื่อมต่อ ${providerName} ไม่ได้: ${fetchErr.message}` });
          }

          const { status, data } = responseData;
          if (status < 200 || status >= 300) {
            let errMsg = `HTTP Error ${status}`;
            if (typeof data === 'object' && data !== null) {
              errMsg = data.error?.message || data.error || JSON.stringify(data);
            } else if (typeof data === 'string') {
              errMsg = data;
            }
            console.error(`[Server] ${providerName} API error (${status}):`, errMsg);
            return res.status(status).json({ error: errMsg });
          }

          const fullText = data.choices?.[0]?.message?.content || "";
          console.log(`[Server] ${providerName} response OK, text length: ${fullText.length}`);
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
  app.use((err: any, req: any, res: any, _next: any) => {
    console.error(`[Server] Unhandled error on ${req.method} ${req.url}:`, err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  // Streaming text generation endpoint (SSE) — ใช้ https module เพื่อหลีกเลี่ยง Headers Timeout Error
  app.post("/api/gemini/stream-text", async (req, res) => {
    try {
      let { model, contents, config } = req.body;
      const clientApiKey = req.headers['x-api-key'] as string;
      const useGlobal = !clientApiKey || clientApiKey === '__USE_GLOBAL__';
      let apiKey = clientApiKey;

      // ถ้า client ไม่ส่ง key → ใช้ global settings จาก DB
      if (useGlobal) {
        const globalConfig = await getGlobalAISettings();
        if (!globalConfig || !globalConfig.text_api_key) {
          return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า Text API Key ของระบบ — กรุณาแจ้ง Admin" });
        }
        apiKey = globalConfig.text_api_key;
        // บังคับ override model และ baseUrl ด้วย global settings เสมอ
        // (ไม่สนค่าที่ client ส่งมา เพราะอาจเป็นค่าเก่าที่ค้างใน localStorage)
        // รองรับทั้ง marker '__GLOBAL_TEXT__' และค่าอื่นๆ
        model = globalConfig.text_api_model || undefined;
        config = config || {};
        config.baseUrl = globalConfig.text_api_base_url || undefined;
        console.log('[Server] GLOBAL TEXT (stream) → model:', model, 'baseUrl:', config.baseUrl);
      } else if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY;
      }

      if (!apiKey) {
        return res.status(500).json({ error: "Missing API Key" });
      }

      const hasCustomBaseUrl = config && config.baseUrl && config.baseUrl.trim() !== '';
      const isArkKey = apiKey.startsWith("ark-");
      const isDeepSeekModel = model && model.toLowerCase().startsWith("deepseek-");
      const isOpenAI = apiKey.startsWith("sk-") || apiKey.includes(".") || isArkKey || hasCustomBaseUrl || (model && (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3") || model.toLowerCase().startsWith("glm-") || model.toLowerCase().startsWith("claude-") || model.toLowerCase().startsWith("deepseek-")));

      if (!isOpenAI) {
        return res.status(400).json({ error: "Streaming supports OpenAI-compatible APIs only (ByteDance Ark, Z.ai, OpenAI, etc.)" });
      }

      let baseUrl = (config?.baseUrl && config.baseUrl !== 'undefined' && config.baseUrl.trim()) ? config.baseUrl.replace(/\/+$/, '').trim() : '';
      if (!baseUrl) {
        if (isArkKey || isDeepSeekModel) {
          baseUrl = "https://ark.ap-southeast.bytepluses.com/api/v3";
        } else if (model && model.toLowerCase().startsWith("glm-")) {
          baseUrl = "https://api.z.ai/api/coding/paas/v4";
        } else {
          baseUrl = "https://api.openai.com/v1";
        }
      }
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const actualModel = model || (isArkKey ? "deepseek-v4-flash-260425" : "glm-5");

      // Detect provider name จาก endpoint
      const streamProviderName = endpoint.includes('bytepluses') ? 'ByteDance Ark'
        : endpoint.includes('z.ai') ? 'Z.ai'
        : endpoint.includes('openai.com') ? 'OpenAI'
        : endpoint.includes('bigmodel') ? 'ZhipuAI'
        : 'AI';
      console.log(`[Server] ${streamProviderName} stream → ${endpoint}, model: ${actualModel}`);

      const body = JSON.stringify({
        model: actualModel,
        messages: [{ role: "user", content: contents }],
        stream: true,
        max_tokens: isArkKey ? 16384 : 8192
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
          res.status(500).json({ error: `${streamProviderName} API หมดเวลา (Timeout 15 นาที)` });
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

  // DB connection สำหรับ admin (bypass RLS) ผ่าน REST API (หลีกเลี่ยงปัญหา IPv4 Timeout บน Netlify/AWS Lambda)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;


  // ===== Helper: ดึง global AI settings จาก DB =====
  type GlobalAISettings = {
    text_api_key: string | null;
    text_api_model: string | null;
    text_api_base_url: string | null;
    image_api_key: string | null;
    image_api_model: string | null;
    image_api_base_url: string | null;
    updated_at?: string | null;
  };
  async function getGlobalAISettings(): Promise<GlobalAISettings | null> {
    if (!supabaseAdmin) return null;
    try {
      const { data, error } = await supabaseAdmin.from('global_settings').select('*').eq('id', 1).single();
      if (error || !data) return null;
      
      const maskForLog = (k: string | null) => k ? `${k.slice(0,6)}...${k.slice(-3)} (len=${k.length})` : 'NULL';
      console.log('[DB] Global settings:', {
        textKey: maskForLog(data.text_api_key),
        textModel: data.text_api_model,
        textBaseUrl: data.text_api_base_url,
        imageKey: maskForLog(data.image_api_key),
      });
      
      return data;
    } catch {
      return null;
    }
  }

  // Admin: ดึงข้อมูลผู้ใช้ทั้งหมด (bypass RLS)
  app.get("/api/admin/users", async (_req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ error: 'DB not configured' });
      const { data: usersData, error: usersError } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
      if (usersError) throw new Error(usersError.message);
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw new Error(authError.message);

      const authMap = new Map(authData.users.map(u => [u.id, u.user_metadata?.role || 'user'] as const));
      const combined = (usersData || []).map(u => ({ ...u, role: authMap.get(u.id) || 'user' }));
      res.json(combined);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin: อัปเดต Role ผู้ใช้งาน
  app.post("/api/admin/users/role", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ error: 'DB not configured' });
      const { userId, role } = req.body;
      if (!userId || !role) return res.status(400).json({ error: 'Missing userId or role' });

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { role } });
      if (error) throw new Error(error.message);

      res.json({ success: true, message: `Role updated to ${role}` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin: สถิติรวม (bypass RLS)
  app.get("/api/admin/stats", async (_req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ error: 'DB not configured' });
      
      const today = new Date();
      today.setHours(0,0,0,0);

      const [users, newUsers, articles, images] = await Promise.all([
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('images').select('*', { count: 'exact', head: true })
      ]);

      res.json({
        totalUsers: users.count || 0,
        newUsersToday: newUsers.count || 0,
        totalArticles: articles.count || 0,
        totalImages: images.count || 0,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin: ข้อมูลกราฟ 7 วันล่าสุด (bypass RLS)
  app.get("/api/admin/chart-data", async (_req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ error: 'DB not configured' });
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0,0,0,0);

      const [usersRes, articlesRes] = await Promise.all([
        supabaseAdmin.from('users').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
        supabaseAdmin.from('articles').select('created_at').gte('created_at', sevenDaysAgo.toISOString())
      ]);

      const dataMap = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        dataMap.set(dateStr, { date: dateStr, users: 0, articles: 0 });
      }

      const formatDate = (isoStr: string) => new Date(isoStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

      (usersRes.data || []).forEach(u => {
        const d = formatDate(u.created_at);
        if (dataMap.has(d)) dataMap.get(d).users++;
      });
      (articlesRes.data || []).forEach(a => {
        const d = formatDate(a.created_at);
        if (dataMap.has(d)) dataMap.get(d).articles++;
      });

      res.json(Array.from(dataMap.values()));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // สร้าง user profile อัตโนมัติ (สำหรับทุก user, bypass RLS)
  app.post("/api/ensure-user", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ error: 'DB not configured' });
      const { id, email } = req.body;
      if (!id || !email) return res.status(400).json({ error: 'Missing id or email' });
      
      const { error } = await supabaseAdmin.from('users').upsert({
        id, email, subscription_tier: 'free', word_credits: 10000, image_credits: 10
      }, { onConflict: 'id', ignoreDuplicates: true });
      
      if (error) throw new Error(error.message);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin: อัปเดตผู้ใช้
  app.post("/api/admin/users/update", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ error: 'DB not configured' });
      const { id, word_credits, image_credits, subscription_tier } = req.body;
      
      const { error } = await supabaseAdmin.from('users').update({
        word_credits, image_credits, subscription_tier
      }).eq('id', id);

      if (error) throw new Error(error.message);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ===== Admin: Global AI Settings =====
  // GET — ส่งคืนค่าที่ masked เพื่อความปลอดภัย (API key จะแสดงเฉพาะ prefix/suffix)
  app.get("/api/admin/settings", async (_req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ error: 'DB not configured' });
      const settings = await getGlobalAISettings();
      if (!settings) return res.json({});

      const mask = (k: string | null) => {
        if (!k) return '';
        if (k.length <= 12) return k.slice(0, 4) + '****';
        return k.slice(0, 8) + '...' + k.slice(-4);
      };
      res.json({
        text_api_key: mask(settings.text_api_key),
        text_api_key_set: !!settings.text_api_key,
        text_api_model: settings.text_api_model || '',
        text_api_base_url: settings.text_api_base_url || '',
        image_api_key: mask(settings.image_api_key),
        image_api_key_set: !!settings.image_api_key,
        image_api_model: settings.image_api_model || '',
        image_api_base_url: settings.image_api_base_url || '',
        updated_at: settings.updated_at,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST — บันทึกการตั้งค่า (ค่าที่ส่งมาเป็น '' จะไม่ overwrite key เดิม)
  app.post("/api/admin/settings", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ error: 'DB not configured' });
      const {
        text_api_key, text_api_model, text_api_base_url,
        image_api_key, image_api_model, image_api_base_url
      } = req.body;

      // Validation: ปฏิเสธค่า masked (มี '...') เพื่อป้องกันบันทึก key พัง
      const isValidKey = (k: any): boolean => {
        if (!k || typeof k !== 'string') return false;
        const trimmed = k.trim();
        if (!trimmed) return false;
        if (trimmed.includes('...')) return false; // masked pattern
        if (trimmed.includes('****')) return false;
        return true;
      };

      // ทำความสะอาด baseUrl — ถ้ามี /chat/completions ต่อท้าย ให้ตัดออกเก็บแค่ root API URL
      const cleanBaseUrl = (url: string): string => {
        if (!url) return '';
        let cleaned = url.trim().replace(/\/+$/, ''); // ตัด / ท้าย
        // ตัด /chat/completions หรือ /images/generations ออก เก็บแค่ root API URL
        cleaned = cleaned.replace(/\/chat\/completions$/, '').replace(/\/images\/generations$/, '');
        return cleaned;
      };

      // อ่านค่าเดิมก่อน (กรณีที่ frontend ส่งค่าว่างมา = ไม่เปลี่ยน key)
      const current = await getGlobalAISettings();
      const newTextKey = isValidKey(text_api_key) ? text_api_key.trim() : (current?.text_api_key || null);
      const newImageKey = isValidKey(image_api_key) ? image_api_key.trim() : (current?.image_api_key || null);

      const cleanTextBaseUrl = cleanBaseUrl(text_api_base_url);
      const cleanImageBaseUrl = cleanBaseUrl(image_api_base_url);

      // Debug log (mask key ก่อน log)
      const maskForLog = (k: string | null) => k ? `${k.slice(0,6)}...${k.slice(-3)} (len=${k.length})` : 'NULL';
      console.log('[Settings Save]', {
        textKey: maskForLog(newTextKey),
        textModel: text_api_model,
        textBaseUrl: cleanTextBaseUrl,
        imageKey: maskForLog(newImageKey),
        imageModel: image_api_model,
        imageBaseUrl: cleanImageBaseUrl,
      });

      const { error } = await supabaseAdmin.from('global_settings').update({
          text_api_key: newTextKey,
          text_api_model: text_api_model || null,
          text_api_base_url: cleanTextBaseUrl || null,
          image_api_key: newImageKey,
          image_api_model: image_api_model || null,
          image_api_base_url: cleanImageBaseUrl || null,
          updated_at: new Date().toISOString()
      }).eq('id', 1);

      if (error) throw new Error(error.message);
      res.json({ ok: true, message: 'Settings saved' });
    } catch (e: any) {
      console.error('[Settings save error]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Public endpoint สำหรับผู้ใช้ทั่วไป — บอกว่ามี global AI settings หรือไม่ (ไม่เปิดเผย key)
  app.get("/api/settings/has-global-ai", async (_req, res) => {
    try {
      const settings = await getGlobalAISettings();
      res.json({
        hasTextKey: !!settings?.text_api_key,
        textModel: settings?.text_api_model || null,
        hasImageKey: !!settings?.image_api_key,
        imageModel: settings?.image_api_model || null,
      });
    } catch {
      res.json({ hasTextKey: false, hasImageKey: false });
    }
  });

  // SSRF protection: ตรวจ URL ก่อน fetch เพื่อป้องกันการเข้าถึงระบบภายใน
  function isPrivateOrUnsafeUrl(rawUrl: string): boolean {
    try {
      const parsed = new URL(rawUrl);
      // อนุญาตเฉพาะ http/https เท่านั้น
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
      const host = parsed.hostname.toLowerCase();
      // บล็อก localhost และ .local
      if (host === 'localhost' || host.endsWith('.local')) return true;
      // บล็อก IPv6 loopback และ link-local/private
      if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true;
      // ตรวจ IPv4 (ทั้งหมดที่เป็น IP เปล่าๆ ไม่ใช่ domain)
      const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (ipMatch) {
        const [a, b] = ipMatch.slice(1).map(Number);
        if (a === 0) return true;                              // 0.0.0.0/8
        if (a === 10) return true;                             // 10.0.0.0/8 (private)
        if (a === 127) return true;                            // 127.0.0.0/8 (loopback)
        if (a === 169 && b === 254) return true;               // 169.254.0.0/16 (link-local / cloud metadata)
        if (a === 172 && b >= 16 && b <= 31) return true;      // 172.16.0.0/12 (private)
        if (a === 192 && b === 168) return true;               // 192.168.0.0/16 (private)
        if (a >= 224) return true;                             // multicast / reserved
      }
      return false;
    } catch {
      return true; // URL ไม่ valid → ถือว่าไม่ปลอดภัย
    }
  }

  app.post("/api/fetch-url", async (req, res) => {
    try {
      const { url } = req.body;
      // SSRF protection: บล็อก private IP / localhost / protocol อื่น
      if (!url || typeof url !== 'string' || isPrivateOrUnsafeUrl(url)) {
        return res.status(400).json({ error: "URL ไม่ปลอดภัยหรือไม่รองรับ (อนุญาตเฉพาะเว็บสาธารณะ http/https เท่านั้น)" });
      }
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
  if (process.env.NODE_ENV !== "production" && !process.env.NETLIFY) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.NETLIFY) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Only start the server if this file is run locally (not in Netlify functions)
if (!process.env.NETLIFY) {
  createApp().then(app => {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
