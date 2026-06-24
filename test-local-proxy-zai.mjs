import fetch from 'node-fetch';

async function testLocalProxy() {
  console.log('Testing local proxy server on http://localhost:3000/api/gemini/generate...');
  try {
    const response = await fetch('http://localhost:3000/api/gemini/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': '645139e1a8fc4ed18665660a82c7412d.tWOLRtwBoUBsr8dJ' 
      },
      body: JSON.stringify({ 
        model: 'glm-5-turbo', 
        contents: 'Say "Proxy works!"',
        config: { baseUrl: 'https://api.z.ai/api/coding/paas/v4' }
      })
    });
    
    console.log('Response Status:', response.status);
    const text = await response.text();
    console.log('Response Body:', text);
  } catch (error) {
    console.error('Local proxy test failed:', error.message || error);
  }
}

testLocalProxy();
