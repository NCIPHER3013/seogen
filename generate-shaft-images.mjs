import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const seedreamKey = process.env.SEEDREAM_API_KEY;

if (!seedreamKey) {
  console.error('❌ SEEDREAM_API_KEY not found in .env.local');
  process.exit(1);
}

const prompts = [
  'A realistic close-up photo of a forklift undercarriage showing the drive axle and steering joints, industrial maintenance setting, professional photography, clean lighting',
  'A technician inspecting a forklift axle and joints for wear and cracks, close-up shot, industrial maintenance, detailed mechanical components',
  'A mechanic applying grease lubrication to a forklift steering joint, close-up, maintenance procedure, realistic photo',
  'A close-up shot of a newly serviced forklift axle housing and mechanical joints, clean and well-maintained components, realistic photo'
];

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved image to ${destPath}`);
}

async function generateImages() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const filename = `shaft_image_${i}.jpg`;
    const destPath = path.join(publicDir, filename);
    
    console.log(`Generating image ${i + 1}/${prompts.length}...`);
    try {
      const url = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
      const body = {
        model: 'seedream-4-5-251128',
        prompt: prompt,
        n: 1,
        size: '2560x1440',
        watermark: false
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${seedreamKey}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Error: ${text}`);
      }
      
      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`No image URL returned: ${JSON.stringify(data)}`);
      }
      
      console.log(`Downloading image from ${imageUrl}...`);
      await downloadImage(imageUrl, destPath);
      
      // Delay to avoid hitting rate limits
      if (i < prompts.length - 1) {
        console.log('Waiting 2 seconds before next request...');
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to generate image ${i + 1}:`, error.message);
    }
  }
}

generateImages();
