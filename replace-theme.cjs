const fs = require('fs');
let code = fs.readFileSync('src/pages/CampaignSetup.tsx', 'utf-8');

// Brand
code = code.replaceAll('z.ai<span className="text-purple-500 font-light ml-2">SEO Studio</span>', 'Seo<span className="text-emerald-500 font-light ml-1">Cipher</span>');
code = code.replaceAll('z.ai SEO Studio', 'SeoCipher');
code = code.replaceAll('z.ai seo', 'SeoCipher');
code = code.replaceAll('z.ai', 'SeoCipher');

// Purple -> Emerald
code = code.replaceAll('purple-700', 'emerald-700');
code = code.replaceAll('purple-600', 'emerald-600');
code = code.replaceAll('purple-500', 'emerald-500');
code = code.replaceAll('purple-400', 'emerald-400');
code = code.replaceAll('purple-300', 'emerald-400');
code = code.replaceAll('purple-200', 'emerald-800');
code = code.replaceAll('purple-100', 'emerald-900/50');
code = code.replaceAll('purple-50', 'emerald-950/50');

// Blue -> Emerald/Lime
code = code.replaceAll('blue-700', 'lime-700');
code = code.replaceAll('blue-600', 'emerald-500');
code = code.replaceAll('blue-500', 'emerald-400');
code = code.replaceAll('blue-50', 'emerald-900/30');

// General dark mode classes
code = code.replaceAll('bg-[#fafafa]', 'bg-slate-950');
code = code.replaceAll('bg-white', 'bg-slate-900');
code = code.replaceAll('bg-slate-50', 'bg-slate-950/50');
code = code.replaceAll('border-slate-200', 'border-slate-800');
code = code.replaceAll('border-slate-100', 'border-slate-800');
code = code.replaceAll('border-dashed border-slate-300', 'border-dashed border-slate-700');
code = code.replaceAll('text-slate-900', 'text-slate-200');
code = code.replaceAll('text-slate-800', 'text-white');
code = code.replaceAll('text-slate-700', 'text-slate-300');
code = code.replaceAll('text-slate-600', 'text-slate-400');
code = code.replaceAll('shadow-sm', 'shadow-lg shadow-black/20');
code = code.replaceAll('hover:bg-slate-50', 'hover:bg-slate-800');
code = code.replaceAll('hover:bg-slate-100', 'hover:bg-slate-800');
code = code.replaceAll('bg-slate-100', 'bg-slate-800');

fs.writeFileSync('src/pages/CampaignSetup.tsx', code);
console.log('Updated CampaignSetup.tsx');
