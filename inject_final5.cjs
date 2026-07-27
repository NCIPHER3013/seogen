const fs = require('fs');

const wrongWords = [
    [/ชานไก่การเก็บรักษา/g, 'ชิ้นไก่ การเก็บรักษา'],
    [/หลัการ/g, 'หลักการ'],
    [/ปัจัย/g, 'ปัจจัย'],
    [/สีกลิ่น/g, 'สี กลิ่น'],
    [/ปัจุบัน/g, 'ปัจจุบัน'],
    [/มิลิเมตร/g, 'มิลลิเมตร'],
    [/การกลั้น \(Sealing\)/g, 'การปิดผนึก (Sealing)'],
    [/การกลั้น/g, 'การปิดผนึก'],
    [/จากนั้นำ/g, 'จากนั้นนำ'],
    [/วางไข่ในตู้แช่แข็ง/g, 'วางไว้ในตู้แช่แข็ง'],
    [/เป็น้ำแข็ง/g, 'เป็นน้ำแข็ง'],
    [/คุณภาพของานซีล/g, 'คุณภาพของงานซีล']
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
    console.log('Successfully injected final typo rules 5 into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
