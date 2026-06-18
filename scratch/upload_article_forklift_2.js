import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const images = [
  'forklift_gmp_cover_unbranded_1780834150518.png',
  'forklift_gmp_inline1_unbranded_1780834162267.png',
  'forklift_gmp_inline2_unbranded_1780834177265.png',
  'forklift_gmp_inline3_unbranded_1780834189303.png'
];
const baseDir = 'C:/Users/User/.gemini/antigravity-ide/brain/6cba0f64-43b4-4bd6-8acd-b37db148fbc7';

async function execute() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkfyyidrrjenvwdxljze.supabase.co';
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'process.env.SUPABASE_SECRET_KEY || ""';
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
  
  const publicUrls = [];
  for (const imgName of images) {
    const fullPath = path.join(baseDir, imgName);
    const fileBuffer = fs.readFileSync(fullPath);
    
    console.log('Uploading ' + imgName + '...');
    const { data, error } = await supabase.storage
      .from('articles')
      .upload(`seo-campaign/${imgName}`, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (error) {
      console.error('Failed to upload', error);
      return;
    }
    
    const { data: publicData } = supabase.storage.from('articles').getPublicUrl(`seo-campaign/${imgName}`);
    publicUrls.push(publicData.publicUrl);
  }
  
  console.log('Uploaded URLs:', publicUrls);

  const articleContent = `# มาตรฐาน GMP รถโฟล์คลิฟท์ในโรงงานอาหาร กับความปลอดภัยขั้นสูงสุด

ในอุตสาหกรรมการผลิตอาหาร ความปลอดภัยและสุขอนามัยถือเป็นหัวใจสำคัญสูงสุดที่ไม่สามารถประนีประนอมได้ การควบคุมคุณภาพไม่ได้จำกัดอยู่เพียงแค่วัตถุดิบหรือกระบวนการผลิตเท่านั้น แต่ยังครอบคลุมถึงเครื่องจักรและอุปกรณ์ที่ใช้ในการเคลื่อนย้ายสินค้าภายในโรงงานด้วย การปฏิบัติตามมาตรฐาน GMP (Good Manufacturing Practice) สำหรับอุปกรณ์ขนถ่ายวัสดุ จึงเป็นข้อกำหนดที่ผู้ประกอบการต้องให้ความสำคัญ

การเลือกใช้ **รถโฟล์คลิฟท์โรงงานอาหาร** ที่สอดคล้องกับมาตรฐาน GMP จะช่วยป้องกันความเสี่ยงจากการปนเปื้อนข้าม (Cross-contamination) รักษาสภาพแวดล้อมให้สะอาด และสร้างความมั่นใจให้กับผู้บริโภค บทความนี้จะเจาะลึกถึงรายละเอียดของ **GMP รถโฟล์คลิฟท์ในโรงงานอาหาร** ว่ามีข้อกำหนดและแนวทางปฏิบัติอย่างไรบ้าง

![รถโฟล์คลิฟท์ไฟฟ้าสีขาวสะอาดปฏิบัติงานในโรงงานอาหารที่ปราศจากฝุ่นและสิ่งเจือปน](${publicUrls[0]})

---

## สรุปประเด็นสำคัญ (Key Takeaways)
*   **ปราศจากการปล่อยมลพิษ:** รถโฟล์คลิฟท์ที่ได้มาตรฐาน GMP ต้องเป็นระบบไฟฟ้า (Electric Forklift) เพื่อหลีกเลี่ยงการปล่อยไอเสียและควันดำที่อาจปนเปื้อนสู่อาหาร
*   **ยางไร้รอย (Non-Marking Tires):** ต้องใช้ยางชนิดพิเศษที่ไม่ทิ้งคราบฝุ่นดำหรือรอยขูดขีดบนพื้นโรงงาน (Epoxy) เพื่อป้องกันการสะสมของเชื้อแบคทีเรีย
*   **วัสดุทำความสะอาดง่าย:** โครงสร้างของรถต้องออกแบบมาให้ล้างทำความสะอาดได้ง่าย ไม่เป็นแหล่งสะสมของความชื้นหรือเศษอาหาร
*   **น้ำมันหล่อลื่น Food Grade:** ชิ้นส่วนที่ต้องใช้สารหล่อลื่นหรือจาระบี ต้องใช้วัสดุประเภท Food Grade ที่ปลอดภัยต่อการสัมผัสอาหารทางอ้อม

---

## ข้อกำหนดทางวิศวกรรมของ GMP รถโฟล์คลิฟท์ในโรงงานอาหาร

การนำรถโฟล์คลิฟท์เข้ามาใช้งานในพื้นที่ผลิตหรือจัดเก็บอาหาร ไม่สามารถใช้รถโฟล์คลิฟท์เครื่องยนต์สันดาปทั่วไปได้ ข้อกำหนดเบื้องต้นตามมาตรฐาน GMP มีรายละเอียดเชิงลึกทางวิศวกรรมดังต่อไปนี้:

### 1. ระบบขับเคลื่อนที่สะอาด (Clean Power Source)
มาตรฐาน GMP กำหนดให้สภาพแวดล้อมการผลิตต้องไม่มีมลภาวะทางอากาศ ดังนั้น รถโฟล์คลิฟท์ที่เหมาะสมที่สุดคือ **รถโฟล์คลิฟท์ไฟฟ้า (Electric Forklift)** ซึ่งทำงานด้วยระบบแบตเตอรี่ (เช่น Lithium-ion หรือ Lead-Acid แบบปิดสนิท) ระบบนี้ไม่เพียงแต่ไร้ควันไอเสีย แต่ยังทำงานด้วยเสียงที่เบา ช่วยลดมลภาวะทางเสียงในพื้นที่ปฏิบัติงานได้อีกด้วย

### 2. ล้อและยางชนิดพิเศษ (Non-Marking Tires)
พื้นของโรงงานอาหารส่วนใหญ่มักเคลือบด้วยสารอีพ็อกซี่ (Epoxy) หรือโพลียูรีเทน (PU) เพื่อให้ง่ายต่อการทำความสะอาดและฆ่าเชื้อ หากใช้ยางรถโฟล์คลิฟท์สีดำทั่วไป จะทำให้เกิดรอยเสียดสี ทิ้งคราบฝุ่นดำ และอาจกลายเป็นจุดสะสมของเชื้อราและแบคทีเรียได้ การใช้ยางแบบ **Non-Marking Tires** ซึ่งมักเป็นสีขาวหรือสีเทาอ่อน จึงเป็นข้อบังคับที่สำคัญมากสำหรับ **รถโฟล์คลิฟท์โรงงานอาหาร**

![ซูมล้อรถโฟล์คลิฟท์ชนิด Non-marking สีขาวบนพื้นโรงงานอาหารแบบอีพ็อกซี่ที่สะอาดสะอ้าน](${publicUrls[1]})

---

## การป้องกันการปนเปื้อนจากตัวรถ (Contamination Prevention)

นอกเหนือจากระบบขับเคลื่อนและยางแล้ว องค์ประกอบอื่นๆ ของตัวรถก็มีส่วนสำคัญในการรักษามาตรฐาน **GMP รถโฟล์คลิฟท์ในโรงงานอาหาร** ไม่แพ้กัน

### การใช้น้ำมันและสารหล่อลื่น Food Grade
ชิ้นส่วนที่มีการเคลื่อนที่ เช่น โซ่ยก (Lifting Chain) กระบอกไฮดรอลิก หรือลูกปืน จำเป็นต้องได้รับการหล่อลื่นอยู่เสมอ ในโรงงานอาหาร สารหล่อลื่นเหล่านี้ต้องได้รับการรับรองมาตรฐาน NSF (National Sanitation Foundation) ในระดับ H1 (Food Grade Lubricants) ซึ่งหมายความว่า หากเกิดเหตุสุดวิสัยที่สารหล่อลื่นหยดหรือสัมผัสกับอาหารทางอ้อม จะไม่ก่อให้เกิดอันตรายต่อผู้บริโภค

![รถโฟล์คลิฟท์ไฟฟ้าสะอาดหมดจดกำลังยกถังสแตนเลสบรรจุอาหารในสภาพแวดล้อมที่ควบคุมเชื้อ](${publicUrls[2]})

### การออกแบบเพื่อสุขอนามัย (Hygienic Design)
ตัวรถควรมีการออกแบบที่ลดซอกมุม (Crevices) เพื่อไม่ให้เป็นจุดสะสมของฝุ่นผงและสิ่งสกปรก ห้องโดยสารหรือพื้นที่ควบคุมของพนักงานขับรถต้องทำความสะอาดได้ง่าย และวัสดุหุ้มเบาะควรเป็นแบบกันน้ำและทนทานต่อน้ำยาฆ่าเชื้อ

![แผงควบคุมและพวงมาลัยของรถโฟล์คลิฟท์ที่ออกแบบมาให้เช็ดทำความสะอาดและฆ่าเชื้อได้ง่าย](${publicUrls[3]})

---

## บทสรุป

การทำความเข้าใจและปฏิบัติตามมาตรฐาน **GMP รถโฟล์คลิฟท์ในโรงงานอาหาร** อย่างเคร่งครัด ไม่ได้เป็นเพียงแค่การทำตามกฎหมายหรือข้อบังคับเท่านั้น แต่ยังเป็นการลงทุนเพื่อปกป้องภาพลักษณ์ของแบรนด์ และสร้างความปลอดภัยให้กับผู้บริโภคขั้นสูงสุด

การพิจารณาเลือกซื้อหรือเช่า **รถโฟล์คลิฟท์โรงงานอาหาร** ผู้ประกอบการจึงต้องตรวจสอบสเปกของรถอย่างละเอียด ตั้งแต่ระบบไฟฟ้า ชนิดของยาง ไปจนถึงสารหล่อลื่น เพื่อให้มั่นใจว่าอุปกรณ์เหล่านั้นจะไม่กลายเป็นความเสี่ยงในการปนเปื้อน และสามารถทำงานร่วมกับระบบการผลิตอาหารได้อย่างมีประสิทธิภาพและปลอดภัยอย่างแท้จริง

---

## คำถามที่พบบ่อย (FAQs)

### Q: รถโฟล์คลิฟท์ระบบแก๊ส (LPG) สามารถใช้ในโรงงานอาหารได้หรือไม่?
**A:** โดยทั่วไปไม่แนะนำให้ใช้ในพื้นที่ที่มีอาหารเปิดเปลือย (Open Food Processing Area) เนื่องจากแม้ว่าแก๊ส LPG จะเผาไหม้ได้สะอาดกว่าดีเซล แต่ก็ยังมีการปล่อยก๊าซคาร์บอนมอนอกไซด์และไอน้ำ ซึ่งอาจส่งผลต่อคุณภาพอากาศและผลิตภัณฑ์ หากจำเป็นต้องใช้ มักจะจำกัดให้อยู่ในโซนคลังสินค้า (Warehouse) ที่ปิดหีบห่อเรียบร้อยแล้วและมีการระบายอากาศที่ดีเท่านั้น

### Q: ทำไมยาง Non-Marking ถึงมีอายุการใช้งานสั้นกว่ายางสีดำทั่วไป?
**A:** ยาง Non-Marking มีการนำสารคาร์บอนแบล็ค (Carbon Black) ที่ช่วยเพิ่มความทนทานออกไป และใช้ส่วนผสมของซิลิกา (Silica) หรือสารเติมแต่งสีขาวแทน ทำให้เนื้อยางมีความต้านทานต่อการสึกหรอน้อยกว่ายางสีดำเล็กน้อย แต่แลกมาด้วยความสะอาดและสุขอนามัยที่ได้มาตรฐาน GMP ซึ่งคุ้มค่ากว่าความเสียหายหากเกิดการปนเปื้อน

### Q: ความถี่ในการทำความสะอาดรถโฟล์คลิฟท์ในโรงงานอาหารควรเป็นอย่างไร?
**A:** แนะนำให้ทำความสะอาดแบบเบื้องต้น (Dry Cleaning หรือการเช็ดฆ่าเชื้อจุดสัมผัส) ในทุกๆ สิ้นกะการทำงาน (Shift) และทำการล้างใหญ่ (Deep Cleaning) ตามแผนที่กำหนดไว้ (เช่น สัปดาห์ละครั้ง) โดยต้องใช้พื้นที่ล้างที่แยกออกจากการผลิตอย่างชัดเจน เพื่อป้องกันน้ำเสียกระเด็นไปโดนผลิตภัณฑ์`;

  const newArticle = {
    id: 'forklift-gmp-article2-' + Date.now(),
    title: 'มาตรฐาน GMP รถโฟล์คลิฟท์ในโรงงานอาหาร',
    keyword: 'GMP รถโฟล์คลิฟท์ในโรงงานอาหาร',
    language: 'thai',
    content: articleContent,
    images: [
      { url: publicUrls[0], type: 'cover', alt: 'รถโฟล์คลิฟท์สำหรับโรงงานอาหารมาตรฐาน GMP' },
      { url: publicUrls[1], type: 'inline1', alt: 'ยาง Non-marking สีขาวสำหรับรถโฟล์คลิฟท์' },
      { url: publicUrls[2], type: 'inline2', alt: 'การยกวัสดุสแตนเลสด้วยรถโฟล์คลิฟท์ไฟฟ้า' },
      { url: publicUrls[3], type: 'inline3', alt: 'แผงควบคุมรถโฟล์คลิฟท์ที่ทำความสะอาดง่าย' }
    ],
    date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
  };

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Inject Article 2: GMP Forklift</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f4f4f5; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
    h1 { color: #18181b; font-size: 1.5rem; margin-bottom: 1rem; }
    #status { color: #2563eb; font-weight: bold; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>กำลังสร้างบทความที่ 2: มาตรฐาน GMP รถโฟล์คลิฟท์...</h1>
    <div id="status">กำลังดำเนินการ...</div>
  </div>
  <script>
    const newArticle = ${JSON.stringify(newArticle)};
    
    try {
      const saved = localStorage.getItem('campaign_config_generatedArticles');
      let current = [];
      if (saved) {
        current = JSON.parse(saved);
      }
      
      // ลบบทความเดิมที่มี keyword ตรงกัน (ถ้ามี)
      const filtered = current.filter(a => a.keyword !== 'GMP รถโฟล์คลิฟท์ในโรงงานอาหาร');
      
      // นำบทความใหม่ใส่เข้าไปที่ตำแหน่งแรก
      filtered.unshift(newArticle);
      localStorage.setItem('campaign_config_generatedArticles', JSON.stringify(filtered));
      
      document.getElementById('status').innerText = '✅ บทความที่ 2 (GMP รถโฟล์คลิฟท์) ถูกสร้างและนำเข้าระบบเรียบร้อยแล้ว!';
      document.getElementById('status').style.color = '#16a34a';
    } catch (err) {
      document.getElementById('status').innerText = '❌ Error: ' + err.message;
      document.getElementById('status').style.color = '#dc2626';
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('d:/SEOGEN/public/seed-article-forklift-2.html', htmlContent);
  console.log('Successfully wrote seed-article-forklift-2.html');
}

execute();
