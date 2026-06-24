import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const zaiKey = process.env.ZAI_API_KEY;

async function listModels() {
  if (!zaiKey) {
    console.error('No ZAI_API_KEY found');
    return;
  }
  try {
    const url = 'https://api.z.ai/api/coding/paas/v4/models';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${zaiKey}`
      }
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data.data) {
        console.log('Models:');
        data.data.forEach(m => console.log(`- ${m.id}`));
      } else {
        console.log(data);
      }
    } catch (e) {
      console.log('Non-JSON response:', text);
    }
  } catch (err) {
    console.error('Failed:', err);
  }
}

listModels();
