
const fs = require('fs');

let contentEditor = fs.readFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', 'utf8');

const effectStart = contentEditor.indexOf('  useEffect(() => {\n    if (article) {\n      let newTitle');
if (effectStart !== -1) {
    const effectEnd = contentEditor.indexOf('  }, [article?.title, article?.content]);\n') + '  }, [article?.title, article?.content]);\n'.length;
    contentEditor = contentEditor.substring(0, effectStart) + contentEditor.substring(effectEnd);
}

contentEditor = contentEditor.replace(/  \/\/ Brute-force auto-correction before rendering\n  markdown = markdown\.replace\(.*?\);\n  /g, '');
contentEditor = contentEditor.replace(/  \/\/ Brute-force auto-correction before saving\n  md = md\.replace\(.*?\);\n/g, '');

fs.writeFileSync('d:/seogentest/src/pages/ArticleEditor.tsx', contentEditor);
console.log('ArticleEditor reverted!');

let contentLayout = fs.readFileSync('d:/seogentest/src/components/AppLayout.tsx', 'utf8');
const layoutEffectStart = contentLayout.indexOf('  useEffect(() => {\n    try {\n      const keys');
if (layoutEffectStart !== -1) {
    const layoutEffectEnd = contentLayout.indexOf('    } catch (e) {}\n  }, []);\n') + '    } catch (e) {}\n  }, []);\n'.length;
    contentLayout = contentLayout.substring(0, layoutEffectStart) + contentLayout.substring(layoutEffectEnd);
    fs.writeFileSync('d:/seogentest/src/components/AppLayout.tsx', contentLayout);
    console.log('AppLayout reverted!');
}

