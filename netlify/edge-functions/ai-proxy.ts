import type { Config, Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  // Only handle POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    const bodyText = await request.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    
    // 1. Get Environment Variables
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";
    let apiKey = request.headers.get("x-api-key") || "";
    
    // Default config
    let model = body.model || "deepseek-v4-flash-260425";
    let baseUrl = "https://ark.ap-southeast.bytepluses.com/api/v3";
    
    // Fetch global settings if using global key
    if (!apiKey || apiKey === "__USE_GLOBAL__") {
      if (supabaseUrl && supabaseKey) {
        try {
          const sRes = await fetch(`${supabaseUrl}/rest/v1/global_settings?id=eq.1&select=*`, {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`
            }
          });
          if (sRes.ok) {
            const data = await sRes.json();
            if (data && data[0]) {
              const s = data[0];
              const isImage = path === "/api/seeddream-image" || model === "__GLOBAL_IMAGE__";
              if (isImage) {
                apiKey = s.image_api_key || "";
                model = s.image_api_model || model;
                baseUrl = s.image_api_base_url || baseUrl;
              } else {
                apiKey = s.text_api_key || "";
                model = s.text_api_model || model;
                baseUrl = s.text_api_base_url || baseUrl;
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch global settings:", e);
        }
      }
    }

    if (!apiKey && path === "/api/seeddream-image") {
      apiKey = Deno.env.get("SEEDREAM_API_KEY") || "";
    } else if (!apiKey) {
      apiKey = Deno.env.get("GEMINI_API_KEY") || "";
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ไม่มีการตั้งค่า API Key ของระบบ" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Clean baseUrl
    baseUrl = baseUrl.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '').replace(/\/images\/generations$/, '');

    // ---------------------------------------------------------
    // Endpoint: /api/seeddream-image
    // ---------------------------------------------------------
    if (path === "/api/seeddream-image") {
      const imgUrl = `${baseUrl}/images/generations`;
      const res = await fetch(imgUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'seedream-4-5-251128',
          prompt: body.prompt,
          n: 1,
          size: '2560x1440',
          watermark: false
        })
      });
      
      const resData = await res.json();
      if (res.ok && resData.data?.[0]) {
        const imgData = resData.data[0];
        if (imgData.b64_json) {
          return new Response(JSON.stringify({ url: `data:image/jpeg;base64,${imgData.b64_json}` }), {
            headers: { "Content-Type": "application/json" }
          });
        } else if (imgData.url) {
          try {
            const fetchImg = await fetch(imgData.url);
            const imgBuf = await fetchImg.arrayBuffer();
            // In Deno, use btoa to base64 encode
            let binary = '';
            const bytes = new Uint8Array(imgBuf);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Image = btoa(binary);
            return new Response(JSON.stringify({ url: `data:image/jpeg;base64,${base64Image}` }), {
              headers: { "Content-Type": "application/json" }
            });
          } catch (e) {
            return new Response(JSON.stringify({ error: "Failed to download generated image on server" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
      }
      return new Response(JSON.stringify({ error: "Failed to generate image", details: resData }), {
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---------------------------------------------------------
    // Endpoints: /api/gemini/generate & /api/proxy/completions
    // ---------------------------------------------------------
    const chatUrl = `${baseUrl}/chat/completions`;
    const isStream = path === "/api/proxy/completions";
    
    // Map input to OpenAI messages format
    let messages = body.messages;
    if (!messages) {
      const contents = body.contents || body.prompt || "";
      const config = body.config || {};
      const sysInstruction = config.systemInstruction?.parts?.[0]?.text || "";
      messages = [];
      if (sysInstruction) {
        messages.push({ role: "system", content: sysInstruction });
      }
      messages.push({ role: "user", content: contents });
    }

    const payload = {
      model: model,
      messages: messages,
      stream: isStream,
      max_tokens: 8192
    };

    const fetchRes = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (isStream) {
      // Stream response directly to client!
      // This completely bypasses the 10-second Netlify standard function timeout
      return new Response(fetchRes.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    } else {
      const data = await fetchRes.json();
      if (!fetchRes.ok) {
        return new Response(JSON.stringify({ error: data }), {
          status: fetchRes.status,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Transform OpenAI response to Gemini format (expected by frontend ai.ts)
      if (data.choices && data.choices[0]) {
        const text = data.choices[0].message?.content || "";
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text }] } }]
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: ["/api/gemini/generate", "/api/proxy/completions", "/api/seeddream-image"]
};
