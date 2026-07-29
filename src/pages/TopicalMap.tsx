import React, { useState, useEffect, useRef } from 'react';
import { Map, Loader2, Sparkles, Building, Target, CheckCircle2, FileText, ChevronDown, List, Plus, Save, Trash2, FolderOpen } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { supabase } from '@/lib/supabase';
import { fetchProjects, saveProject, deleteProject, TopicalMapProject } from '@/lib/topical_maps';

// System prompt text based on user requirements
const TOPICAL_MAP_SYSTEM_PROMPT = `คุณคือ Business Consult และผู้ช่วยทำงาน SEO Expert เชิงลึก คุณทำหน้าที่ ค้นหาข้อมูล ใช้ข้อมูลจากประเทศไทยและพฤติกรรมของคนไทยเป็นหลัก ทำการวิเคราะห์ข้อมูล ช่วงวางแผน และนำเสนอข้อมูลอย่างตรงประเด็นกระชับ เคารพเวลาผู้ฟัง 

ฉันได้ให้ข้อมูลตัวแปรของธุรกิจเรียบร้อยแล้ว 
โปรดดำเนินการตาม Flow ต่อไปนี้ตั้งแต่ Step 2 ถึง Step 8 รวดเดียวจบให้ครบถ้วน ห้ามรอการตอบสนอง

*** ข้อบังคับสำคัญในการพิมพ์ (Formatting Rules) ***
1. คุณต้องใส่ Tag ขั้นกลางระหว่างแต่ละ Step เสมอ เพื่อให้ระบบนำไปแสดงผลแยกหน้าต่างได้ โดยให้พิมพ์ \`---STEP_2---\`, \`---STEP_3---\`, \`---STEP_4---\`, \`---STEP_5---\`, \`---STEP_6---\`, \`---STEP_7---\`, \`---STEP_8---\`, และ \`---MINDMAP---\` ก่อนที่จะเริ่มเนื้อหาของส่วนนั้นๆ ห้ามลืมเด็ดขาด!
2. ในส่วนของเนื้อหา ให้เว้นบรรทัด (Line break) ทุกครั้งที่ขึ้นหัวข้อย่อย และใช้ Bullet points เสมอ เพื่อให้อ่านง่าย สบายตา
3. เน้นตัวหนา (Bold) ที่หัวข้อสำคัญเสมอ

Flow:
---STEP_2---
(นำเสนอในรูปแบบ bullet point ที่อ่านง่ายกระชับ)
   1. ประเภทธุรกิจ
   2. บริการหลัก
   3. กลุ่มเป้าหมาย
   4. จุดเด่น
   5. ความท้าทาย
   6. Business Analysis
   7. Target Audience
   8. Competitor Analysis
   9. ให้คำแนะนำเพิ่มเติมในฐานะที่คุณเป็นปรึกษาธุรกิจ

---STEP_3---
ทำ Keyword Research (รวม 100 Keywords จัดเรียงอย่างเป็นธรรมชาติ)
- High-Volume Keywords (Top 5 Only)
- Informational Keywords
- Navigational Keywords
- Commercial Keywords
- Transactional Keywords

---STEP_4---
List Related Keywords and Intent Grouping (รวม 100 Keywords)
แต่ละกลุ่มต้องมีจำนวนที่ไม่เท่ากันให้จัดเรียงอย่างเป็นธรรมชาติ

---STEP_5---
Intent Grouping
Step 5.1 : Informational Keywords 
Step 5.2 : Navigational Keywords 
Step 5.3 : Commercial Keywords 
Step 5.4 : Transactional Keywords 

---STEP_6---
Title for Parent & Child Structure (รวม 100 บทความ นำเสนอทีละ Cluster)
present_format: 
- Title [Keywords of content]
- Title [Keywords of content]
(ต้องใช้เครื่องหมาย - นำหน้าและขึ้นบรรทัดใหม่ทุกหัวข้อ ห้ามพิมพ์ติดกันเด็ดขาด)

---STEP_7---
Content Brief for Parent/Pillar Content
ข้อมูลพื้นฐาน (Main Topic, Target Keywords ฯลฯ), โครงสร้างเนื้อหา (Heading, Internal Links), SEO Guidelines

---STEP_8---
Content Brief for Child Content
คล้ายกับ Step 7 แต่เน้นที่ Child Content และการเชื่อมโยงกับ Parent

---MINDMAP---
สุดท้าย ให้วาดแผนผัง Topical Map สรุปคีย์เวิร์ดทั้งหมด โดยใช้โค้ด Mermaid ประเภท Mind Map (mindmap) 
ให้แกนกลางคือ Pillar Page ของธุรกิจ และ**ต้องแตกแขนงออกเป็น 6 กิ่งหลัก** ตามกลุ่มด้านล่างนี้ และในแต่ละกิ่งหลักให้แตกใบย่อยเป็นคีย์เวิร์ดหรือหัวข้อย่อย **กิ่งละ 5-6 อัน** เป็นอย่างน้อย เพื่อความสมบูรณ์ของแผนผัง
**สำคัญมากสำหรับ Mind Map:** 
1. ข้อความในแต่ละกล่อง (Node) ต้องสั้นกระชับที่สุด (ไม่เกิน 3-5 คำ) ห้ามใส่ประโยคยาวๆ เพราะแผนผังจะล้นและอ่านไม่ออก
2. **ห้ามใช้คำซ้ำกันเด็ดขาด (No Duplicate Words)** ในทุกๆ กล่องย่อย (แม้จะอยู่คนละกิ่ง) ให้ใช้คำที่แตกต่างกันเล็กน้อย เพื่อป้องกันระบบวาดกราฟิก Error (เช่น ถ้ารีวิวแล้ว ห้ามมีคำว่ารีวิวซ้ำในกิ่งอื่น)

ตัวอย่างโค้ด Mermaid Mindmap ที่ต้องการ (ต้องมี 6 กิ่งหลักตามนี้):
\`\`\`mermaid
mindmap
  root((ชื่อแบรนด์))
    Informational((Informational))
      ความรู้เรื่อง 1
      ความรู้เรื่อง 2
      ... (เพิ่มให้ถึง 5-6 อัน)
    Commercial((Commercial))
      รีวิว 1
      เปรียบเทียบ 1
      ...
    Navigational((Navigational))
      ค้นหาแบรนด์ 1
      ติดต่อ 1
      ...
    Transactional((Transactional))
      โปรโมชั่น 1
      จองคิว 1
      ...
    Local_SEO((Local_SEO))
      บริการในพื้นที่ 1
      บริการใกล้ฉัน 1
      ...
    FAQ_Support((FAQ_Support))
      คำถามที่พบบ่อย 1
      ปัญหาการใช้งาน 1
      ...
\`\`\`
(คำเตือน: แกนกลางและกิ่งหลัก ต้องใช้คำสั้นๆ เช่นชื่อแบรนด์คำเดียว หรือคำภาษาอังกฤษคำเดียวตามตัวอย่าง ห้ามมีคำสร้อย เพื่อป้องกันข้อความล้นกรอบ และต้องมีกิ่งย่อยเยอะๆ ให้ดูอลังการและครอบคลุม)
`;

