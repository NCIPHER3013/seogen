import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const zaiKey = process.env.ZAI_API_KEY;
const seedreamKey = process.env.SEEDREAM_API_KEY;

async function testText() {
  console.log('--- Testing Z.ai Text Generation ---');
  if (!zaiKey) {
    console.error('❌ ZAI_API_KEY not found in .env.local');
    return;
  }
  
  try {
    const url = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
    const body = {
      model: 'glm-5-turbo',
      messages: [{ role: 'user', content: 'Say "Text generation API is working!" in Thai' }]
    };
    
    console.log(`Sending request to ${url} with model glm-5-turbo...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zaiKey}`
      },
      body: JSON.stringify(body)
    });
    
    const text = await response.text();
    console.log(`Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ Z.ai Text API Successful Response:');
      console.log(data.choices?.[0]?.message?.content || data);
    } else {
      console.error(`❌ Z.ai Text API Error: ${text}`);
    }
  } catch (error) {
    console.error('❌ Z.ai Text API Request Failed:', error);
  }
}

async function testImage() {
  console.log('\n--- Testing ByteDance-Seedream Image Generation ---');
  if (!seedreamKey) {
    console.error('❌ SEEDREAM_API_KEY not found in .env.local');
    return;
  }
  
  try {
    const url = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
    const body = {
      model: 'seedream-4-5-251128',
      prompt: 'A sleek modern forklift inside a futuristic warehouse, 3d render',
      n: 1,
      size: '2560x1440',
      watermark: false
    };
    
    console.log(`Sending request to ${url} with model seedream-4-5-251128...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seedreamKey}`
      },
      body: JSON.stringify(body)
    });
    
    const text = await response.text();
    console.log(`Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ ByteDance-Seedream Image API Successful Response:');
      if (data.data && data.data[0]) {
        if (data.data[0].url) {
          console.log(`Image URL: ${data.data[0].url}`);
        } else if (data.data[0].b64_json) {
          console.log('Image Data (Base64 length):', data.data[0].b64_json.length);
        } else {
          console.log('No URL or Base64 returned, entire object:', data.data[0]);
        }
      } else {
        console.log('Unexpected response format:', data);
      }
    } else {
      console.error(`❌ ByteDance-Seedream Image API Error: ${text}`);
    }
  } catch (error) {
    console.error('❌ ByteDance-Seedream Image API Request Failed:', error);
  }
}

async function runTests() {
  await testText();
  await testImage();
}

runTests();
