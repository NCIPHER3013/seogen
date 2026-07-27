const fs = require('fs');

const wrongWords = [
    [/ยุคปัจุบัน/g, 'ยุคปัจจุบัน'],
    [/หรือาหาร/g, 'หรืออาหาร'],
    [/ปัจัย/g, 'ปัจจัย'],
    [/ตั้งแต่ต้นั้น/g, 'ตั้งแต่ต้นนั้น'],
    [/หลัการ/g, 'หลักการ'],
    [/ถูกำจัดออก/g, 'ถูกกำจัดออก'],
    [/จาการ/g, 'จากการ'],
    [/ถูกสั่งาน/g, 'ถูกสั่งงาน'],
    [/รอยับ/g, 'รอยยับ'],
    [/ตะขล่วัด/g, 'แถบลวด'],
    [/หรือไม่นอกจากนี้/g, 'หรือไม่ นอกจากนี้'],
    [/หรือไม่หาก/g, 'หรือไม่ หาก'],
    [/แรงดัน้ำ/g, 'แรงดันน้ำ'],
    [/แบไม่ทำลาย/g, 'แบบไม่ทำลาย'],
    [/ทดสอบไว้หาก/g, 'ทดสอบไว้ หาก'],
    [/ทันทีซึ่งช่วย/g, 'ทันที ซึ่งช่วย'],
    [/การู้ถึง/g, 'การรู้ถึง'],
    [/เครื่องดูดแบ/g, 'เครื่องดูดแบบ'],
    [/พลาสติก็มีผล/g, 'พลาสติกก็มีผล'],
    [/ดันทะลักทะลาบริเวณ/g, 'ดันทะลักทะลายบริเวณ'],
    [/ความัน/g, 'ความมัน'],
    [/ก่อให้เกิดรอรั่ว/g, 'ก่อให้เกิดรอยรั่ว'],
    [/อย่างเป็นระบ\b/g, 'อย่างเป็นระบบ'],
    [/ต้น้ำ/g, 'ต้นน้ำ'],
    [/เสร็จึงฟู/g, 'เสร็จจึงฟู'],
    [/เกิดการั่วซึม/g, 'เกิดการรั่วซึม'],
    [/ได้ซึ่งอาจเกิด/g, 'ได้ ซึ่งอาจเกิด'],
    [/ได้จึงควร/g, 'ได้ จึงควร'],
    [/เพื่องานี้/g, 'เพื่องานนี้'],
    [/เริ่มีอาการ/g, 'เริ่มมีอาการ']
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
    console.log('Successfully injected latest typo rules into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
