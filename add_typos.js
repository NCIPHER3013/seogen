
const fs = require('fs');
let content = fs.readFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', 'utf8');

const additionalTypos = {
  'ผลัพธ์': 'ผลลัพธ์',
  'หัวดูดึง': 'หัวดูด',
  'ฟุ้ติดลงไป': 'รัดติดลงไป',
  'ดูดสุญากาศ': 'ดูดสูญญากาศ',
  'ธุรกิจำเป็น': 'ธุรกิจจำเป็น',
  'ก้อน้ำแข็ง': 'ก้อนน้ำแข็ง',
  'ฟ่างอากาศ': 'ฟองอากาศ',
  'หรือุณหภูมิ': 'หรืออุณหภูมิ',
  'อุณหูมิห้อง': 'อุณหภูมิห้อง',
  'ปากามาร์คเกอร์': 'ปากกามาร์คเกอร์',
  'แน่นิ่ง': 'แนบสนิท'
};

const newChainedReplace = Object.keys(additionalTypos).map(k => '.replace(/' + k + '/g, \'' + additionalTypos[k] + '\')').join('');

// Update mdToHtml
content = content.replace(/(\.replace\(\/ตรวจับ\/g, 'ตรวจจับ'\))/g, '\' + newChainedReplace);

// Update load logic dictionary
const newDictEntries = Object.keys(additionalTypos).map(k => '            \'' + k + '\': \'' + additionalTypos[k] + '\',').join('\n');
content = content.replace(/(\'ตรวจับ\': \'ตรวจจับ\')/g, '\,\n' + newDictEntries);

fs.writeFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', content);
console.log('Added new typos to ArticleEditor.tsx');