const MermaidChart = ({ chart }: { chart: string }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chartRef.current && chart) {
      const renderChart = async () => {
        try {
          // Initialize mermaid once
          mermaid.initialize({ 
            startOnLoad: false, 
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: '"Prompt", "Kanit", sans-serif',
            mindmap: {
              maxNodeWidth: 350,
              padding: 15
            }
          });

          // Suppress harmless Mermaid SVG path warnings to keep console clean
          const originalConsoleError = console.error;
          console.error = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('Expected moveto path command')) {
              return; // Ignore this specific Mermaid dagre-d3 bug
            }
            originalConsoleError.apply(console, args);
          };
          
          // Sanitize mindmap to prevent duplicate node crashes and path errors
          const sanitizeMermaid = (code: string) => {
            let counter = 0;
            return code.split('\n').map(line => {
              const match = line.match(/^(\s+)(.+)$/);
              if (match) {
                const spaces = match[1];
                let text = match[2].trim();
                // If it's a plain text node without shape brackets, assign a unique ID
                // Use [ ] (square) instead of ( ) to prevent Mermaid's rounded rectangle path calculation bug
                if (!text.match(/[()[\]{}]/) && text !== 'mindmap' && !text.startsWith('root')) {
                  counter++;
                  const safeText = text.replace(/["'()[\]{}]/g, "");
                  return `${spaces}node${counter}[${safeText}]`;
                }
              }
              return line;
            }).join('\n');
          };
          
          const safeChart = sanitizeMermaid(chart);
          const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(id, safeChart);
          if (chartRef.current) {
            // override the svg inline style that restricts max-width
            let customizedSvg = svg.replace(/max-width: [^;]+;/, 'max-width: none; height: auto; min-width: 1000px;');
            // Replace undefined paths with empty paths to prevent browser DOM warnings
            customizedSvg = customizedSvg.replace(/d="[^"]*undefined[^"]*"/g, 'd="M0,0"');
            chartRef.current.innerHTML = customizedSvg;
          }
        } catch (error: any) {
          const errStr = String(error);
          // Do not spam console during streaming (incomplete strings cause Parse error)
          if (!errStr.includes('Parse error') && !errStr.includes('UnknownDiagramError')) {
            console.error("Mermaid render error:", error);
          }
          
          if (chartRef.current) {
            if (errStr.includes('Parse error') || errStr.includes('UnknownDiagramError')) {
              chartRef.current.innerHTML = `<div class="flex flex-col items-center justify-center text-slate-400 p-8 min-h-[300px]"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div><p>กำลังร่างแผนผัง (Streaming Data)...</p></div>`;
            } else {
              chartRef.current.innerHTML = `<pre class="text-red-500 text-sm overflow-auto p-4">Error rendering diagram</pre><pre class="text-xs p-4">${chart}</pre>`;
            }
          }
        }
      };
      renderChart();
    }
  }, [chart]);
  
  return (
    <div className="w-full overflow-x-auto my-4 bg-slate-50/50 rounded-2xl border border-slate-100 p-2 md:p-8 custom-scrollbar">
      <div 
        className="flex justify-center items-center min-w-[800px] min-h-[400px]" 
        ref={chartRef} 
      />
    </div>
  );
};

