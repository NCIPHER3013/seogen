const fs = require('fs');

const wrongWords = [
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
    [/โรงานอุตสาหกรรม/g, 'โรงงานอุตสาหกรรม']
];

let text = fs.readFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', 'utf8');

const regex = /(markdown = markdown\.replace[\s\S]*?;\n)/;
const match = text.match(regex);
if (match) {
    let replacedLine = match[1].trim();
    replacedLine = replacedLine.replace(/;$/, '');
    
    // Check and add each rule if not already present
    for (const [pattern, replacement] of wrongWords) {
        const pStr = pattern.toString();
        if (!replacedLine.includes(pStr)) {
            replacedLine += `\n      .replace(${pStr}, '${replacement}')`;
        }
    }
    
    replacedLine += ';\n';
    text = text.replace(regex, '  ' + replacedLine);
    fs.writeFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', text, 'utf8');
    console.log('Successfully injected final typo rules into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
