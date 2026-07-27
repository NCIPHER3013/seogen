const fs = require('fs');

const text = fs.readFileSync('d:/seogentest/text.txt.txt', 'utf8');

// A list of common prefix/suffix and fragments to find typos
const suspectFragments = [
    'ะดับ', 'จาการ', 'มบูรณ์แบ', 'ั่วซึม', 'นวัตกรรมา', '้านอาหาร',
    'ลงทุด', 'ซื้อุป', 'เสียหายัง', 'อุตสาหกรรมัก', 'โรงาน', 'คือาการ',
    'ไหล้น', 'ในที่สุป', 'กดัน', 'ทิชู่', 'ผลัพธ์', 'คือุป', 'การะบาย', 
    'เหลืออก', 'หลัการ', 'ชานไก่', 'แบใดี', 'หลัการ', 'สิงแวดล้อม', 
    'สีกลิ่น', 'ปัจุบัน', 'มิลิเมตร', 'หลัการ', 'การกลั้น', 'ออกซิเจนั้น',
    'แบาง', 'การะบุ', 'คุ้มค่าการลงทุด', 'ผลัพธ์', 'อุตสาหกรรมักจะ', 'ความเสียหายัง',
    'สมบูรณ์แบ', 'ธุรกิจัดเลี้ยง', 'คือาการ', 'เกิดจาการ', 'แห้งสนิ', 'ไหล้น', 
    'บีบรั', 'วงการ้านอาหาร', 'นวัตกรรมา', 'รักษาคุณภาพสินค้'
];

const words = text.match(/[\u0E00-\u0E7F]+/g) || [];
const uniqueWords = [...new Set(words)];

const found = uniqueWords.filter(w => 
    suspectFragments.some(f => w.includes(f)) ||
    w.length > 25 // Very long words might be missing spaces
);

console.log('Found suspects:', found);

// Also look for specific known ones that were not single words
const phrases = [
    'สีกลิ่น',
    'ปัจุบัน',
    'มิลิเมตร',
    'การกลั้น'
];

phrases.forEach(p => {
    if (text.includes(p)) console.log('Found phrase:', p);
});