export default function TopicalMap() {
  const [projects, setProjects] = useState<TopicalMapProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');
  
  const [formData, setFormData] = useState({
    projectName: '',
    keyword: '',
    brand: '',
    businessType: '',
    mainProduct: '',
    targetAudience: '',
    additionalInfo: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState('');
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Load Projects on Mount
  useEffect(() => {
    loadProjects();
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
  }, []);

  const loadProjects = async () => {
    const data = await fetchProjects();
    setProjects(data);
  };

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    if (id === 'new') {
      setFormData({
        projectName: '',
        keyword: '',
        brand: '',
        businessType: '',
        mainProduct: '',
        targetAudience: '',
        additionalInfo: ''
      });
      setResult('');
    } else {
      const p = projects.find(x => x.id === id);
      if (p) {
        setFormData({
          projectName: p.project_name || '',
          keyword: p.keyword || '',
          brand: p.brand || '',
          businessType: p.business_type || '',
          mainProduct: p.main_product || '',
          targetAudience: p.target_audience || '',
          additionalInfo: p.additional_info || ''
        });
        setResult(p.result_text || '');
      }
    }
    setError('');
  };

  const handleSaveProject = async (currentResult: string = result, overrideProjectId?: string) => {
    if (!formData.projectName.trim()) {
      setError('กรุณาตั้งชื่อ Project ก่อนบันทึก');
      return null;
    }
    setIsSaving(true);
    setError('');
    const payload = {
      project_name: formData.projectName,
      keyword: formData.keyword,
      brand: formData.brand,
      business_type: formData.businessType,
      main_product: formData.mainProduct,
      target_audience: formData.targetAudience,
      additional_info: formData.additionalInfo,
      result_text: currentResult
    };

    const targetId = overrideProjectId !== undefined ? overrideProjectId : selectedProjectId;
    const saved = await saveProject(payload, targetId === 'new' ? undefined : targetId);
    if (saved) {
      await loadProjects();
      setSelectedProjectId(saved.id);
    } else {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
    setIsSaving(false);
    return saved?.id;
  };

  const handleDeleteProject = async () => {
    if (selectedProjectId === 'new') return;
    if (confirm('คุณต้องการลบโปรเจกต์นี้ใช่หรือไม่?')) {
      const success = await deleteProject(selectedProjectId);
      if (success) {
        await loadProjects();
        handleProjectSelect('new');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!formData.projectName.trim() || !formData.keyword.trim() || !formData.brand.trim() || !formData.businessType.trim()) {
      setError('กรุณากรอกชื่อ Project, คีย์เวิร์ด, ชื่อแบรนด์ และประเภทธุรกิจ ให้ครบถ้วน');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError('');
    setIsGenerating(true);
    setResult('');
    
    let currentProjectId = selectedProjectId;
    // Auto-save initial state
    if (currentProjectId === 'new') {
      const newId = await handleSaveProject('', 'new');
      if (newId) currentProjectId = newId;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const userData = `ข้อมูลตัวแปร:
1. คีย์เวิร์ดเป้าหมายหลัก: ${formData.keyword}
2. ชื่อแบรนด์/บริษัท: ${formData.brand}
3. ประเภทธุรกิจ: ${formData.businessType}
4. สินค้า/บริการหลัก: ${formData.mainProduct || 'ไม่ระบุ'}
5. กลุ่มลูกค้าเป้าหมาย: ${formData.targetAudience || 'วิเคราะห์ให้เหมาะสมกับธุรกิจ'}
6. ข้อมูลเพิ่มเติม: ${formData.additionalInfo || 'ไม่มี'}`;

      const prompt = `${TOPICAL_MAP_SYSTEM_PROMPT}\n\n${userData}\n\nเริ่มทำงานได้เลย ห้ามลืมใส่ Tag ---STEP_2--- ฯลฯ เด็ดขาด`;

      // Scroll down slightly to show the result area starting to load
      setTimeout(() => {
        window.scrollTo({ top: document.getElementById('result-section')?.offsetTop ? document.getElementById('result-section')!.offsetTop - 100 : 500, behavior: 'smooth' });
      }, 100);

      const response = await fetch('/api/proxy/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ API');
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let finalResult = '';

        let buffer = '';
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n\n')) >= 0) {
              const line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 2);
              
              if (line.startsWith('data: ')) {
                 const dataStr = line.replace('data: ', '');
                 if (dataStr === '[DONE]') {
                   done = true;
                   break;
                 }
                 try {
                   const parsed = JSON.parse(dataStr);
                   if (parsed.choices?.[0]?.delta?.content) {
                     finalResult += parsed.choices[0].delta.content;
                     setResult(finalResult);
                   } else if (parsed.error) {
                     setError(parsed.error);
                   }
                 } catch (e) {}
              }
            }
          }
        }
        
        // Auto-save when done
        if (finalResult && !error) {
           await handleSaveProject(finalResult, currentProjectId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to parse the streamed text into sections
  const parseSteps = (text: string) => {
    const steps: { id: string, title: string, content: string }[] = [];
    const parts = text.split(/---(STEP_[2-8]|MINDMAP)---/);
    
    const titleMap: Record<string, string> = {
      'STEP_2': 'Step 2: วิเคราะห์ธุรกิจ (Business Analysis)',
      'STEP_3': 'Step 3: Keyword Research',
      'STEP_4': 'Step 4: Related Keywords & Grouping',
      'STEP_5': 'Step 5: Intent Grouping Details',
      'STEP_6': 'Step 6: Parent & Child Titles',
      'STEP_7': 'Step 7: Content Brief (Pillar/Parent)',
      'STEP_8': 'Step 8: Content Brief (Child)',
      'MINDMAP': 'Topical Map (Visual Mind Map)'
    };
    
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i];
      const content = parts[i + 1] || '';
      steps.push({ 
        id: key, 
        title: titleMap[key] || key, 
        content: content.trim() 
      });
    }
    return steps;
  };

  const parsedSections = parseSteps(result);
  const textSteps = parsedSections.filter(s => s.id !== 'MINDMAP');
  const mindmapStep = parsedSections.find(s => s.id === 'MINDMAP');

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const isMermaid = match && match[1] === 'mermaid';
      
      if (isMermaid) {
        return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
      }
      return (
        <code className={`${className} bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-md font-mono text-sm border border-slate-200`} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl pt-28 pb-32 px-4 md:px-6 relative z-10 flex flex-col gap-6">
        
        {/* Header Title & Project Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Map className="w-8 h-8 text-emerald-600" />
              Topical Map Generator
            </h1>
            <p className="text-slate-500 mt-1">
              วิเคราะห์และสร้างแผนผังเนื้อหา (Topical Map) ระดับมืออาชีพ พร้อมจัดการโปรเจกต์
            </p>
          </div>
          
          <div className="flex flex-col gap-2 min-w-[320px]">
             <Label className="text-slate-600 font-semibold flex items-center gap-1.5">
               <FolderOpen className="w-4 h-4 text-emerald-600" /> จัดการโปรเจกต์ลูกค้า
             </Label>
             <div className="flex gap-2">
               <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
                 <SelectTrigger className="flex-1 bg-white border-2 border-slate-200 hover:border-emerald-400 focus:ring-emerald-500 transition-colors h-11 rounded-xl shadow-sm font-medium">
                   <div className="flex items-center gap-2 truncate">
                     {selectedProjectId === 'new' ? (
                       <><Plus className="w-4 h-4 text-emerald-600" /> สร้างโปรเจกต์ใหม่</>
                     ) : (
                       <><FolderOpen className="w-4 h-4 text-slate-500" /> {projects.find(p => p.id === selectedProjectId)?.project_name || 'Loading...'}</>
                     )}
                   </div>
                 </SelectTrigger>
                 <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                   <SelectItem value="new" className="text-emerald-600 font-bold focus:bg-emerald-50 focus:text-emerald-700 py-3 cursor-pointer">
                     <div className="flex items-center gap-2">
                       <Plus className="w-5 h-5 bg-emerald-100 rounded-full p-0.5" /> 
                       เริ่มสร้างโปรเจกต์ใหม่ (New Project)
                     </div>
                   </SelectItem>
                   {projects.length > 0 && <div className="h-px bg-slate-100 my-1 mx-2" />}
                   {projects.map(p => (
                     <SelectItem key={p.id} value={p.id} className="py-2.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-50">
                       <div className="flex flex-col">
                         <span>{p.project_name}</span>
                         <span className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[200px]">
                           {p.keyword} • {p.brand}
                         </span>
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               {selectedProjectId !== 'new' && (
                 <Button variant="outline" size="icon" onClick={handleDeleteProject} title="ลบโปรเจกต์" className="shrink-0 h-11 w-11 rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                   <Trash2 className="w-5 h-5" />
                 </Button>
               )}
             </div>
          </div>
        </div>

        {/* Section 1: Top Form */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <Building className="w-5 h-5 text-slate-500" />
              ข้อมูลตั้งต้น (Project Variables)
            </CardTitle>
            <CardDescription>
              ระบุชื่อโปรเจกต์และข้อมูลธุรกิจ เพื่อให้ AI วิเคราะห์แผนผังเนื้อหา
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="space-y-2 lg:col-span-3 pb-4 border-b border-slate-100">
                <Label className="font-bold text-slate-800 text-base">ชื่อโปรเจกต์ (Project Name) <span className="text-red-500">*</span></Label>
                <Input 
                  name="projectName"
                  placeholder="เช่น: แผน SEO ลูกค้าบริษัท ABC" 
                  value={formData.projectName}
                  onChange={handleChange}
                  disabled={isGenerating}
                  className="bg-white border-emerald-200 focus-visible:ring-emerald-500 text-lg py-6"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">คีย์เวิร์ดเป้าหมายหลัก <span className="text-red-500">*</span></Label>
                <Input 
                  name="keyword"
                  placeholder="เช่น: ขายบ้าน, กาแฟลดน้ำหนัก" 
                  value={formData.keyword}
                  onChange={handleChange}
                  disabled={isGenerating}
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">ชื่อแบรนด์/บริษัท <span className="text-red-500">*</span></Label>
                <Input 
                  name="brand"
                  placeholder="เช่น: Apple, Nike, บริษัท ABC" 
                  value={formData.brand}
                  onChange={handleChange}
                  disabled={isGenerating}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">ประเภทธุรกิจ <span className="text-red-500">*</span></Label>
                <Input 
                  name="businessType"
                  placeholder="เช่น: ร้านกาแฟ, คลินิกทำฟัน, ขายเสื้อผ้า" 
                  value={formData.businessType}
                  onChange={handleChange}
                  disabled={isGenerating}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">สินค้า/บริการหลัก</Label>
                <Input 
                  name="mainProduct"
                  placeholder="เช่น: อเมริกาโน่, จัดฟันใส, เสื้อยืด" 
                  value={formData.mainProduct}
                  onChange={handleChange}
                  disabled={isGenerating}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label className="font-semibold text-slate-700">กลุ่มลูกค้าเป้าหมาย</Label>
                <Input 
                  name="targetAudience"
                  placeholder="ปล่อยว่างเพื่อให้ AI คิดให้ หรือระบุเอง (เช่น: นักศึกษา, วัยทำงาน)" 
                  value={formData.targetAudience}
                  onChange={handleChange}
                  disabled={isGenerating}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label className="font-semibold text-slate-700">ข้อมูลเพิ่มเติม (ถ้ามี)</Label>
                <Textarea 
                  name="additionalInfo"
                  placeholder="จุดเด่น, พื้นที่บริการ หรือโปรโมชั่น..." 
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  disabled={isGenerating}
                  className="min-h-[80px] bg-white resize-y"
                />
              </div>

            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50/80 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                 {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 sm:px-6 flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              variant="outline"
              onClick={() => handleSaveProject()} 
              disabled={isGenerating || isSaving || !formData.projectName}
              className="w-full sm:w-auto h-11 border-slate-300 font-medium"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              บันทึกข้อมูล
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !formData.projectName || !formData.keyword || !formData.brand || !formData.businessType}
              className="w-full sm:w-auto min-w-[200px] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base shadow-sm transition-transform active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  กำลังดำเนินการวิเคราะห์...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Topical Map
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Section 2: Interactive Result UI */}
        <div id="result-section">
          {(!result && !isGenerating) ? (
            <Card className="border-slate-200 border-dashed shadow-none bg-transparent">
              <CardContent className="p-12 flex flex-col items-center justify-center text-slate-400">
                <div className="bg-white p-6 rounded-full mb-4 shadow-sm border border-slate-100">
                  <List className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">ยังไม่มีข้อมูลที่จะแสดงผล</h3>
                <p className="text-center max-w-md text-sm text-slate-500">
                  กรอกข้อมูลธุรกิจด้านบนและกด "Generate" เพื่อให้ระบบเริ่มสร้างโครงสร้าง Topical Map
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              
              {/* Box 1: Text Steps (Accordion) */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                      <FileText className="w-5 h-5 text-slate-500" />
                      รายละเอียดการวิเคราะห์ (Analysis Data)
                    </CardTitle>
                    <CardDescription>
                      คลิกที่หัวข้อเพื่อเปิด/ปิดดูรายละเอียดแต่ละขั้นตอน
                    </CardDescription>
                  </div>
                  {isGenerating ? (
                    <div className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-sm font-semibold flex items-center gap-2 border border-blue-200 shadow-sm w-fit">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังประมวลผล...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-fit">
                      <div className="px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 text-sm font-semibold flex items-center gap-2 border border-emerald-200 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        วิเคราะห์สำเร็จ (บันทึกอัตโนมัติแล้ว)
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion multiple className="w-full">
                    {textSteps.map((step) => (
                      <AccordionItem value={step.id} key={step.id} className="border-b border-slate-100 px-6">
                        <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-emerald-600 transition-colors py-5">
                          {step.title}
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="prose prose-slate max-w-none prose-emerald prose-p:leading-relaxed prose-li:my-1 text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {step.content || "*กำลังโหลดข้อมูล...*"}
                            </ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    {isGenerating && textSteps.length === 0 && (
                      <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
                        <p>กำลังรวบรวมและวิเคราะห์ข้อมูลธุรกิจของคุณ...</p>
                      </div>
                    )}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Box 2: Dedicated Mind Map */}
              {(mindmapStep || isGenerating) && (
                <Card className="border-slate-700 shadow-sm overflow-hidden bg-slate-800" ref={mermaidRef}>
                  <CardHeader className="bg-slate-800 border-b border-slate-700 pb-4 rounded-t-xl">
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                      <Map className="w-5 h-5 text-emerald-400" />
                      Visual SEO Topical Map
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      แผนผังโครงสร้างเนื้อหาฉบับสมบูรณ์ แยกตาม Intent Keyword
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 bg-slate-50">
                    {mindmapStep?.content ? (
                      <div className="p-6 md:p-10 w-full overflow-x-auto flex justify-center">
                        <div className="prose prose-slate max-w-none w-full">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents as any}
                          >
                            {mindmapStep.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-[#F8FAFC]">
                        <Loader2 className="w-12 h-12 animate-spin text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-700">กำลังวาดแผนผัง Mind Map...</h3>
                        <p className="text-sm mt-2 max-w-md">
                          ระบบกำลังประมวลผลข้อมูลที่ได้มาประกอบเป็นแผนผังความคิด (Visual Mind Map) 
                          โปรดรอจนกว่าการประมวลผลขั้นตอนสุดท้ายจะเสร็จสิ้น
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        
      </div>
    </AppLayout>
  );
}
