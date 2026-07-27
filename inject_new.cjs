const fs = require('fs');
let text = fs.readFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', 'utf8');

const regex = /(markdown = markdown\.replace[\s\S]*?;\n)/;
const match = text.match(regex);
if (match) {
    let replacedLine = match[1].trim();
    // Remove the trailing semicolon
    replacedLine = replacedLine.replace(/;$/, '');
    
    // Add new rules
    replacedLine += `.replace(/เมื่อากาศ/g, 'เมื่ออากาศ')`;
    replacedLine += `.replace(/การู้ว่า/g, 'การรู้ว่า')`;
    replacedLine += `.replace(/ตามา/g, 'ตามมา')`;
    replacedLine += `.replace(/สมบูรณ์แบ/g, 'สมบูรณ์แบบ')`;
    replacedLine += `.replace(/เครื่องมือุปกรณ์/g, 'เครื่องมืออุปกรณ์')`;
    replacedLine += `.replace(/ไม่ได้การสูบ/g, 'ไม่ได้ การสูบ')`;
    
    replacedLine += ';\n';
    text = text.replace(regex, '  ' + replacedLine);
    fs.writeFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', text, 'utf8');
    console.log('Successfully injected new typos into ArticleEditor.tsx');
} else {
    console.log('Regex did not match.');
}
