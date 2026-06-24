import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const zaiKey = process.env.ZAI_API_KEY;

async function testModel(modelName) {
  console.log(`\nTesting Z.ai model: ${modelName}...`);
  const start = Date.now();
  try {
    const url = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
    const body = {
      model: modelName,
      messages: [{ 
        role: 'user', 
        content: 'เขียนบทความสั้นๆ เกี่ยวกับประโยชน์ของโช้คอัพรถโฟล์คลิฟท์ ความยาวประมาณ 200 คำ' 
      }]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zaiKey}`
      },
      body: JSON.stringify(body)
    });
    
    const text = await response.text();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Model: ${modelName} - Status: ${response.status} - Time: ${duration}s`);
    if (response.ok) {
      const data = JSON.parse(text);
      const content = data.choices?.[0]?.message?.content || '';
      console.log('Word count:', content.split(/\s+/).length);
      console.log('Preview:', content.substring(0, 200) + '...');
    } else {
      console.error('Error:', text);
    }
  } catch (error) {
    console.error('Failed:', error);
  }
}

async function run() {
  if (!zaiKey) {
    console.error('No key found');
    return;
  }
  await testModel('glm-4.5');
  await testModel('glm-4.7');
  await testModel('glm-5-turbo');
  await testModel('glm-5.2');
}

run();
