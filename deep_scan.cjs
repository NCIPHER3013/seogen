const fs = require('fs');

const text = fs.readFileSync('d:/seogentest/text.txt.txt', 'utf8');

const segmenter = new Intl.Segmenter('th-TH', { granularity: 'word' });
const words = [...segmenter.segment(text)].map(s => s.segment).filter(w => w.trim().length > 0 && /[\u0E00-\u0E7F]/.test(w));

// Build frequency map
const counts = {};
words.forEach(w => {
    counts[w] = (counts[w] || 0) + 1;
});

// A small naive dictionary of prefixes/suffixes to check
const suspicious = Object.keys(counts).filter(w => {
    if (w.includes('ะกอบ')) return true; // ประกอบ
    if (w.includes('ะบบ')) return true; // ระบบ
    if (w.includes('ะดับ')) return true; // ระดับ
    if (w.includes('ะกอบ')) return true; // ประกอบ
    if (w.includes('ะโยชน์')) return true; // ประโยชน์
    if (w.includes('ะสิทธิภาพ')) return true; // ประสิทธิภาพ
    if (w.includes('ะมาณ')) return true; // ประมาณ
    if (w.includes('ะเทศ')) return true; // ประเทศ
    if (w.includes('ะกัน')) return true; // ประกัน
    
    // Missing space before 'และ' or 'ที่' (though less critical)
    if (w.length > 15 && !w.includes('เครื่อง')) return true; // unusually long word
    
    if (w.includes('จาการ')) return true;
    if (w.includes('มบูรณ์แบ')) return true;
    if (w.includes('ั่วซึม')) return true;
    if (w.includes('อุตสาหกรรมัก')) return true;
    if (w.includes('เสียหายัง')) return true;
    if (w.includes('คือาการ')) return true;
    if (w.includes('ไหล้น')) return true;
    if (w.includes('ทิชู่')) return true;
    if (w.includes('ผลัพธ์')) return true;
    if (w.includes('การะบาย')) return true;
    if (w.includes('หลัการ')) return true;

    // specific to vacuum 
    if (w.includes('สูญกาศ')) return true;
    if (w.includes('สูญญากาส')) return true;
    if (w.includes('พลาสติกก')) return true;
    if (w.includes('ออกซิเจ')) return true; // ออกซิเจน
    if (w.includes('แบคทีเรี')) return true; // แบคทีเรีย
    
    // common typing mistakes
    if (w.includes('งๆ')) return true; // missing space or character before ๆ
    if (w.match(/^[ะาิีึืุูเแโใไ]/)) return true; // starts with vowel
    if (w.includes('ำำ')) return true;

    return false;
});

const uniqueSuspects = [...new Set(suspicious)];
console.log('Suspicious words found by Intl.Segmenter:');
console.log(uniqueSuspects);

// Let's also grab a window of words around each suspect so we can see the context
uniqueSuspects.forEach(suspect => {
    if (suspect.length <= 1) return; // skip single weird chars
    const idx = text.indexOf(suspect);
    if (idx !== -1) {
        console.log(`Context for "${suspect}":`, text.substring(Math.max(0, idx - 20), Math.min(text.length, idx + suspect.length + 20)).replace(/\n/g, ' '));
    }
});
