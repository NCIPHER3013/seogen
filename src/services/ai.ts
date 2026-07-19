import localforage from 'localforage';
import { GoogleGenAI } from "@google/genai";

async function compressBase64Image(dataUri: string, maxWidth = 900, quality = 0.70): Promise<string> {
  if (typeof window === 'undefined') return dataUri;
  return new Promise((resolve) => {
    if (!dataUri || !dataUri.startsWith('data:image/')) {
      resolve(dataUri);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUri;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(dataUri);
        }
      } catch (err) {
        console.warn('Compression error during generation:', err);
        resolve(dataUri);
      }
    };
    img.onerror = () => {
      resolve(dataUri);
    };
  });
}

async function resolvePromptUrls(promptText: string): Promise<string> {
  if (!promptText) return promptText;
  const urlRegex = /(https?:\/\/[^\s<>'"]+)/g;
  const urls = promptText.match(urlRegex);
  if (!urls || urls.length === 0) return promptText;

  const uniqueUrls = Array.from(new Set(urls));
  // ดึงเนื้อหาจากทุก URL พร้อมกัน (parallel)
  const fetchResults = await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        const response = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.text) {
            return `\n\n--- ข้อมูลจากเว็บ ${url} ---\n${data.text}\n--- จบข้อมูลจากเว็บ ---`;
          }
        }
      } catch (e) {
        console.warn("Could not fetch url content:", url, e);
      }
      return '';
    })
  );

  let resolvedText = promptText;
  for (const content of fetchResults) {
    if (content) resolvedText += content;
  }
  return resolvedText;
}

// Concurrency limiter สำหรับรูปภาพ — จำกัดไม่เหนือ 3 รูปพร้อมกัน เพื่อไม่ให้เกิน browser connection limit
const MAX_CONCURRENT_IMAGES = 3;
const imageQueue: Array<{ fn: () => Promise<string>; resolve: (v: string) => void; reject: (e: Error) => void }> = [];
let imageQueueRunning = 0;

function scheduleImage(fn: () => Promise<string>): Promise<string> {
  return new Promise((resolve, reject) => {
    imageQueue.push({ fn, resolve, reject });
    processImageQueue();
  });
}

function processImageQueue() {
  while (imageQueueRunning < MAX_CONCURRENT_IMAGES && imageQueue.length > 0) {
    imageQueueRunning++;
    const item = imageQueue.shift()!;
    item.fn()
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        imageQueueRunning--;
        processImageQueue();
      });
  }
}

