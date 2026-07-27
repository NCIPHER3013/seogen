const fs = require('fs');

const text = fs.readFileSync('d:/seogentest/text.txt.txt', 'utf8');

const typoDict = [
    [/นวัตกรรมาใช้/g, 'นวัตกรรมมาใช้'],
    [/ร้านอาหาระดับ/g, 'ร้านอาหารระดับ'],
    [/การั่วซึม/g, 'การรั่วซึม'],
    [/ออกซิเจนั้น/g, 'ออกซิเจนนั้น'],
    [/วงการ้านอาหาร/g, 'วงการร้านอาหาร'],
    [/บีบรัด้วย/g, 'บีบรัดด้วย'],
    [/ไหล้นออกมา/g, 'ไหลล้นออกมา'],
    [/แห้งสนิทุกครั้ง/g, 'แห้งสนิททุกครั้ง'],
    [/เกิดจาการ/g, 'เกิดจากการ'],
    [/คือาการ/g, 'คืออาการ'],
    [/สมบูรณ์แบ/g, 'สมบูรณ์แบบ'],
    [/ธุรกิจัดเลี้ยง/g, 'ธุรกิจจัดเลี้ยง'],
    [/ความเสียหายัง/g, 'ความเสียหายยัง'],
    [/ในที่สุป/g, 'ในที่สุด'],
    [/อุตสาหกรรมักจะ/g, 'อุตสาหกรรมมักจะ'],
    [/โรงานอุตสาหกรรม/g, 'โรงงานอุตสาหกรรม'],
    [/ช่องแช่อย่างไรก็ตาม/g, 'ช่องแช่ อย่างไรก็ตาม'],
    [/รักษาคุณภาพสินค้\b/g, 'รักษาคุณภาพสินค้า'],
    [/กระดูกคมาก/g, 'กระดูกคมมาก'],
    [/คุ้มค่าการลงทุด/g, 'คุ้มค่าการลงทุน'],
    [/การปฏิบัติตามาตรฐาน/g, 'การปฏิบัติตามมาตรฐาน'],
    [/แรงกดันสูง/g, 'แรงกดดันสูง'],
    [/ถุงแบางทั่วไป/g, 'ถุงบางทั่วไป'],
    [/มีการะบุความหนา/g, 'มีการระบุความหนา'],
    [/ซื้อุปกรณ์/g, 'ซื้ออุปกรณ์']
];

// List common words that Thai language often has typos in, let's just dump the text and search for suspicious patterns.
// But writing a regex for every typo is hard. 
// I will output the text to see if there are any other typos, or I will use a known list of typos to check against this text.

// I'll run a quick script to find long words or common typos from the existing list that we might have missed.
// Actually, let's just log any suspicious words.
const words = text.match(/[\u0E00-\u0E7F]+/g);
if (words) {
    const wordCounts = {};
    words.forEach(w => {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
    const uniqueWords = Object.keys(wordCounts);
    
    // Simple heuristic: look for words that end abruptly or have missing letters that usually exist.
    const suspicious = uniqueWords.filter(w => 
        w.includes('ะดับ') && w !== 'ระดับ' ||
        w.includes('จาการ') && w !== 'จากการ' ||
        w.includes('มบูรณ์แบ') && w !== 'สมบูรณ์แบบ' ||
        w.includes('ั่วซึม') && w !== 'รั่วซึม' ||
        w.includes('นวัตกรรมา') && w !== 'นวัตกรรมมา' ||
        w.includes('้านอาหาร') && w !== 'ร้านอาหาร' ||
        w.includes('กดัน') && w !== 'กดดัน' ||
        w.includes('ลงทุด') ||
        w.includes('ปฏฺิ') ||
        w.includes('ซื้อุป') ||
        w.includes('เสียหายัง') ||
        w.includes('อุตสาหกรรมัก') ||
        w.includes('โรงาน') ||
        w.includes('คือาการ') ||
        w.includes('ไหล้น') ||
        w.includes('บีบรั') && w !== 'บีบรัด' ||
        w.includes('แห้งสนิ') && w !== 'แห้งสนิท' ||
        w.includes('ในที่สุป')
    );
    console.log("Suspicious words:", suspicious);
}
