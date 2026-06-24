import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.ZAI_API_KEY;
const endpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions';

// Simulate a real article generation prompt (similar to what the app sends)
const longPrompt = `System Instructions: You are an expert SEO article writer. Write a highly optimized, engaging article.
Language: Thai
Tone: Professional
Point of View: Third Person
Target Length: Approximately 1500 words
Topic: เพลาและข้อต่อรถโฟล์คลิฟท์ควรตรวจสอบอย่างไร

Write the article in Markdown format with proper H1, H2, H3 headings. Include key takeaways, conclusion, and FAQs sections.`;

console.log('Testing article generation with long prompt...');
console.log(`Endpoint: ${endpoint}`);
console.log(`Prompt length: ${longPrompt.length} chars`);

const start = Date.now();
try {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'glm-4.5',
      messages: [{ role: 'user', content: longPrompt }]
    }),
    signal: AbortSignal.timeout(120000)
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  
  if (res.ok) {
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`\n✅ SUCCESS in ${elapsed}s`);
    console.log(`Response length: ${content.length} chars`);
    console.log(`First 300 chars:\n${content.substring(0, 300)}...`);
  } else {
    const data = await res.json();
    console.log(`\n❌ HTTP ${res.status} in ${elapsed}s`);
    console.log('Error:', JSON.stringify(data).substring(0, 300));
  }
} catch (err) {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n❌ FAILED in ${elapsed}s`);
  console.log(`${err.name}: ${err.message}`);
}