// Helper: สร้างรูปภาพเดี่ยว
async function generateSingleImage(
  index: number,
  imagePrompt: string,
  ar: string,
  config: any,
  resolvedImageApiPrompt: string
): Promise<string> {
  const imageGenApiKey = (config.customOpenAiApiKey && config.customOpenAiApiKey.trim()) || "YOUR_OPENAI_API_KEY";
  if (!imageGenApiKey || imageGenApiKey.trim() === "YOUR_OPENAI_API_KEY") {
    throw new Error("No image API key");
  }

  const finalImagePrompt = resolvedImageApiPrompt
    ? `Style Instructions: ${resolvedImageApiPrompt}\nSubject: ${imagePrompt}`
    : imagePrompt;

  const imageRequestModel = (!config.imageApiModel || config.imageApiModel === 'auto')
    ? (imageGenApiKey.startsWith('ark-') ? 'seedream-4-0-250828' : 'gpt-image-2')
    : config.imageApiModel;

  // Retry สูงสุด 2 ครั้ง สำหรับ network errors
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const imageRes = await fetch('/api/gemini/generate', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": imageGenApiKey
        },
        body: JSON.stringify({
          model: imageRequestModel,
          contents: finalImagePrompt,
          config: {
            baseUrl: config.imageApiBaseUrl,
            aspectRatio: ar
          }
        })
      });

      if (!imageRes.ok) {
        const errorData = await imageRes.json().catch(() => null);
        let errorMessage = errorData?.error || "Image generation failed";
        if (typeof errorMessage === 'string') {
          try {
            const parsed = JSON.parse(errorMessage);
            if (parsed.error && parsed.error.message) errorMessage = parsed.error.message;
          } catch (e) { }
        }
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      const imgData = await imageRes.json();
      let base64 = "";
      let mimeType = "image/png";

      for (const part of imgData.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
          break;
        }
      }
      if (base64) {
        let dataUri = `data:${mimeType};base64,${base64}`;
        try {
          dataUri = await compressBase64Image(dataUri, 900, 0.70);
        } catch (cErr) {
          console.warn("Compression failed", cErr);
        }
        const imageId = `gemini_img_${Date.now()}_${index}`;
        await localforage.setItem(imageId, dataUri);
        return imageId;
      }
      throw new Error("ระบบสร้างรูปภาพสำเร็จแต่ไม่พบข้อมูลภาพ");
    } catch (err: any) {
      lastError = err;
      // Retry สำหรับ network errors เท่านั้น (ไม่ retry สำหรับ 429, 403, quota)
      const msg = err?.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('403') || msg.includes('overdue') || msg.includes('Forbidden')) {
        throw err; // ไม่ retry quota/account errors
      }
      if (attempt < 2) {
        console.warn(`[Image ${index}] Attempt ${attempt + 1} failed: ${msg}, retrying in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError;
}

export async function generateArticle(
  keyword: string,
  title: string | undefined,
  config: {
    language: string;
    tone: string;
    pov: string;
    lengthWords: number;
    audience: string;
    secondaryKeywords: string[];
    copywritingFramework?: string;
    coverToggle: boolean;
    inlineCount: number;
    aspectRatio: string;
    outline?: string[];
    sitemaps?: string[];
    includeLinks?: string[];
    includeSources?: string[];
    excludeSources?: string[];
    targetCountry?: string;
    formality?: string;
    formattingBold?: boolean;
    formattingItalics?: boolean;
    formattingTables?: boolean;
    formattingQuotes?: boolean;
    formattingLists?: boolean;
    headingCase?: string;
    knowledgeMode?: string;
    cta?: string;
    keyTakeaways?: boolean;
    conclusion?: boolean;
    faqs?: boolean;
    articleSize?: string;
    linksPerH2?: number;
    autoExternalLinks?: boolean;
    autoYoutube?: boolean;
    customApiKey?: string;
    customOpenAiApiKey?: string;
    textApiModel?: string;
    textApiBaseUrl?: string;
    textApiPrompt?: string;
    imageApiModel?: string;
    imageApiBaseUrl?: string;
    imageApiPrompt?: string;
  },
  onChunk?: (partialText: string, stage: 'text' | 'image' | 'done') => void
): Promise<string> {
  const isThai = config.language === 'thai';
  const width = config.aspectRatio === '1:1' ? 800 : 1280;
  const height = config.aspectRatio === '1:1' ? 800 : 720;

  const [resolvedTextApiPrompt, resolvedImageApiPrompt] = await Promise.all([
    resolvePromptUrls(config.textApiPrompt || ''),
    resolvePromptUrls(config.imageApiPrompt || '')
  ]);

  const systemPrompt = `You are an expert SEO article writer. Your task is to write a highly optimized, engaging, and informative article.
Language: ${isThai ? 'Thai' : 'English'}
Target Country: ${config.targetCountry === 'thailand' ? 'Thailand' : 'United States (Default)'}
Tone: ${config.tone}
Formality: ${config.formality || 'Automatic'}
Point of View: ${config.pov === 'first' ? 'First Person (I/We)' : config.pov === 'second' ? 'Second Person (You)' : 'Third Person (He/She/It/They)'}
Target Length: Approximately ${config.lengthWords} words — you MUST write at least ${Math.round(config.lengthWords * 0.85)} words. Do NOT stop early. Expand each section thoroughly.
Target Audience: ${config.audience || 'General public'}
${config.copywritingFramework === 'auto' ? `Copywriting Framework: Analyze the "Title" and "Keywords" to determine the best structure for this topic. You MUST choose and apply ONE of these three frameworks:
1. PAS (Problem-Agitate-Solve) - Use if the topic is about solving a specific pain point or problem.
2. AIDA (Attention-Interest-Desire-Action) - Use if the topic is persuasive, product-driven, or conversion-focused.
3. Standard SEO Structure (Introduction, Main Headings, Subheadings, Conclusion) - Use for general informational, educational, or standard guide content.
Apply the chosen framework organically to the article structure.` : config.copywritingFramework ? `Copywriting Framework: Use the ${config.copywritingFramework} framework to structure the content.` : 'Content Structure: Use a standard SEO-optimized informational structure (Introduction, Main Headings, Subheadings, Conclusion).'}

${resolvedTextApiPrompt ? `CUSTOM USER INSTRUCTIONS FOR TEXT GENERATION (IMPORTANT):
${resolvedTextApiPrompt}\n` : ''}

KEYWORD INTEGRATION:
- You MUST naturally weave the "Primary Keyword" and all "Secondary Keywords" into the content.
- Ensure the Primary Keyword appears in the first 100 words and last 100 words.
- Distribute Secondary Keywords throughout the article in relevant sections.

FORMATTING RULES:
- CRITICAL WRITING GUIDELINES: Do NOT hallucinate facts or write nonsensical content. The article must be highly logical, factually correct, and use appropriate, professional terminology. Avoid rambling, repeating points needlessly, or writing "mushy" content.
- CUSTOMER FEEDBACK RULES (MUST FOLLOW STRICTLY):
  - When writing about "Reach Truck": Always clarify the definition that it is an "electric stand-on forklift" (รถโฟล์คลิฟท์ไฟฟ้าประเภทยืนขับ).
  - When discussing VNA (Very Narrow Aisle) for Reach Trucks, state that "some models support" (บางรุ่นรองรับ) it, do NOT say all of them do.
  - When mentioning reach distance or storage space limits, use neutral phrasing (specs vary by model). Do not state absolute numbers.
  - When comparing Stand-on vs Sit-down forklifts (รถโฟล์คลิฟท์ยืนขับ vs นั่งขับ), use neutral terms for weight capacities as they vary by model. Avoid saying "sit-down lifts heavier" as an absolute rule.
  - Fix typos: ALWAYS use "พื้นที่แคบ" (narrow space), NEVER use the typo "พื้นที่แคง".
  - For visibility descriptions on stand-on forklifts, use the phrasing "มีทัศนวิสัยที่ดี" (has good visibility) instead of "มุมมองโดยรอบดีกว่า".

- CRITICAL THAI LANGUAGE INTEGRITY & ANTI-HALLUCINATION:
  - NEVER translate English idioms or technical terms literally. Use natural, professional Thai industry jargon.
  - DO NOT invent new words or use archaic terms (e.g., NEVER use "ไหครบสุด", "สวมงาม", "ทะลักทะลาม", "ยนต์กล", "ถูกขบวนเคียน").
  - PROHIBITED WORDS & REQUIRED REPLACEMENTS (STRICTLY ENFORCED):
    - "Forks" -> Use "งารถ" หรือ "งายก" (NEVER "ส้อมยก" or "ง่าม")
    - "Mast" -> Use "เสายก" หรือ "เสารถโฟล์คลิฟท์" (NEVER "เสากระโชง" or "เสากระโดง")
    - "Overhead Guard" -> Use "หลังคาป้องกัน" (NEVER "ไหครบสุด" or "โครงสร้างไฮเดรลิค")
    - "Blind spot" -> Use "จุดบอด" หรือ "จุดอับสายตา" (NEVER "มุมมองบอด" or "ลมหนาวจัด")
    - "Welding slag" -> Use "สะเก็ดรอยเชื่อม" (NEVER "สะเก็ดรังแก้ว")
    - "Silent Killer" -> Use "ฆาตกรเงียบ" (NEVER "ฆาตกริ่ง")
    - "Brake Caliper/Drum" -> Use "ก้ามปูเบรก" / "ดรัมเบรก" (NEVER "ปั้มจูนเบรก" / "กลองเบรก")
    - "Brake Fluid" -> Use "น้ำมันเบรก" (NEVER "ของไหมเบรก")
    - "Debris/Dirt/Moisture" -> Use "สิ่งสกปรก", "ฝุ่นละออง", "คราบน้ำ" (NEVER "ดีบุก", "มูลฝอย", "น้ำหมัก")
    - "Warped Rotor" -> Use "จานเบรกคด" (NEVER "จานเบรคบุบเสีย")
    - "Comply with law" -> Use "ปฏิบัติตามกฎหมาย" (NEVER "สอดแนมตามกฎหมาย")
    - "Heated mirrors" -> Use "กระจกไล่ฝ้า" (NEVER "กระจกเข็นน้ำฝน")
    - "Insurance" -> Use "การประกันภัย" (NEVER "การประกันตัว")
  - PROOFREADING: Ensure perfect Thai spelling (e.g., "ผู้ขับขี่" not "ผู้ขับขี้", "กะทันหัน" not "กระทันหัน", "พนักพิง" not "พนังพิง", "บิดเบี้ยว" not "บิดเคี้ยว").

${isThai ? `- For Thai articles, use these Thai labels for standard sections: 
    "Key Takeaways" -> "สรุปประเด็นสำคัญ"
    "Conclusion" -> "บทสรุป"
    "Frequently Asked Questions" -> "คำถามที่พบบ่อย"
    "Table of Contents" -> "สารบัญ"` : ''}
${config.formattingBold !== false ? '- Use **bold** for important keywords and emphasis.' : '- Do not bold text.'}
${config.formattingItalics !== false ? '- Use *italics* for minor emphasis.' : '- Do not italicize text.'}
${config.formattingTables !== false ? '- Include Markdown tables where data could be organized.' : '- Do not use tables.'}
${config.formattingQuotes !== false ? '- Use > blockquotes for tips, quotes, or important notes.' : '- Do not use blockquotes.'}
${config.formattingLists !== false ? '- Use lists (bulleted or numbered) where appropriate.' : '- Avoid using lists.'}
- Headings Case: ${config.headingCase === 'lower' ? 'use lower case for all headings' : config.headingCase === 'sentence' ? 'Use Sentence case for all headings' : 'Use Title Case for all Headings'}

STRUCTURE RULES:
${config.outline && config.outline.length > 0 ? `OUTLINE STRUCTURE (MUST FOLLOW EXACTLY):
- ${config.outline.join('\n- ')}\n` : ''}
${config.keyTakeaways !== false ? `- Include a "${isThai ? 'สรุปประเด็นสำคัญ' : 'Key Takeaways'}" bulleted list at the beginning (after the H1 and intro).` : ''}
${config.cta ? `- Add a Call-to-Action (CTA) section with an H3 pointing to this URL: ${config.cta}` : ''}
${config.conclusion !== false ? `- Always end with a "${isThai ? 'บทสรุป' : 'Conclusion'}" section as the last H2.` : ''}
${config.faqs !== false ? `- Add a "${isThai ? 'คำถามที่พบบ่อย' : 'Frequently Asked Questions'}" (FAQs) section after the conclusion.` : ''}

${config.includeSources && config.includeSources.length > 0 ? `REFERENCE / KNOWLEDGE TO INCLUDE:
- ${config.includeSources.join('\n- ')}\n` : ''}
${config.excludeSources && config.excludeSources.length > 0 ? `DO NOT MENTION OR USE THESE SOURCES:
- ${config.excludeSources.join('\n- ')}\n` : ''}
${config.includeLinks && config.includeLinks.length > 0 || config.sitemaps && config.sitemaps.length > 0 ? `INTERNAL / EXTERNAL LINKS TO DISTRIBUTE:
${config.sitemaps && config.sitemaps.length > 0 ? `Sitemaps:\n- ${config.sitemaps.join('\n- ')}\n` : ''}${config.includeLinks && config.includeLinks.length > 0 ? `Links to insert naturally:\n- ${config.includeLinks.join('\n- ')}\n` : ''}
Distribute roughly ${config.linksPerH2 ?? 2} links per H2 section.` : ''}

IMAGE INSTRUCTIONS:
Always use standard Markdown image syntax: ![Alt Text](URL)
${config.coverToggle ? `- MUST include a COVER IMAGE at the very beginning of the article. Use this exact syntax replacing {image-prompt} with a highly descriptive visual prompt in English tailored for an AI image generator (e.g. realistic photo of a forklift in a modern warehouse): ![Cover Image]([GEMINI_IMAGE_PROMPT: {image-prompt} | ${config.aspectRatio}])` : '- Do NOT include a cover image.'}
${config.inlineCount > 0 ? `- MUST insert ${config.inlineCount} INLINE IMAGES distributed naturally across the article (e.g., under H2 headings). Use syntax: ![Related Alt Text]([GEMINI_IMAGE_PROMPT: {image-prompt} | 16:9]). Replace {image-prompt} with a highly descriptive visual prompt in English relevant to that specific section.` : '- Do NOT include inline images.'}
`;

  const userPrompt = `Please write an SEO optimized article.
Primary Keyword: ${keyword}
${title ? `Suggested Title: ${title}` : ''}
${config.secondaryKeywords.length > 0 ? `Secondary Keywords to include: ${config.secondaryKeywords.join(', ')}` : ''}

IMPORTANT: Write at least ${Math.round(config.lengthWords * 0.85)} words. Expand each H2 section thoroughly with detailed explanations, examples, and insights. Do NOT stop early.
Output the article in Markdown format. Use proper heading tags (H1, H2, H3), bullet points where appropriate, and ensure the content flows naturally, provides real value, and is highly optimized. Don't forget to inject the markdown images using the exact custom syntax requested.`;

  try {
    // We are deliberately moving to client-side fetching as requested to support static Netlify deployments.
    // Ensure you configure 'VITE_GEMINI_API_KEY' in your Netlify Environment Variables.
    // Prefer custom OpenAI key if provided, else force the provided one
    const apiKey = (config.customApiKey && config.customApiKey.trim()) || "YOUR_GEMINI_API_KEY";

    if (!apiKey || apiKey.trim() === "YOUR_GEMINI_API_KEY") {
      throw new Error("ไม่มี API Key หรือคุณกำลังใช้ API Key สำรองที่โควต้าหมดแล้ว กรุณาใส่ API Key ของคุณในหน้า ตั้งค่าแคมเปญ (ช่อง API Key สำหรับเนื้อหาข้อความ)");
    }

    // Mask key for debugging
    const maskedKey = apiKey.length > 8 ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "unknown";
    console.log(`[AI API Log] Using API Key: ${maskedKey}`);

    const prompt = `System Instructions: ${systemPrompt}\n\nUser Request: ${userPrompt}`;

    let finalMarkdown = "";
    // เก็บ promise สำหรับรูปภาพที่เริ่ม generate แล้วระหว่าง streaming
    const earlyImagePromises: Map<number, Promise<string>> = new Map();
    const earlyImageMatches: Array<{ prompt: string, ar: string }> = [];
    const imageRegexLive = /\[GEMINI_IMAGE_PROMPT:\s*(.+?)\s*\|\s*(.+?)\]/g;
    const detectedImageKeys = new Set<string>(); // track รูปที่ตรวจจับแล้ว ป้องกัน scan ซ้ำ

    try {
      let requestModel = config.textApiModel;
      if (!config.textApiModel || config.textApiModel === 'auto') {
        if (apiKey.includes('.')) {
          requestModel = 'glm-5';
        } else if (apiKey.startsWith('sk-')) {
          requestModel = 'gpt-4o-mini';
        } else {
          requestModel = 'gemini-1.5-flash';
        }
      }

      // ลอง streaming ก่อน (เร็วกว่า + เห็นข้อความทันที) ถ้าล้มเหลวจะ fallback ไป non-streaming
      try {
        const streamResponse = await fetch('/api/gemini/stream-text', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            model: requestModel,
            contents: prompt,
            config: { baseUrl: config.textApiBaseUrl }
          })
        });

        if (streamResponse.ok && streamResponse.body) {
          const reader = streamResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.error) {
                    throw new Error(typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error));
                  }
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    finalMarkdown += content;
                    // ตรวจจับ image placeholder ทันทีระหว่าง stream (แค่รูปใหม่เท่านั้น)
                    imageRegexLive.lastIndex = 0;
                    let liveMatch;
                    while ((liveMatch = imageRegexLive.exec(finalMarkdown)) !== null) {
                      const imageKey = liveMatch[1].trim() + '|' + liveMatch[2].trim();
                      if (detectedImageKeys.has(imageKey)) continue; // skip รูปที่เคย detect แล้ว
                      detectedImageKeys.add(imageKey);
                      const imgIdx = earlyImageMatches.length;
                      const imgPrompt = liveMatch[1].trim();
                      let ar = liveMatch[2].trim();
                      if (!["1:1", "16:9", "4:3", "3:4", "9:16"].includes(ar)) ar = "1:1";
                      earlyImageMatches.push({ prompt: imgPrompt, ar });
                      // เริ่มสร้างรูปภาพทันที (parallel กับ text stream)
                      earlyImagePromises.set(imgIdx, scheduleImage(() => generateSingleImage(imgIdx, imgPrompt, ar, config, resolvedImageApiPrompt)));
                    }
                    onChunk?.(finalMarkdown, 'text');
                  }
                } catch (e: any) {
                  if (e.message && !e.message.includes('JSON')) throw e;
                }
              }
            }
          }
        } else {
          // Fallback: streaming ล้มเหลว ใช้ non-streaming
          throw new Error('Streaming unavailable, falling back');
        }
      } catch (streamErr: any) {
        if (streamErr.message !== 'Streaming unavailable, falling back') {
          console.warn('[AI] Streaming failed, falling back to non-streaming:', streamErr.message);
        }
        const response = await fetch('/api/gemini/generate', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            model: requestModel,
            contents: prompt,
            config: { baseUrl: config.textApiBaseUrl }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          let errorMessage = errorData?.error || "Failed to generate content";
          if (typeof errorMessage === 'string') {
            try {
              const parsed = JSON.parse(errorMessage);
              if (parsed.error && parsed.error.message) {
                errorMessage = parsed.error.message;
              }
            } catch (e) { }
          }
          throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        }

        const data = await response.json();
        finalMarkdown = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        onChunk?.(finalMarkdown, 'text');
      }

      // Some AI models (like Z.ai) wrap the entire response in a markdown code block
      finalMarkdown = finalMarkdown.replace(/^```(?:markdown|md)?\s*\n/i, '');
      finalMarkdown = finalMarkdown.replace(/\n```\s*$/i, '');
      finalMarkdown = finalMarkdown.trim();
    } catch (restError: any) {
      console.warn("REST API text generation failed:", restError);
      throw restError;
    }

    // Post-processing: แทนที่ image placeholders ด้วยรูปภาพที่สร้างแล้ว
    onChunk?.(finalMarkdown, 'image');
    const imageRegex = /\[GEMINI_IMAGE_PROMPT:\s*(.+?)\s*\|\s*(.+?)\]/g;
    const matches = [...finalMarkdown.matchAll(imageRegex)];

    if (matches.length > 0) {
      const imageGenApiKey = (config.customOpenAiApiKey && config.customOpenAiApiKey.trim()) || "YOUR_OPENAI_API_KEY";

      if (!imageGenApiKey || imageGenApiKey.trim() === "YOUR_OPENAI_API_KEY") {
        console.warn("No valid API Key provided for image generation, skipping image generation.");
        for (let i = 0; i < matches.length; i++) {
          finalMarkdown = finalMarkdown.replace(matches[i][0], `> *(รูปภาพถูกข้าม: ไม่มี API Key สำหรับสร้างรูปภาพ)*\n\n`);
        }
        return finalMarkdown;
      }

      const replacements: string[] = new Array(matches.length);
      const imagePromises = matches.map(async (match, i) => {
        // ถ้าเคณสร้างรูปภาพนี้ไปแล้วระหว่าง streaming ใช้ผลเดิม
        if (earlyImagePromises.has(i)) {
          try {
            replacements[i] = await earlyImagePromises.get(i)!;
            return;
          } catch (e) {
            // ถ้ารูปที่สร้างไปล้มเหลว สร้างใหม่
          }
        }

        const imagePrompt = match[1].trim();
        let ar = match[2].trim();
        if (!["1:1", "16:9", "4:3", "3:4", "9:16"].includes(ar)) ar = "1:1";

        try {
          replacements[i] = await scheduleImage(() => generateSingleImage(i, imagePrompt, ar, config, resolvedImageApiPrompt));
        } catch (err: any) {
          const errorMsg = err?.message || JSON.stringify(err);
          if (errorMsg.includes('429') || errorMsg.includes('quota')) {
            replacements[i] = `> *(รูปภาพถูกข้าม: โควต้าระบบสร้างภาพเต็ม)*`;
          } else {
            replacements[i] = `> *(รูปภาพถูกข้าม: ${errorMsg})*`;
          }
        }
      });

      await Promise.all(imagePromises);

      let i = 0;
      finalMarkdown = finalMarkdown.replace(imageRegex, () => replacements[i++]);
    }

    return finalMarkdown;
  } catch (error: any) {
    console.error("Generate content error:", error);
    const errorMsg = error.message || 'Unknown error';
    if (errorMsg === "Failed to fetch" || errorMsg.includes("Failed to fetch")) {
      throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ (Failed to fetch) - กรุณาลองกดสร้างใหม่อีกครั้ง");
    }
    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota') || errorMsg.includes('exceeded')) {
      throw new Error(`โควต้า API เต็ม (Rate Limit 429) กรุณาไปที่หน้าตั้งค่าและตรวจสอบ API Key ของคุณ หรือรอสักครู่แล้วลองใหม่`);
    }
    throw new Error(errorMsg);
  }
}


