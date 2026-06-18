// Replace all of App default export with CampaignSetup default export + wrap Link to dashboard logic
import React, { useState, useEffect } from 'react';
import { 
  Settings2, FileText, Image as ImageIcon, Link as LinkIcon, 
  ChevronRight, LayoutDashboard, Feather, Sparkles, Plus, X, User,
  Search, PlaySquare, Video, SearchCode, Edit3, Trash2, Loader2,
  AlignLeft, List, BookOpen, Type, Layout, ExternalLink,
  MoreHorizontal, Eye, Send, Newspaper, Youtube, Menu
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { generateArticle } from '@/services/ai';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import localforage from 'localforage';

const MarkdownImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');

  useEffect(() => {
    if (src && src.startsWith('gemini_img_')) {
      localforage.getItem(src).then((dataUri) => {
        if (dataUri) {
          setImgSrc(dataUri as string);
        }
      }).catch(console.error);
    }
  }, [src]);

  return (
    <img 
      {...props} 
      src={imgSrc} 
      alt={alt}
      style={{ maxWidth: '100%', borderRadius: '8px', margin: '1rem auto', display: 'block' }} 
      referrerPolicy="no-referrer" 
    />
  );
};

// Data models
interface ArticleConfig {
  language: string;
  tone: string;
  pov: string;
  lengthWords: number;
  audience: string;
  secondaryKeywords: string[];
  copywritingFramework?: string;
  coverToggle: boolean;
  inlineCount: number;
  aspectRatio: string;
  outline?: string[];
  sitemaps?: string[];
  includeLinks?: string[];
  includeSources?: string[];
  excludeSources?: string[];
  targetCountry?: string;
  formality?: string;
  formattingBold?: boolean;
  formattingItalics?: boolean;
  formattingTables?: boolean;
  formattingQuotes?: boolean;
  formattingLists?: boolean;
  headingCase?: string;
  knowledgeMode?: string;
  cta?: string;
  keyTakeaways?: boolean;
  conclusion?: boolean;
  faqs?: boolean;
  articleSize?: string;
  linksPerH2?: number;
  autoExternalLinks?: boolean;
  autoYoutube?: boolean;
  imageProvider?: string;
  imageStyle?: string;
  customApiKey?: string;
  customOpenAiApiKey?: string;
  textApiPrompt?: string;
  imageApiPrompt?: string;
}

interface ArticleItem {
  id: string;
  keyword: string;
  title: string;
  language: string; // The active language (either from template or overridden)
  overrides?: Partial<ArticleConfig>; // Custom settings just for this row
}

const TagInput = ({ tags, setTags, placeholder }: { tags: string[], setTags: (t: string[]) => void, placeholder: string }) => {
  const [input, setInput] = useState('');
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim()) && tags.length < 5) {
        setTags([...tags, input.trim()]);
        setInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
        {tags.map(tag => (
          <Badge key={tag} className="bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors shadow-none">
            {tag}
            <X className="w-3 h-3 cursor-pointer text-purple-400 hover:text-purple-600" onClick={() => removeTag(tag)} />
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length >= 5 ? "จำกัดคีย์เวิร์ดสูงสุดแล้ว" : placeholder}
        disabled={tags.length >= 5}
        className="bg-white border-slate-200 rounded-lg focus-visible:ring-purple-500"
      />
      <p className="text-xs text-slate-500 mt-1 text-right">{tags.length} / 5 keywords</p>
    </div>
  );
};

const InlineTagInput = ({ tags, setTags, placeholder, buttonText, maxTags = 10 }: { tags: string[], setTags: (t: string[]) => void, placeholder: string, buttonText?: string, maxTags?: number }) => {
  const [input, setInput] = useState('');
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim()) && tags.length < maxTags) {
        setTags([...tags, input.trim()]);
        setInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <div key={`${tag}-${idx}`} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg group hover:bg-slate-200 transition-colors">
            <span className="text-sm text-slate-700 font-medium">{tag}</span>
            <X className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeTag(tag)} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length >= maxTags ? "Reached limit" : placeholder}
          disabled={tags.length >= maxTags}
          className="flex-1 rounded-xl h-12"
        />
        <Button 
          onClick={() => {
            if (input.trim() && tags.length < maxTags) {
              setTags([...tags, input.trim()]);
              setInput('');
            }
          }}
          disabled={!input.trim() || tags.length >= maxTags}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-12"
        >
          {buttonText || "Add"}
        </Button>
      </div>
      <p className="text-xs text-slate-500">{tags.length} / {maxTags} items</p>
    </div>
  );
};

const DynamicInputList = ({ items, setItems, placeholder, buttonText, maxItems = 10 }: { items: string[], setItems: (t: string[]) => void, placeholder: string, buttonText: string, maxItems?: number }) => {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index] = e.target.value;
              setItems(newItems);
            }}
            placeholder={placeholder}
            className="flex-1 rounded-lg"
          />
          <button 
            onClick={() => {
              const newItems = [...items];
              newItems.splice(index, 1);
              setItems(newItems);
            }} 
            className="text-slate-700 hover:text-red-600 p-2 shrink-0 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
      {items.length < maxItems && (
        <div 
          onClick={() => setItems([...items, ""])}
          className="flex items-center text-purple-600 font-semibold cursor-pointer pt-1 hover:underline underline-offset-2 w-max"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {buttonText}
        </div>
      )}
    </div>
  );
};

export default function CampaignSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      // Intentionally ignoring network errors to prevent overlays
      if (user) {
        setUser(user);
      } else {
        navigate('/');
      }
    }).catch(() => {
      // Ignore uncaught fetch errors silently
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/');
      }
    });
  }, [navigate]);

  // Automatic Seeding Logic for empty state
  useEffect(() => {
    const savedInputs = localStorage.getItem('campaign_inputs');
    let hasForkliftUndercarriage = false;
    if (savedInputs) {
      try {
        const parsed = JSON.parse(savedInputs);
        if (Array.isArray(parsed) && parsed.some(item => item.keyword === "อะไหล่ช่วงล่างรถโฟล์คลิฟท์")) {
          hasForkliftUndercarriage = true;
        }
      } catch (e) {}
    }

    if (!hasForkliftUndercarriage) {
      const dataToImport = [
        { keyword: "อะไหล่ช่วงล่างรถโฟล์คลิฟท์", title: "อะไหล่ช่วงล่างรถโฟล์คลิฟท์การตรวจสอบและเปลี่ยน" },
        { keyword: "ยางรถโฟล์คลิฟท์ชนิดต่างๆ", title: "ควรเลือกอย่างไรสำหรับยางรถโฟล์คลิฟท์ชนิดต่างๆ แข็ง นิ่ม โฟม" },
        { keyword: "ล้อและแบริ่งรถโฟล์คลิฟท์", title: "ล้อและแบริ่งรถโฟล์คลิฟท์ เมื่อไหร่ควรเปลี่ยน" },
        { keyword: "ระบบบังคับเลี้ยว", title: "ระบบบังคับเลี้ยวและอะไหล่รถโฟล์คลิฟท์การดูแลให้คล่องตัว" },
        { keyword: "โช้คอัพรถโฟล์คลิฟท์", title: "โช้คอัพรถโฟล์คลิฟท์ ความรู้ด้านลดการสั่นสะเทือน" },
        { keyword: "เพลาและข้อต่อรถโฟล์คลิฟท์", title: "เพลาและข้อต่อรถโฟล์คลิฟท์ควรตรวจสอบอย่างไร" }
      ];
      const newItems = dataToImport.map((item, index) => {
        const base = {
          id: 'forklift-under-auto-' + Date.now() + '-' + index,
          keyword: item.keyword,
          title: item.title,
          language: 'thai'
        };
        if (index > 0) {
          return {
            ...base,
            overrides: {
              secondaryKeywords: ["อะไหล่ช่วงล่างรถโฟล์คลิฟท์"],
              language: "thai",
              targetCountry: "thailand",
              tone: "professional",
              pov: "third",
              formality: "formal",
              autoExternalLinks: false
            }
          };
        }
        return base;
      });
      setInputs(newItems);
      localStorage.setItem('campaign_inputs', JSON.stringify(newItems));
    }

    const savedArticles = localStorage.getItem('campaign_config_generatedArticles');
    let hasArticles = false;
    if (savedArticles) {
      try {
        const parsed = JSON.parse(savedArticles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasArticles = true;
        }
      } catch (e) {}
    }

    if (!hasArticles) {
      const seedArt = {
        id: 'seal-guide-seo-' + Date.now(),
        title: 'คู่มือการเลือกเครื่องซีลตามประเภทธุรกิจ ทำให้ใช่ตั้งแต่ครั้งแรก',
        keyword: 'เลือกเครื่องซีลตามธุรกิจ',
        language: 'thai',
        content: `# คู่มือการเลือกเครื่องซีลตามประเภทธุรกิจ: ทำให้ใช่และคุ้มค่าที่สุดตั้งแต่ครั้งแรก\n\nการเลือกซื้อเครื่องมือสำหรับธุรกิจบรรจุภัณฑ์หรืออุตสาหกรรมอาหาร สิ่งหนึ่งที่เป็นหัวใจสำคัญอย่างยิ่งคือ **"เครื่องซีล"** (Sealing Machine) เพราะการซีลปิดปากถุงหรือบรรจุภัณฑ์ที่ไม่ได้มาตรฐาน ไม่เพียงแต่ส่งผลต่อความสดใหม่และความสะอาดของสินค้าเท่านั้น แต่ยังอาจสร้างความเสียหายต่อภาพลักษณ์แบรนด์และความไว้วางใจของลูกค้าได้อีกด้วย\n\nวันนี้เราจะพาคุณมาเจาะลึกคู่มือวิธีการ **เลือกเครื่องซีลตามธุรกิจ** เพื่อช่วยให้คุณตัดสินใจลงทุนได้อย่างคุ้มค่า ตอบโจทย์กำลังการผลิต และสร้างยอดขายได้อย่างยั่งยืนครับ\n\n![การซีลสินค้าสวยงาม](gemini_img_cover_forklift)\n\n---\n\n## สรุปประเด็นสำคัญเพื่อการตัดสินใจอย่างรวดเร็ว (Key Takeaways)\n* **ธุรกิจเริ่มต้น / ร้านค้าออนไลน์ขนาดเล็ก**: แนะนำ **เครื่องซีลมือกด** หรือ **เครื่องซีลตั้งโต๊ะขนาดเล็ก** เน้นความประหยัดและคล่องตัวสูง\n* **ธุรกิจขนาดกลาง / SME / ร้านเบเกอรี่**: แนะนำ **เครื่องซีลสายพานต่อเนื่อง** ช่วยประหยัดเวลาและซีลได้รวดเร็วทันใจ\n* **ธุรกิจอาหารสด / อาหารแช่แข็ง**: แนะนำ **เครื่องซีลสูญญากาศ** เพื่อถนอมอาหาร ยืดอายุการจัดเก็บ และทนต่ออุณหภูมิต่ำ\n* **อุตสาหกรรมขนาดใหญ่ / โรงงานแปรรูปเนื้อสัตว์**: แนะนำ **เครื่องซีลสูญญากาศแบบห้องคู่ (Double Chamber)** หรือ **เครื่องซีลสายพานอัตโนมัติอุตสาหกรรม** เพื่อความรวดเร็วและทนทานสูงสุด\n\n---\n\n## ลักษณะการทำงานและขอบเขตการใช้งานของเครื่องซีลแต่ละประเภท\n\nเพื่อให้ง่ายต่อการประเมินความคุ้มค่า ลองมาดูการจัดกลุ่มประเภทเครื่องซีลที่เหมาะสมกับธุรกิจแต่ละประเภทกันครับ:\n\n### A. เครื่องซีลมือกด (Impulse Hand Sealer)\nเหมาะอย่างยิ่งสำหรับ **ผู้เริ่มต้นธุรกิจ** หรือร้านค้าออนไลน์ที่มีกำลังการผลิตต่อวันไม่สูงมาก (ต่ำกว่า 500 ถุงต่อวัน)\n* **จุดเด่น**: ราคาเริ่มต้นประหยัดมาก ใช้งานง่าย เสียบปลั๊กแล้วใช้งานได้ทันที น้ำหนักเบา\n* **ถุงที่รองรับ**: ถุงพลาสติกทั่วไป ถุงแก้ว ถุง PP, PE\n\n![การซีลมือกดเบื้องต้น](gemini_img_inline_pallet)\n\n### B. เครื่องซีลสายพานต่อเนื่อง (Band Sealer)\nเหมาะสำหรับ **ธุรกิจ SME, ร้านเบเกอรี่ และธุรกิจที่เริ่มเติบโต** มีกำลังการผลิตระดับปานกลางขึ้นไป (1,000 - 5,000 ถุงต่อวัน)\n* **จุดเด่น**: ทำงานได้อย่างต่อเนื่อง รวดเร็ว ปรับอุณหภูมิและความเร็วของสายพานได้ สามารถพิมพ์วันที่ผลิต/วันหมดอายุลงบนรอยซีลได้ในเครื่องเดียว\n* **ถุงที่รองรับ**: ถุงฟอยล์, ถุงคราฟท์, ถุงอลูมิเนียม และถุงพลาสติกหนาๆ\n\n![เครื่องซีลสายพานต่อเนื่อง](gemini_img_inline_forklift)\n\n### C. เครื่องซีลสูญญากาศ (Vacuum Sealer)\nเหมาะสำหรับ **ร้านอาหาร, ธุรกิจอาหารแช่แข็ง, โรงงานแปรรูปเนื้อสัตว์ และผักผลไม้สด**\n* **จุดเด่น**: ดูดอากาศออกจนเกลี้ยง ป้องกันการเกิดเชื้อราและแบคทีเรีย ยืดอายุสินค้าได้ยาวนานขึ้นถึง 3-5 เท่า ป้องกันการเกิดปฏิกิริยาออกซิเดชันของอาหาร\n* **ถุงที่รองรับ**: ถุงซีลสูญญากาศลายนูน หรือถุงซีลสูญญากาศผิวเรียบ (ขึ้นอยู่กับสเปกของเครื่อง)\n\n![การซีลถุงสูญญากาศถนอมอาหาร](gemini_img_inline_warehouse)\n\n---\n\n## ตารางเปรียบเทียบคุณสมบัติเครื่องซีลประเภทต่างๆ\n\n| ประเภทเครื่องซีล | ระดับกำลังการผลิต | ต้นทุนเริ่มต้น | ความเร็วในการทำงาน | จุดประสงค์หลัก |\n| :--- | :--- | :--- | :--- | :--- |\n| **เครื่องซีลมือกด** | ต่ำ (100 - 500 ถุง/วัน) | ต่ำมาก (หลักร้อยถึงพัน) | ช้า (กดทีละถุง) | ปิดปากถุงทั่วไป ประหยัดงบ |\n| **เครื่องซีลสายพาน** | ปานกลาง-สูง (1,000+ ถุง/วัน) | ปานกลาง (หลักพันถึงหมื่น) | เร็วมาก (วางไหลตามสายพาน) | เน้นความเร็ว พิมพ์วันที่ได้ |\n| **เครื่องซีลสูญญากาศ** | ปานกลาง-สูง (แล้วแต่รุ่น) | ปานกลาง-สูง (หลักพันถึงแสน) | ปานกลาง (ดูดอากาศแล้วซีล) | ถนอมอาหารแช่แข็ง/ของสด |\n\n---\n\n## 3 ปัจจัยหลักในการเลือกซื้อเครื่องซีลให้เหมาะสม\n\nหากคุณกำลังตัดสินใจเลือกซื้อเครื่องซีล ลองพิจารณาปัจจัยสำคัญ 3 ประการนี้ร่วมด้วยเพื่อไม่ให้เป็นการลงทุนที่เสียเปล่าครับ:\n\n### 1. ชนิดและความหนาของบรรจุภัณฑ์ (ถุง)\nถุงแต่ละชนิดต้องการความร้อนและระยะเวลาในการซีลที่แตกต่างกัน ถุงพลาสติกบางทั่วไปสามารถใช้เครื่องซีลมือกดราคาประหยัดได้ แต่หากเป็น **ถุงคราฟท์หนา ถุงอลูมิเนียมฟอยล์ หรือถุงกาแฟมีวาล์ว** คุณจำเป็นต้องใช้เครื่องซีลที่ให้ความร้อนคงที่และปรับอุณหภูมิได้อย่างแม่นยำ เช่น เครื่องซีลแบบสายพานต่อเนื่อง หรือเครื่องซีลเท้าเหยียบที่ใช้ระบบความร้อนคงที่ (Direct Heat Sealer)\n\n### 2. กำลังการผลิตและอัตราการผลิตต่อชั่วโมง\nถ้าธุรกิจของคุณต้องซีลสินค้าวันละหลายพันชิ้น การเลือกเครื่องซีลมือกดจะทำให้พนักงานเหนื่อยล้าสะสม ทำงานช้า และรอยซีลอาจไม่สม่ำเสมอ การขยับขึ้นมาลงทุนใน **เครื่องซีลสายพานต่อเนื่อง** จะช่วยย่นระยะเวลาการทำงานลงได้มากกว่า 3 เท่านั้น และได้รอยซีลที่สวยงาม สม่ำเสมอเท่ากันทุกถุง\n\n### 3. สภาพแวดล้อมของสินค้าและพื้นที่จัดเก็บ\nหากสินค้าของคุณมีลักษณะเป็นของเหลว ผงแป้ง หรืออาหารแช่แข็งที่ต้องทนอุณหภูมิต่ำ การซีลปิดปากถุงแบบปกติอาจไม่เพียงพอ การเลือกใช้ **เครื่องซีลสำหรับอาหารแช่แข็งโดยเฉพาะ** หรือเครื่องซีลสูญญากาศจะช่วยป้องกันการรั่วซึมและการปนเปื้อนได้อย่างมีประสิทธิภาพสูงสุด\n\n---\n\n## บทสรุป\nการเข้าใจความต้องการของธุรกิจ รู้วัตถุดิบและข้อจำกัดของสินค้า ถือเป็นกุญแจสำคัญที่จะช่วยให้คุณ **เลือกเครื่องซีลตามธุรกิจ** ได้อย่างแม่นยำ ทำให้มั่นใจได้ว่าสินค้าของคุณจะถึงมือลูกค้าอย่างปลอดภัยและมีคุณภาพดีที่สุดตั้งแต่กล่องแรกครับ!`,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
      };
      setGeneratedArticles([seedArt]);
      localStorage.setItem('campaign_config_generatedArticles', JSON.stringify([seedArt]));
    }
  }, []);

  // Campaign Inputs State
  const [inputs, setInputs] = useState<ArticleItem[]>(() => {
    const saved = localStorage.getItem('campaign_inputs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [selectedInputIds, setSelectedInputIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('campaign_inputs', JSON.stringify(inputs));
  }, [inputs]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingInputs, setPendingInputs] = useState([{ id: Date.now().toString(), keyword: '', title: '' }]);

  const handleAddKeyword = () => {
    const validInputs = pendingInputs.filter(item => item.keyword.trim() !== '');
    if (validInputs.length > 0) {
      const newItems = validInputs.map(item => ({
        id: item.id || Date.now().toString() + Math.random(),
        keyword: item.keyword.trim(),
        title: item.title.trim(),
        language: 'English (US)'
      }));
      setInputs([
        ...inputs,
        ...newItems
      ]);
      setPendingInputs([{ id: Date.now().toString(), keyword: '', title: '' }]);
      setIsAddModalOpen(false);
    }
  };

  const handleAddField = () => {
    setPendingInputs([...pendingInputs, { id: Date.now().toString() + Math.random(), keyword: '', title: '' }]);
  };

  const handleRemoveField = (id: string) => {
    if (pendingInputs.length > 1) {
      setPendingInputs(pendingInputs.filter(item => item.id !== id));
    }
  };

  const handleFieldChange = (id: string, field: 'keyword' | 'title', value: string) => {
    setPendingInputs(pendingInputs.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeInput = (id: string) => {
    setInputs(inputs.filter(i => i.id !== id));
  };

  // Configuration State
  const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
      const saved = localStorage.getItem(`campaign_config_${key}`);
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return initialValue;
        }
      }
      return initialValue;
    });

    useEffect(() => {
      try {
        localStorage.setItem(`campaign_config_${key}`, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }, [key, state]);

    return [state, setState];
  };

  const [secondaryKeywords, setSecondaryKeywords] = usePersistentState<string[]>('secondaryKeywords', []);
  const [audience, setAudience] = usePersistentState('audience', '');
  
  const [tone, setTone] = usePersistentState('tone', 'professional');
  const [copywritingFramework, setCopywritingFramework] = usePersistentState('copywritingFramework', '');
  const [pov, setPov] = usePersistentState('pov', 'third');
  const [language, setLanguage] = usePersistentState('language', 'english');
  const [lengthWords, setLengthWords] = usePersistentState<number[]>('lengthWords', [1500]);
  
  const [coverToggle, setCoverToggle] = usePersistentState('coverToggle', true);
  const [imageStyle, setImageStyle] = usePersistentState('imageStyle', 'realistic');
  const [aspectRatio, setAspectRatio] = usePersistentState('aspectRatio', '16:9');
  const [inlineCount, setInlineCount] = usePersistentState<number[]>('inlineCount', [3]);
  const [placement, setPlacement] = usePersistentState('placement', 'after-h2');
  
  const [internalLinks, setInternalLinks] = usePersistentState('internalLinks', '');
  const [sitemaps, setSitemaps] = usePersistentState<string[]>('sitemaps', []);
  const [customApiKey, setCustomApiKey] = usePersistentState('customApiKey', '645139e1a8fc4ed18665660a82c7412d.tWOLRtwBoUBsr8dJ');
  const [customOpenAiApiKey, setCustomOpenAiApiKey] = usePersistentState('customOpenAiApiKey', 'ark-a53fc090-6973-4a82-b47b-5bc5c4c952a4-b1f81');
  const [textApiModel, setTextApiModel] = usePersistentState('textApiModel', 'glm-5-turbo');
  const [textApiBaseUrl, setTextApiBaseUrl] = usePersistentState('textApiBaseUrl', 'https://api.z.ai/api/coding/paas/v4');
  const [textApiPrompt, setTextApiPrompt] = usePersistentState('textApiPrompt', '');
  const [imageApiModel, setImageApiModel] = usePersistentState('imageApiModel', 'seedream-4-5-251128');
  const [imageApiBaseUrl, setImageApiBaseUrl] = usePersistentState('imageApiBaseUrl', 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations');
  const [imageApiPrompt, setImageApiPrompt] = usePersistentState('imageApiPrompt', '');

  const [isTestingText, setIsTestingText] = useState(false);
  const [testTextStatus, setTestTextStatus] = useState<{success: boolean, message: string} | null>(null);
  
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [testImageStatus, setTestImageStatus] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    // Migrate empty or old values to the new Z.ai & ByteDance Seedream keys/configs
    if (!customApiKey || customApiKey === 'a70be79aa9cb48898212205ead1bcd29.Xpy23Bqe6Knurg6d') {
      setCustomApiKey('645139e1a8fc4ed18665660a82c7412d.tWOLRtwBoUBsr8dJ');
    }
    if (!textApiModel || textApiModel === 'auto' || textApiModel === 'GLM-5-Turbo') {
      setTextApiModel('glm-5-turbo');
    }
    if (!textApiBaseUrl || textApiBaseUrl === 'https://open.bigmodel.cn/api/paas/v4') {
      setTextApiBaseUrl('https://api.z.ai/api/coding/paas/v4');
    }
    if (!customOpenAiApiKey) {
      setCustomOpenAiApiKey('ark-a53fc090-6973-4a82-b47b-5bc5c4c952a4-b1f81');
    }
    if (!imageApiModel || imageApiModel === 'auto') {
      setImageApiModel('seedream-4-5-251128');
    }
    if (!imageApiBaseUrl) {
      setImageApiBaseUrl('https://ark.ap-southeast.bytepluses.com/api/v3/images/generations');
    }
  }, []);

  const testTextApi = async () => {
    if (!customApiKey) {
      setTestTextStatus({ success: false, message: 'กรุณาใส่ API Key สำหรับ Text ก่อน' });
      return;
    }
    setIsTestingText(true);
    setTestTextStatus(null);
    try {
    let requestModel = textApiModel;
    if (textApiModel === 'auto') {
      if (customApiKey.includes('.')) {
        requestModel = 'glm-4-flash';
      } else if (customApiKey.startsWith('sk-')) {
        requestModel = 'gpt-4o-mini';
      } else {
        requestModel = 'gemini-1.5-flash';
      }
    }
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': customApiKey.trim() },
        body: JSON.stringify({
          model: requestModel,
          contents: 'Say "hello, api works!"',
          config: { baseUrl: textApiBaseUrl }
        })
      });
      if (!response.ok) {
        let errorMsg = 'API request failed';
        try {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMsg = typeof errorData.error === 'string' ? errorData.error : (errorData.error?.message || errorData.message || errorText);
          } catch(e) {
            errorMsg = errorText || 'API request failed';
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();
      if (data.text || data.candidates) {
        setTestTextStatus({ success: true, message: 'เชื่อมต่อ Text API สำเร็จ!' });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setTestTextStatus({ success: false, message: 'เกิดข้อผิดพลาด: ' + (err.message || 'Unknown error') });
    } finally {
      setIsTestingText(false);
    }
  };

  const testImageApi = async () => {
    if (!customOpenAiApiKey) {
      setTestImageStatus({ success: false, message: 'กรุณาใส่ API Key สำหรับ Image ก่อน' });
      return;
    }
    setIsTestingImage(true);
    setTestImageStatus(null);
    try {
      const imageRequestModel = imageApiModel === 'auto' ? 'gpt-image-2' : imageApiModel;
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': customOpenAiApiKey.trim() },
        body: JSON.stringify({
          model: imageRequestModel, // testing image model
          contents: 'A simple red apple on white background', // text means trigger image generation in our updated backend logic?
          config: { 
            baseUrl: imageApiBaseUrl,
            aspectRatio: aspectRatio 
          }
        })
      });
      if (!response.ok) {
        let errorMsg = 'API request failed';
        try {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMsg = typeof errorData.error === 'string' ? errorData.error : (errorData.error?.message || errorData.message || errorText);
          } catch(e) {
            errorMsg = errorText || 'API request failed';
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();
      // It returns base64 or similar
      if (data.candidates || data.data) {
        setTestImageStatus({ success: true, message: 'เชื่อมต่อ Image API สำเร็จ!' });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setTestImageStatus({ success: false, message: 'เกิดข้อผิดพลาด: ' + (err.message || 'Unknown error') });
    } finally {
      setIsTestingImage(false);
    }
  };

  // Persistent Generated Articles
  const [generatedArticles, setGeneratedArticles] = usePersistentState<Array<{id: string, title: string, keyword: string, language: string, content: string, date: string}>>('generatedArticles', []);

  // Generation State
  const [activeTab, setActiveTab] = useState("inputs");
  const [generatingQueue, setGeneratingQueue] = usePersistentState<ArticleItem[]>('generatingQueue', []);
  const [generatedArticle, setGeneratedArticle] = useState<{id: string, title: string, markdown: string} | null>(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);

  const isProcessingRef = React.useRef(false);
  const latestQueueRef = React.useRef(generatingQueue);

  useEffect(() => {
    latestQueueRef.current = generatingQueue;
  }, [generatingQueue]);

  useEffect(() => {
    const processQueue = async () => {
      if (generatingQueue.length === 0) return;
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      const input = generatingQueue[0];
      
      try {
        // Merge global configuration with row-specific overrides
        const activeConfig = {
          language: input.overrides?.language || language,
          tone: input.overrides?.tone || tone,
          copywritingFramework: input.overrides?.copywritingFramework || copywritingFramework,
          pov: input.overrides?.pov || pov,
          lengthWords: input.overrides?.lengthWords || lengthWords[0],
          audience: input.overrides?.audience || audience,
          secondaryKeywords: input.overrides?.secondaryKeywords || secondaryKeywords,
          coverToggle: input.overrides?.coverToggle !== undefined ? input.overrides.coverToggle : coverToggle,
          inlineCount: input.overrides?.inlineCount !== undefined ? input.overrides.inlineCount : inlineCount[0],
          aspectRatio: input.overrides?.aspectRatio || aspectRatio,
          outline: input.overrides?.outline,
          sitemaps: input.overrides?.sitemaps || sitemaps,
          includeLinks: input.overrides?.includeLinks,
          includeSources: input.overrides?.includeSources,
          excludeSources: input.overrides?.excludeSources,
          targetCountry: input.overrides?.targetCountry,
          formality: input.overrides?.formality,
          formattingBold: input.overrides?.formattingBold,
          formattingItalics: input.overrides?.formattingItalics,
          formattingTables: input.overrides?.formattingTables,
          formattingQuotes: input.overrides?.formattingQuotes,
          formattingLists: input.overrides?.formattingLists,
          headingCase: input.overrides?.headingCase,
          knowledgeMode: input.overrides?.knowledgeMode,
          cta: input.overrides?.cta,
          keyTakeaways: input.overrides?.keyTakeaways,
          conclusion: input.overrides?.conclusion,
          faqs: input.overrides?.faqs,
          articleSize: input.overrides?.articleSize,
          linksPerH2: input.overrides?.linksPerH2,
          autoExternalLinks: input.overrides?.autoExternalLinks,
          autoYoutube: input.overrides?.autoYoutube,
          customApiKey: customApiKey,
          customOpenAiApiKey: customOpenAiApiKey,
          textApiModel: textApiModel,
          textApiBaseUrl: textApiBaseUrl,
          textApiPrompt: textApiPrompt,
          imageApiModel: imageApiModel,
          imageApiBaseUrl: imageApiBaseUrl,
          imageApiPrompt: imageApiPrompt
        };

        const content = await generateArticle(input.keyword, input.title, activeConfig);

        // Check if item was removed from queue while waiting
        if (!latestQueueRef.current.some(q => q.id === input.id)) {
          return; // Skip saving, let finally block reset processing ref
        }

        if (!content || content.trim().length === 0) {
          throw new Error('AI ไม่ได้ส่งเนื้อหาบทความกลับมา (ได้รับเนื้อหาว่างเปล่า)');
        }

        const newArticle = {
          id: Date.now().toString(),
          title: input.title || input.keyword,
          keyword: input.keyword,
          language: input.overrides?.language || language || 'English (US)',
          content: content,
          date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
        };

        setGeneratedArticles(prev => [newArticle, ...prev]);
        
        // Toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-6 py-3 text-sm font-medium shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4';
        toast.innerHTML = `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> บทความ "${newArticle.title}" สร้างเสร็จแล้ว`;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.classList.add('fade-out', 'slide-out-to-bottom-4');
          setTimeout(() => toast.remove(), 300);
        }, 3000);

      } catch (err: any) {
        if (err.message?.includes('โควต้า') || err.message?.includes('Quota Exceeded') || err.message?.includes('quota') || err.message?.includes('429')) {
          setGeneratingQueue([]);
          setActiveTab("settings");
          
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white rounded-xl px-6 py-4 text-sm font-medium shadow-2xl flex flex-col items-center gap-3 z-[9999] animate-in fade-in slide-in-from-bottom-4 max-w-[90vw] text-center';
          toast.innerHTML = `
          <div class="flex items-center gap-3">
             <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> 
             <div class="font-bold">โควต้า API เต็ม (Rate Limit) หรือ Token หมด</div>
          </div>
          <div class="text-xs text-white/80 max-w-[500px] break-words text-left bg-black/20 p-2 rounded">${err.message}</div>`;
          document.body.appendChild(toast);
          setTimeout(() => {
            toast.classList.add('fade-out', 'slide-out-to-bottom-4');
            setTimeout(() => toast.remove(), 300);
          }, 8000);

        } else {
          setActiveTab("settings");
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-2xl flex items-center gap-3 z-[9999] animate-in fade-in slide-in-from-bottom-4';
          toast.innerHTML = `ข้อผิดพลาด: ${err.message}`;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 5000);
        }
      } finally {
        isProcessingRef.current = false;
        setGeneratingQueue(prev => prev.filter(a => a.id !== input.id));
      }
    };

    processQueue();
  }, [generatingQueue, language, tone, copywritingFramework, pov, lengthWords, audience, secondaryKeywords, coverToggle, inlineCount, aspectRatio, sitemaps, internalLinks, generatedArticles]); // adding generic deps to ensure closure freshness, though generatedArticles not strictly needed if we use functional prev state.

  const startGenerating = (input: ArticleItem) => {
    // Only queue if not already queued
    if (generatingQueue.some(item => item.id === input.id)) return;
    
    setGeneratingQueue(prev => [...prev, input]);
    setInputs(prev => prev.filter(i => i.id !== input.id));
    setActiveTab("generations"); // Switch tab immediately
    
    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-6 py-3 text-sm font-medium shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4';
    toast.innerHTML = `<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> เพิ่ม "${input.keyword}" เข้าคิวคิวการสร้างแล้ว`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const generateSelectedInputs = () => {
    const selectedInputs = inputs.filter(input => selectedInputIds.includes(input.id));
    const newInputsToQueue = selectedInputs.filter(input => !generatingQueue.some(item => item.id === input.id));
    
    if (newInputsToQueue.length > 0) {
      setGeneratingQueue(prev => [...prev, ...newInputsToQueue]);
      setInputs(prev => prev.filter(input => !selectedInputIds.includes(input.id)));
      setActiveTab("generations");
      setSelectedInputIds([]); // Clear selection after generating
      
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-6 py-3 text-sm font-medium shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4';
      toast.innerHTML = `<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> เพิ่ม ${newInputsToQueue.length} บทความเข้าคิวการสร้างแล้ว`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  };

  // Edit Row State
  const [editingItem, setEditingItem] = useState<ArticleItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState('details');

  const saveOverrides = () => {
    if (!editingItem) return;
    setInputs(inputs.map(i => i.id === editingItem.id ? editingItem : i));
    setEditingItem(null);
  };

  const revertToTemplate = () => {
    if (!editingItem) return;
    setInputs(inputs.map(i => i.id === editingItem.id ? { ...i, overrides: undefined } : i));
    setEditingItem(null);
  }

  if(!user) return <div>Loading...</div>;

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Mobile Topbar */}
      <div className="md:hidden sticky top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50 flex items-center justify-between px-4 w-full">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-white">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span>z.ai<span className="text-purple-500 font-light ml-2">SEO Studio</span></span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-900 z-40 flex flex-col items-center pt-8 space-y-6">
          <nav className="flex flex-col items-center space-y-4 w-full px-6">
            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <LayoutDashboard className="w-5 h-5" /> แดชบอร์ด
            </Link>
            <Link to="/campaign/new" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-white bg-slate-800 transition-colors">
              <Plus className="w-5 h-5" /> สร้างแคมเปญใหม่
            </Link>
            <Link to="/articles" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <FileText className="w-5 h-5" /> บทความทั้งหมด
            </Link>
          </nav>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white mb-8">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span>z.ai<span className="text-purple-500 font-light ml-2">SEO Studio</span></span>
          </Link>
          
          <nav className="space-y-1">
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <LayoutDashboard className="w-4 h-4" /> แดชบอร์ด
            </Link>
            <Link to="/campaign/new" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white bg-slate-800 transition-colors">
              <Plus className="w-4 h-4" /> แคมเปญอัตโนมัติ
            </Link>
            <Link to="/articles" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
              <FileText className="w-4 h-4" /> บทความทั้งหมด
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-800 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-slate-400 truncate">ผู้ดูแลระบบ (Admin)</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden flex flex-col bg-[#fafafa] relative">
        {/* Scrollable Workspace */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full">
            
            {/* Header Area */}
            <div className="flex flex-col mb-6 md:mb-8 gap-4 border-b border-gray-200 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 break-words line-clamp-2 md:line-clamp-none">แคมเปญอัตโนมัติ (Default Campaign)</h1>
                    <Badge variant="secondary" className="font-normal text-xs bg-slate-100 text-slate-600 rounded-md whitespace-nowrap">Default</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">อัปเดตล่าสุดเมื่อ: วันนี้, 12:00 PM</p>
                </div>
                <div className="flex flex-wrap w-full md:w-auto gap-2">
                  <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm rounded-md border-slate-200 text-slate-700 flex-1 md:flex-none justify-center">
                    <FileText className="w-4 h-4" /> คู่มือการใช้งาน
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm rounded-md border-slate-200 text-slate-700 flex-1 md:flex-none justify-center">
                    <PlaySquare className="w-4 h-4" /> ดูวิดีโอสอน
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger className="text-left rounded-2xl bg-white hover:border-purple-300 hover:bg-purple-50/50 hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-center p-6 outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                  <Search className="w-8 h-8 text-purple-500 mb-4 bg-purple-50 p-1.5 rounded-lg" />
                  <span className="font-semibold text-slate-800 text-[15px]">เพิ่มบทความ SEO</span>
                  <span className="text-sm text-slate-500 mt-1">ใส่คีย์เวิร์ดตั้งต้นสำหรับบทความ</span>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] gap-0 !p-0 overflow-hidden bg-white border-none rounded-2xl shadow-xl">
                  <DialogHeader className="px-6 py-5 border-b border-slate-100 flex flex-row items-center justify-between bg-white">
                    <DialogTitle className="text-xl font-semibold text-slate-800 tracking-tight">เพิ่มคีย์เวิร์ด SEO</DialogTitle>
                  </DialogHeader>
                  
                  <Tabs defaultValue="manual" className="w-full bg-white">
                    <div className="px-6 pt-4 border-b border-slate-100">
                      <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger value="manual" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-2 px-1 font-medium text-slate-600 data-[state=active]:text-purple-700">กรอกเอง (Manual)</TabsTrigger>
                        <TabsTrigger value="import" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-2 px-1 font-medium text-slate-600 data-[state=active]:text-purple-700">นำเข้า (Import)</TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="manual" className="p-6 m-0 border-none outline-none max-h-[60vh] overflow-y-auto">
                      <div className="space-y-4">
                        {pendingInputs.map((item, index) => (
                          <div key={item.id} className="flex gap-3 items-center">
                            <Input 
                              placeholder="ระบุคีย์เวิร์ด SEO..." 
                              value={item.keyword}
                              onChange={(e) => handleFieldChange(item.id, 'keyword', e.target.value)}
                              className="flex-1 h-11 rounded-lg border-slate-200 focus-visible:ring-purple-500 shadow-sm"
                            />
                            <Input 
                              placeholder="ระบุหัวข้อ (ไม่บังคับ)" 
                              value={item.title}
                              onChange={(e) => handleFieldChange(item.id, 'title', e.target.value)}
                              className="flex-1 h-11 rounded-lg border-slate-200 focus-visible:ring-purple-500 shadow-sm"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-11 w-11 text-slate-400 hover:text-red-500 hover:bg-red-50" 
                              disabled={pendingInputs.length === 1}
                              onClick={() => handleRemoveField(item.id)}
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button 
                          variant="ghost" 
                          onClick={handleAddField}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2 h-auto justify-start font-medium text-sm rounded-lg"
                        >
                          <Plus className="w-4 h-4 mr-1" /> เพิ่มฟิลด์ใหม่
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="import" className="p-6 m-0">
                      <p className="text-sm text-slate-500">อัปโหลดไฟล์ CSV เพื่อนำเข้าข้อมูล (Coming soon)</p>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="px-6 py-4 m-0 border-t border-slate-100 bg-[#fafafa] flex sm:justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-lg font-medium hover:bg-slate-200/50 text-slate-600">ยกเลิก</Button>
                    <Button onClick={handleAddKeyword} className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm font-medium px-6">เพิ่มคีย์เวิร์ด</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card className="hover:border-blue-300 hover:bg-blue-50/50 hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-center p-6 rounded-2xl">
                <FileText className="w-8 h-8 text-blue-500 mb-4 bg-blue-50 p-1.5 rounded-lg" />
                <span className="font-semibold text-slate-800 text-[15px]">เพิ่มบทความข่าว (News)</span>
                <span className="text-sm text-slate-500 mt-1">บทความด่วนอิงจากข่าวล่าสุด</span>
              </Card>

              <Card className="hover:border-red-300 hover:bg-red-50/50 hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-center p-6 rounded-2xl">
                <Video className="w-8 h-8 text-red-500 mb-4 bg-red-50 p-1.5 rounded-lg" />
                <span className="font-semibold text-slate-800 text-[15px]">แปลง YouTube เป็นบทความ</span>
                <span className="text-sm text-slate-500 mt-1">สรุปเนื้อหาจากวิดีโอ YouTube</span>
              </Card>
            </div>

            {/* Campaign Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200 mb-6 w-full overflow-x-auto overflow-y-hidden">
                <TabsList className="bg-transparent h-auto p-0 flex space-x-6 min-w-max">
                  <TabsTrigger value="inputs" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-3 px-1 font-medium text-slate-600 data-[state=active]:text-purple-700 hover:text-purple-700 transition-colors">
                    คีย์เวิร์ดนำเข้า <Badge className="ml-2 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium px-1.5 py-0 rounded-md border-0 shadow-none">{inputs.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="generations" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-3 px-1 font-medium text-slate-600 data-[state=active]:text-purple-700 hover:text-purple-700 transition-colors">
                    ประวัติการสร้าง <Badge className="ml-2 bg-purple-100 text-purple-700 hover:bg-purple-100 font-medium px-1.5 py-0 rounded-md border-0 shadow-none">{generatedArticles.length + generatingQueue.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="publications" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-3 px-1 font-medium text-slate-600 data-[state=active]:text-purple-700 hover:text-purple-700 transition-colors">
                    การเผยแพร่ <Badge className="ml-2 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium px-1.5 py-0 rounded-md border-0 shadow-none">0</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="configuration" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-3 px-1 font-medium text-slate-600 data-[state=active]:text-purple-700 hover:text-purple-700 transition-colors">
                    ตั้งค่าแคมเปญ
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-3 px-1 font-medium text-slate-600 data-[state=active]:text-purple-700 hover:text-purple-700 transition-colors">
                    เทมเพลตบทความ
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-3 px-1 font-medium text-slate-600 data-[state=active]:text-purple-700 hover:text-purple-700 transition-colors">
                    เชื่อมต่อระบบ
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab: Inputs */}
              <TabsContent value="inputs" className="outline-none">
                {selectedInputIds.length > 0 && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-purple-700 font-medium text-sm ml-2">เลือกแล้ว {selectedInputIds.length} รายการ</span>
                    <Button 
                      onClick={generateSelectedInputs}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm transition-all text-sm h-9 px-4 rounded-lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      สร้างบทความที่เลือก
                    </Button>
                  </div>
                )}
                <div className="bg-white border text-sm border-slate-100 rounded-2xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-b border-slate-200 hover:bg-transparent">
                        <TableHead className="w-12 text-center py-3">
                          <Checkbox 
                            checked={inputs.length > 0 && selectedInputIds.length === inputs.length}
                            onCheckedChange={(checked) => {
                              setSelectedInputIds(checked ? inputs.map(i => i.id) : []);
                            }}
                            className="border-slate-300 rounded-[4px] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" 
                          />
                        </TableHead>
                        <TableHead className="font-medium text-slate-500 py-3 w-16"><div className="flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5"/> ลำดับ</div></TableHead>
                        <TableHead className="font-medium text-slate-500 py-3"><div className="flex items-center gap-1.5"><SearchCode className="w-3.5 h-3.5"/> คีย์เวิร์ด (Input)</div></TableHead>
                        <TableHead className="font-medium text-slate-500 py-3 w-32">ภาษา</TableHead>
                        <TableHead className="text-right py-3 w-48"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-72 text-center hover:bg-transparent">
                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-4">
                              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center shadow-sm">
                                <SearchCode className="w-8 h-8 text-purple-500" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-semibold text-slate-800">ยังไม่มีข้อมูลเริ่มต้น</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto">คลิกการ์ด "เพิ่มบทความ SEO" ด้านบนเพื่อระบุเป้าหมายคีย์เวิร์ดสำหรับสร้างเนื้อหา</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        inputs.map((input, index) => (
                          <TableRow key={input.id} className="group border-b border-slate-100 hover:bg-slate-50/50">
                            <TableCell className="text-center py-4">
                              <Checkbox 
                                checked={selectedInputIds.includes(input.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedInputIds(prev => 
                                    checked ? [...prev, input.id] : prev.filter(id => id !== input.id)
                                  );
                                }}
                                className="border-slate-300 rounded-[4px] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" 
                              />
                            </TableCell>
                            <TableCell className="text-slate-500 py-4">{index + 1}</TableCell>
                            <TableCell className="font-medium text-slate-800 py-4 flex items-center gap-2">
                              <Search className="w-4 h-4 text-purple-500" />
                              {input.keyword}
                              {input.title && <span className="text-xs font-normal text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded ml-2 hidden sm:inline-block">({input.title})</span>}
                            </TableCell>
                            <TableCell className="text-slate-600 py-4">
                              {(() => {
                                const activeLang = input.overrides?.language || language;
                                return activeLang === 'thai' ? 'ภาษาไทย (Thai)' : 'English (US)';
                              })()}
                            </TableCell>
                            <TableCell className="text-right py-4">
                              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2 sm:gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-medium disabled:opacity-50"
                                  onClick={() => startGenerating(input)}
                                  disabled={generatingQueue.some(i => i.id === input.id)}
                                >
                                  {generatingQueue.some(i => i.id === input.id) ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                  ) : (
                                    <PlaySquare className="w-3.5 h-3.5 mr-1.5" />
                                  )}
                                  {generatingQueue.some(i => i.id === input.id) ? 'อยู่ในคิว...' : 'สร้างบทความ'}
                                </Button>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => setEditingItem(input)}>
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => removeInput(input.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Tab: Configuration (Bento Grid) */}
              <TabsContent value="configuration" className="outline-none pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card className="md:col-span-2 flex flex-col p-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-slate-400" /> การตั้งค่าเป้าหมาย
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-medium text-[0.85rem] text-slate-800">คีย์เวิร์ดรอง (Secondary Keywords)</Label>
                        <TagInput 
                          tags={secondaryKeywords} 
                          setTags={setSecondaryKeywords} 
                          placeholder="พิมพ์แล้วกด Enter..." 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audience" className="font-medium text-[0.85rem] text-slate-800">กลุ่มเป้าหมาย</Label>
                        <Input 
                          id="audience" 
                          placeholder="เช่น คนที่ค้นหาข้อมูลสินค้าในอินเทอร์เน็ต" 
                          value={audience}
                          onChange={(e) => setAudience(e.target.value)}
                          className="bg-white border-slate-200 rounded-lg focus-visible:ring-purple-500"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-1 flex flex-col p-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Feather className="w-4 h-4 text-slate-400" /> กฎเกณฑ์เนื้อหา
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-medium text-[0.85rem] text-slate-800">น้ำเสียง (Tone)</Label>
                          <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger className="border-slate-200 rounded-lg focus:ring-purple-500">
                              <SelectValue placeholder="เลือกสไตล์" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">เป็นทางการ (Professional)</SelectItem>
                              <SelectItem value="conversational">เป็นกันเอง (Conversational)</SelectItem>
                              <SelectItem value="persuasive">เพื่อการขาย (Persuasive)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium text-[0.85rem] text-slate-800">โครงสร้างบทความ (Copywriting Framework)</Label>
                          <Select value={copywritingFramework || 'standard'} onValueChange={(val) => setCopywritingFramework(val === 'standard' ? '' : val)}>
                            <SelectTrigger className="border-slate-200 rounded-lg focus:ring-purple-500">
                              <SelectValue placeholder="ปกติ (มาตรฐาน SEO)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">✨ Auto (AI วิเคราะห์โครงสร้างอัตโนมัติ)</SelectItem>
                              <SelectItem value="standard">ปกติ (มาตรฐาน SEO)</SelectItem>
                              <SelectItem value="AIDA">AIDA (Attention, Interest, Desire, Action)</SelectItem>
                              <SelectItem value="PAS">PAS (Problem, Agitate, Solve)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium text-[0.85rem] text-slate-800">มุมมอง (POV)</Label>
                          <Select value={pov} onValueChange={setPov}>
                            <SelectTrigger className="border-slate-200 rounded-lg focus:ring-purple-500">
                              <SelectValue placeholder="เลือกมุมมอง" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="first">บุรุษที่ 1</SelectItem>
                              <SelectItem value="third">บุรุษที่ 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium text-[0.85rem] text-slate-800">ภาษา</Label>
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="border-slate-200 rounded-lg focus:ring-purple-500">
                              <SelectValue placeholder="เลือกภาษา" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="english">English (US)</SelectItem>
                              <SelectItem value="thai">ภาษาไทย (Thai)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-[0.85rem] text-slate-800">ความยาวเนื้อหา</Label>
                          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">~{lengthWords[0]} คำ</span>
                        </div>
                        <Slider value={lengthWords} onValueChange={(val: any) => setLengthWords(val as number[])} max={3000} min={500} step={100} className="py-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-1 flex flex-col p-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-slate-400" /> สื่อประกอบเนื้อหา
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <Label className="font-medium text-[0.85rem] text-slate-800">สร้างภาพปก</Label>
                        <Switch checked={coverToggle} onCheckedChange={setCoverToggle} className="data-[state=checked]:bg-purple-600" />
                      </div>
                      <div className={`space-y-4 transition-opacity duration-200 ${!coverToggle ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="space-y-2">
                          <Label className="font-medium text-[0.85rem] text-slate-800">สัดส่วนภาพ</Label>
                          <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={!coverToggle}>
                            <SelectTrigger className="border-slate-200 rounded-lg focus:ring-purple-500">
                              <SelectValue placeholder="สัดส่วนภาพ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="16:9">16:9 (แนวนอน)</SelectItem>
                              <SelectItem value="1:1">1:1 (จัตุรัส)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-4 pt-2">
                         <div className="flex items-center justify-between">
                          <Label className="font-medium text-[0.85rem] text-slate-800">จำนวนภาพแทรก</Label>
                          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{inlineCount[0]} ภาพ</span>
                        </div>
                        <Slider value={inlineCount} onValueChange={(val: any) => setInlineCount(val as number[])} max={5} min={0} step={1} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2 flex flex-col p-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-slate-400" /> ลิงก์ภายในและ Sitemap (Internal Linking)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label className="font-medium text-[0.85rem] text-slate-800">Reference URLs</Label>
                        <Textarea 
                          placeholder="https://...&#10;https://..." 
                          value={internalLinks}
                          onChange={(e) => setInternalLinks(e.target.value)}
                          className="min-h-[100px] max-h-[300px] overflow-y-auto resize-none font-mono text-sm leading-relaxed border-slate-200 rounded-lg focus-visible:ring-purple-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">ใส่ลิงก์ของคุณเพื่อให้ AI แทรกเข้าบทความอัตโนมัติ</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <Label className="font-medium text-[0.85rem] text-slate-800 flex items-center gap-2">
                          Sitemaps <span className="text-slate-400 font-normal">(Optional)</span>
                        </Label>
                        <InlineTagInput 
                          tags={sitemaps} 
                          setTags={setSitemaps} 
                          placeholder="https://example.com/sitemap.xml" 
                          buttonText="Add Sitemap"
                        />
                        <p className="text-xs text-slate-500 mt-2">เพิ่ม Sitemap เพื่อให้ AI ค้นหาลิงก์ภายในได้ครอบคลุมมากขึ้น</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Generations */}
              <TabsContent value="generations" className="outline-none">
                <div className="bg-white border text-sm border-slate-100 rounded-2xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-b border-slate-200 hover:bg-transparent">
                        <TableHead className="w-12 text-center py-3"><Checkbox className="border-slate-300 rounded-[4px]" /></TableHead>
                        <TableHead className="font-medium text-slate-500 py-3 pl-2">Article</TableHead>
                        <TableHead className="font-medium text-slate-500 py-3">Input</TableHead>
                        <TableHead className="font-medium text-slate-500 py-3">Date</TableHead>
                        <TableHead className="font-medium text-slate-500 py-3">Language</TableHead>
                        <TableHead className="text-right py-3 pr-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatingQueue.map((queueItem, index) => (
                        <TableRow key={`queue-${queueItem.id}`} className="group border-b border-slate-100 bg-slate-50/30">
                          <TableCell className="w-12 text-center py-4"><Checkbox disabled className="border-slate-300 rounded-[4px]" /></TableCell>
                          <TableCell className="font-medium text-slate-800 py-4 pl-2">
                            <Badge variant="outline" className={`${index === 0 ? "text-orange-500 border-orange-200 bg-orange-50" : "text-slate-500 border-slate-200 bg-slate-50"} font-medium`}>
                              {index === 0 ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
                              )}
                              {index === 0 ? 'Generating' : 'Queued'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 py-4 font-medium flex items-center gap-2">
                            <SearchCode className="w-4 h-4 text-green-500"/>
                            {queueItem.keyword}
                          </TableCell>
                          <TableCell className="text-slate-500 py-4">{new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</TableCell>
                          <TableCell className="text-slate-500 py-4">{queueItem.overrides?.language || language}</TableCell>
                          <TableCell className="text-right py-4 pr-6">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-500 transition-colors" 
                              title="หยุดสร้างบทความ"
                              onClick={() => {
                                setGeneratingQueue(prev => prev.filter(q => q.id !== queueItem.id));
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {generatedArticles.length === 0 && generatingQueue.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-72 text-center hover:bg-transparent">
                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-4">
                              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center shadow-sm">
                                <FileText className="w-8 h-8 text-slate-300" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-semibold text-slate-800">ยังไม่มีบทความที่สร้างเสร็จ</h3>
                                <p className="text-sm text-slate-500">บทความที่สร้างสำเร็จจะถูกเก็บไว้ที่นี่ชั่วคราว</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        generatedArticles.map((article) => (
                          <TableRow key={article.id} className="group border-b border-slate-100 hover:bg-slate-50/50">
                            <TableCell className="w-12 text-center py-4"><Checkbox className="border-slate-300 rounded-[4px]" /></TableCell>
                            <TableCell className="font-medium text-slate-800 py-4 pl-2">
                              {article.title}
                            </TableCell>
                            <TableCell className="text-slate-700 py-4 font-medium flex items-center gap-2">
                              <SearchCode className="w-4 h-4 text-green-500"/>
                              {article.keyword}
                            </TableCell>
                            <TableCell className="text-slate-500 py-4">{article.date}</TableCell>
                            <TableCell className="text-slate-500 py-4">{article.language || 'English (US)'}</TableCell>
                            <TableCell className="text-right py-4 pr-6">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                  onClick={() => {
                                    setGeneratedArticle({ id: article.id, title: article.title, markdown: article.content });
                                    setArticleModalOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700">
                                  <Send className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-500 hover:text-red-500"
                                  onClick={() => setGeneratedArticles(prev => prev.filter(a => a.id !== article.id))}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="publications" className="bg-white border text-sm border-slate-100 rounded-2xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)]">
                <div className="p-16 text-center text-slate-500">
                    ไม่มีบทความที่เผยแพร่
                </div>
              </TabsContent>
              <TabsContent value="templates" className="bg-white border text-sm border-slate-100 rounded-2xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)]">
                <div className="p-16 text-center text-slate-500">
                    การตั้งค่าเทมเพลตและบล็อก
                </div>
              </TabsContent>
              <TabsContent value="settings" className="bg-white border text-sm border-slate-200 rounded-lg shadow-sm">
                <div className="p-8">
                  <div className="max-w-4xl space-y-8">
                    <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-100 pb-4">การเชื่อมต่อ API (API Connections)</h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Text Generation API */}
                      <div className="space-y-4 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                           <FileText className="w-5 h-5 text-blue-500" />
                           <h4 className="font-semibold text-slate-800 text-base">ระบบสร้างเนื้อหาข้อความ (Text API)</h4>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customApiKey" className="font-medium text-sm text-slate-700">API Key สำหรับเนื้อหาข้อความ</Label>
                          <Input 
                            id="customApiKey" 
                            type="password"
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            placeholder="ใส่ API Key สำหรับสร้างข้อความ..." 
                            className="h-11 shadow-sm font-mono text-sm border-slate-200"
                          />
                          <p className="text-xs text-slate-500">
                            ใช้สำหรับสร้างเนื้อหาบรรยายและโครงสร้างข้อมูลของบทความ
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="textApiModel" className="font-medium text-sm text-slate-700">โมเดล AI ที่ต้องการใช้ (AI Model)</Label>
                          <Select 
                            value={textApiModel} 
                            onValueChange={(val) => setTextApiModel(val)}
                          >
                            <SelectTrigger id="textApiModel" className="h-11 shadow-sm text-sm border-slate-200 bg-white">
                               <SelectValue placeholder="เลือกโมเดล AI" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto (ตรวจจับจาก API Key อัตโนมัติ)</SelectItem>
                              <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Google)</SelectItem>
                              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</SelectItem>
                              <SelectItem value="gpt-4o-mini">GPT-4o Mini (OpenAI)</SelectItem>
                              <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                              <SelectItem value="gpt-5.5">GPT-5.5 (OpenAI)</SelectItem>
                              <SelectItem value="o1-mini">o1-mini (OpenAI)</SelectItem>
                              <SelectItem value="o3-mini">o3-mini (OpenAI)</SelectItem>
                              <SelectItem value="claude-3-opus">Claude 3 Opus (Anthropic)</SelectItem>
                              <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</SelectItem>
                              <SelectItem value="claude-3-5-haiku">Claude 3.5 Haiku (Anthropic)</SelectItem>
                              <SelectItem value="GLM-5.1">GLM-5.1 (Z.AI)</SelectItem>
                              <SelectItem value="GLM-5">GLM-5 (Z.AI)</SelectItem>
                              <SelectItem value="glm-5-turbo">glm-5-turbo (Z.AI)</SelectItem>
                              <SelectItem value="GLM-4.7">GLM-4.7 (Z.AI)</SelectItem>
                              <SelectItem value="GLM-4.6">GLM-4.6 (Z.AI)</SelectItem>
                              <SelectItem value="GLM-4.5">GLM-4.5 (Z.AI)</SelectItem>
                              <SelectItem value="glm-4-flash">glm-4-flash (Z.AI)</SelectItem>
                              <SelectItem value="GLM-4-32B-0414-128K">GLM-4-32B (Z.AI)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">
                            เลือกโมเดลที่ต้องการ หรือตั้งเป็น Auto เพื่อให้ระบบเลือกตาม API Key ให้อัตโนมัติ
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="textApiBaseUrl" className="font-medium text-sm text-slate-700">Base URL (ตัวเลือกเสริมสำหรับ Proxy / Z.AI)</Label>
                          <Input 
                            id="textApiBaseUrl" 
                            type="text"
                            value={textApiBaseUrl}
                            onChange={(e) => setTextApiBaseUrl(e.target.value)}
                            placeholder="https://api.openai.com/v1" 
                            className="h-11 shadow-sm font-mono text-sm border-slate-200"
                          />
                          <p className="text-xs text-slate-500">
                            เว้นว่างไว้ถ้าใช้ของ Official. กรอกลิงก์เฉพาะกรณีใช้ API ผ่านตัวกลาง เช่น Z.AI (จำเป็นต้องเลือก Model เป็นฝั่ง OpenAI/Custom)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="textApiPrompt" className="font-medium text-sm text-slate-700">คู่มือ / คำสั่งพิเศษ สำหรับ Text (รองรับการใส่ Link)</Label>
                          <p className="text-xs text-slate-500">
                            คุณสามารถพิมพ์คำสั่งพิเศษ หรือวาง Link เว็บไซต์ เพื่อให้ระบบดึงข้อมูลในเว็บนั้นมาเป็นความรู้ให้ AI ได้
                          </p>
                          <Textarea 
                            id="textApiPrompt" 
                            value={textApiPrompt}
                            onChange={(e) => setTextApiPrompt(e.target.value)}
                            placeholder="ใส่คำสั่งพิเศษ หรือ วาง Link เว็บไซต์ให้ AI อ่านทำความเข้าใจ เช่น 'คุณคือผู้เชี่ยวชาญ SEO ทำเนื้อหาตามเว็บนี้ https://example.com'..." 
                            className="min-h-[100px] max-h-[300px] overflow-y-auto text-sm"
                          />
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                          <Button 
                            onClick={testTextApi} 
                            disabled={isTestingText}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isTestingText ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlaySquare className="w-4 h-4 mr-2" />}
                            ทดสอบ Text API
                          </Button>
                          {testTextStatus && (
                            <div className={`p-3 text-sm rounded-lg flex items-start gap-2 ${testTextStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              <span>{testTextStatus.success ? '✅' : '❌'}</span>
                              <span>{testTextStatus.message}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image Generation API */}
                      <div className="space-y-4 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                           <ImageIcon className="w-5 h-5 text-purple-500" />
                           <h4 className="font-semibold text-slate-800 text-base">ระบบสร้างรูปภาพ (Image API)</h4>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customOpenAiApiKey" className="font-medium text-sm text-slate-700">API Key สำหรับสร้างรูปภาพ</Label>
                          <Input 
                            id="customOpenAiApiKey" 
                            type="password"
                            value={customOpenAiApiKey}
                            onChange={(e) => setCustomOpenAiApiKey(e.target.value)}
                            placeholder="ใส่ API Key สำหรับสร้างรูปภาพ..." 
                            className="h-11 shadow-sm font-mono text-sm border-slate-200"
                          />
                          <p className="text-xs text-slate-500">
                            ใช้สำหรับสร้างรูปภาพประกอบในบทความ
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imageApiModel" className="font-medium text-sm text-slate-700">โมเดลสร้างรูปภาพ (Image Model)</Label>
                          <Select 
                            value={imageApiModel} 
                            onValueChange={(val) => setImageApiModel(val)}
                          >
                            <SelectTrigger id="imageApiModel" className="h-11 shadow-sm text-sm border-slate-200 bg-white">
                               <SelectValue placeholder="เลือกโมเดล Image" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto (GPT-Image-2)</SelectItem>
                              <SelectItem value="gpt-image-2">GPT Image 2</SelectItem>
                              <SelectItem value="gpt-image-1.5">GPT Image 1.5</SelectItem>
                              <SelectItem value="gpt-image-1">GPT Image 1</SelectItem>
                              <SelectItem value="gpt-image-1-mini">GPT Image 1 Mini</SelectItem>
                              <SelectItem value="dall-e-3">DALL-E 3 (OpenAI)</SelectItem>
                              <SelectItem value="dall-e-2">DALL-E 2 (OpenAI)</SelectItem>
                              <SelectItem value="flux">Flux (Custom)</SelectItem>
                              <SelectItem value="midjourney">Midjourney (Custom)</SelectItem>
                              <SelectItem value="sdxl">SDXL (Custom)</SelectItem>
                              <SelectItem value="GLM-Image">GLM-Image (Z.AI)</SelectItem>
                              <SelectItem value="CogView-4-250304">CogView-4 (Z.AI)</SelectItem>
                              <SelectItem value="seedream-4-5-251128">Seedream 4.5 (ByteDance)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">
                            ระบุชื่อโมเดลรูปภาพที่ต้องการใช้
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="imageApiBaseUrl" className="font-medium text-sm text-slate-700">Base URL (ตัวเลือกเสริมสำหรับ Proxy / Z.AI)</Label>
                          <Input 
                            id="imageApiBaseUrl" 
                            type="text"
                            value={imageApiBaseUrl}
                            onChange={(e) => setImageApiBaseUrl(e.target.value)}
                            placeholder="https://api.openai.com/v1" 
                            className="h-11 shadow-sm font-mono text-sm border-slate-200"
                          />
                          <p className="text-xs text-slate-500">
                            เว้นว่างไว้ถ้าใช้ของ Official. กรอกลิงก์เฉพาะกรณีใช้ API ผ่านตัวกลาง เช่น Z.AI เพื่อสร้างรูป
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="imageApiPrompt" className="font-medium text-sm text-slate-700">คู่มือ / คำสั่งพิเศษ สำหรับหน้าตาภาพ (รองรับการใส่ Link)</Label>
                          <p className="text-xs text-slate-500">
                            คุณสามารถพิมพ์สไตล์ภาพ หรือวาง Link เว็บไซต์ เพื่อให้ระบบนำเนื้อหาในเว็บนั้นมาดัดแปลงเป็นสไตล์ภาพให้ AI
                          </p>
                          <Textarea 
                            id="imageApiPrompt" 
                            value={imageApiPrompt}
                            onChange={(e) => setImageApiPrompt(e.target.value)}
                            placeholder="ใส่สไตล์รูปภาพที่ต้องการ หรือ วาง Link เว็บไซต์ให้ AI อ่านเพื่อดึงสไตล์ภาพ (เช่น https://example.com)..." 
                            className="min-h-[100px] max-h-[300px] overflow-y-auto text-sm"
                          />
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                          <Button 
                            onClick={testImageApi} 
                            disabled={isTestingImage}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {isTestingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlaySquare className="w-4 h-4 mr-2" />}
                            ทดสอบ Image API
                          </Button>
                          {testImageStatus && (
                            <div className={`p-3 text-sm rounded-lg flex items-start gap-2 ${testImageStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              <span>{testImageStatus.success ? '✅' : '❌'}</span>
                              <span>{testImageStatus.message}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </main>

      {/* Item Settings (Overrides) Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="w-[95vw] max-w-4xl sm:max-w-4xl md:w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="px-8 py-6 border-b border-slate-200">
            <DialogTitle className="text-xl">ปรับแต่งรายละเอียดบทความ SEO</DialogTitle>
            <DialogDescription className="mt-2 text-slate-500">
              คุณสามารถแก้ไขค่าเริ่มต้นของทั้งแคมเปญได้ในส่วน <span className="text-purple-600 underline cursor-pointer">เทมเพลตบทความ</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Sidebar Mapping */}
            <div className="w-full md:w-64 shrink-0 border-b md:border-r md:border-b-0 border-slate-100 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1 flex md:flex-col overflow-x-auto md:overflow-y-auto">
              <Button variant="ghost" onClick={() => setActiveModalTab('details')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'details' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <AlignLeft className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">รายละเอียด</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('outline')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'outline' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <List className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">โครงสร้าง Outline</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('content')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'content' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <FileText className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">เนื้อหา</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('knowledge')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'knowledge' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <BookOpen className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">ความรู้เสริม</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('formatting')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'formatting' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <Type className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">รูปแบบอักษร</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('structure')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'structure' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <Layout className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">โครงสร้างบทความ</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('internal-linking')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'internal-linking' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <LinkIcon className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">ลิงก์ภายใน</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('external-linking')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'external-linking' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <ExternalLink className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">ลิงก์ภายนอก</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('images')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'images' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <ImageIcon className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">รูปภาพ</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('videos')} className={`w-auto md:w-full shrink-0 justify-start font-medium rounded-xl py-6 ${activeModalTab === 'videos' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <PlaySquare className="w-5 h-5 md:mr-3" /> <span className="hidden md:inline">วิดีโอ</span>
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 bg-white">
              <div className="max-w-2xl space-y-8">
                
                {/* Details Section */}
                {activeModalTab === 'details' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Focus Keyword <span className="text-red-500">*</span></Label>
                    <Input 
                      value={editingItem?.keyword || ''} 
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, keyword: e.target.value} : null)}
                      className="rounded-lg h-10"
                    />
                    <p className="text-sm text-slate-500">The article will be centered around this keyword.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">Article Title</Label>
                      <Button variant="ghost" onClick={() => alert('Generative feature is coming soon!')} className="text-purple-600 font-semibold h-auto p-0 hover:bg-transparent hover:text-purple-700 underline underline-offset-2">
                        <Sparkles className="w-4 h-4 mr-2"/> Generate Title
                      </Button>
                    </div>
                    <Input 
                      value={editingItem?.title || ''} 
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, title: e.target.value} : null)}
                      placeholder="Leave blank to generate automatically"
                      className="rounded-lg h-10"
                    />
                    <p className="text-sm text-slate-500">This will be the title of the article. You can leave blank so it gets generated along with the article.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">Include Keywords</Label>
                      <Button variant="ghost" onClick={() => alert('Generative feature is coming soon!')} className="text-purple-600 font-semibold h-auto p-0 hover:bg-transparent hover:text-purple-700 underline underline-offset-2">
                        <Sparkles className="w-4 h-4 mr-2"/> Generate Keywords
                      </Button>
                    </div>
                    <DynamicInputList 
                      items={editingItem?.overrides?.secondaryKeywords || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), secondaryKeywords: items}} : null)} 
                      placeholder="how to bake bread" 
                      buttonText="Add Keyword"
                    />
                    <p className="text-sm text-slate-500 pt-2">We will force-feed these keywords to the article. Make sure the keywords are related to the article's topic and do not contain typos.</p>
                  </div>
                </div>
                )}

                {/* Content Section (Overrides) */}
                {activeModalTab === 'content' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Language</Label>
                    <Select 
                      value={editingItem?.overrides?.language || language} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), language: val}} : null)}>
                      <SelectTrigger className="py-6 rounded-xl text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English (US)</SelectItem>
                        <SelectItem value="thai">Thai</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">The language in which all articles will be written in.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Target Country</Label>
                    <Select 
                      value={editingItem?.overrides?.targetCountry || "united_states"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), targetCountry: val}} : null)}>
                      <SelectTrigger className="py-6 rounded-xl text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="united_states">United States</SelectItem>
                        <SelectItem value="thailand">Thailand</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">Generate location-specific content. Important for features like Connect to Web and External Linking.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Tone of Voice</Label>
                    <Input 
                      placeholder="neutral"
                      value={editingItem?.overrides?.tone || tone} 
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), tone: e.target.value}} : null)}
                      className="text-base py-6 rounded-xl"
                    />
                    <p className="text-sm text-slate-500">Examples: funny, informal, academic</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Point of View</Label>
                    <Select 
                      value={editingItem?.overrides?.pov || pov} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), pov: val}} : null)}>
                      <SelectTrigger className="py-6 rounded-xl text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="first">First Person (I/We)</SelectItem>
                        <SelectItem value="second">Second Person (You)</SelectItem>
                        <SelectItem value="third">Third Person (He/She/They)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">This will affect the pronouns used in the article.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Formality</Label>
                    <Select 
                      value={editingItem?.overrides?.formality || "automatic"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formality: val}} : null)}>
                      <SelectTrigger className="py-6 rounded-xl text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="informal">Informal</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">Useful if selected language has both formal & informal verb conjugations.</p>
                  </div>
                </div>
                )}

                {/* Formatting Section (Overrides) */}
                {activeModalTab === 'formatting' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Bold</Label>
                      <p className="text-sm text-slate-500">We will bold important keywords in your article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.formattingBold !== undefined ? editingItem.overrides.formattingBold : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingBold: checked}} : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Italics</Label>
                      <p className="text-sm text-slate-500">We will use italics for subtle emphasis in your article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.formattingItalics !== undefined ? editingItem.overrides.formattingItalics : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingItalics: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Tables</Label>
                      <p className="text-sm text-slate-500">If appropriate, we'll include tables in your article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.formattingTables !== undefined ? editingItem.overrides.formattingTables : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingTables: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Quotes</Label>
                      <p className="text-sm text-slate-500">If appropriate, we'll include quotes/tips/recommendations in your article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.formattingQuotes !== undefined ? editingItem.overrides.formattingQuotes : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingQuotes: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Lists</Label>
                      <p className="text-sm text-slate-500">If appropriate, we'll include bulleted or numbered lists in your article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.formattingLists !== undefined ? editingItem.overrides.formattingLists : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingLists: checked}} : null)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Heading letter case</Label>
                    <Select 
                      value={editingItem?.overrides?.headingCase || "title"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), headingCase: val}} : null)}>
                      <SelectTrigger className="py-6 rounded-xl text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Title Case</SelectItem>
                        <SelectItem value="sentence">Sentence case</SelectItem>
                        <SelectItem value="lower">lower case</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">
                      Change option to see how it affects the example:<br/>
                      How to Build a Website for Your Small Business in New York
                    </p>
                  </div>
                </div>
                )}

                {/* Outline Section (Overrides) */}
                {activeModalTab === 'outline' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start space-x-3">
                    <div className="bg-purple-600 rounded-full p-1 text-white shrink-0 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Customize your article structure</Label>
                        <Button variant="ghost" onClick={() => alert('Generative feature is coming soon!')} className="text-purple-600 font-semibold h-auto p-0 hover:bg-transparent hover:text-purple-700">
                          <Sparkles className="w-4 h-4 mr-2"/> Generate Outline
                        </Button>
                      </div>
                      <p className="text-sm text-slate-500">If you leave this blank, the AI will automatically generate an outline later.</p>
                    </div>
                  </div>
                  
                  <InlineTagInput 
                    tags={editingItem?.overrides?.outline || []} 
                    setTags={(tags) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), outline: tags}} : null)} 
                    placeholder="Type a heading and hit Enter" 
                    buttonText="Add Heading"
                    maxTags={20}
                  />
                </div>
                )}

                {/* Knowledge Section (Overrides) */}
                {activeModalTab === 'knowledge' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div 
                    onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), knowledgeMode: 'web'}} : null)}
                    className={`border rounded-2xl p-6 flex items-start space-x-4 cursor-pointer ${editingItem?.overrides?.knowledgeMode === 'web' || !editingItem?.overrides?.knowledgeMode ? 'border-purple-600 bg-purple-50/10' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="pt-1">
                      <div className={`w-5 h-5 rounded-full ${editingItem?.overrides?.knowledgeMode === 'web' || !editingItem?.overrides?.knowledgeMode ? 'border-4 border-purple-600' : 'border border-slate-300'} bg-white`}></div>
                    </div>
                    <div>
                      <Label className="text-base font-medium cursor-pointer">Connect to Web</Label>
                      <p className="text-sm text-slate-500 mt-1">We'll search on Google for similar topics to generate up-to-date content.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), knowledgeMode: 'base'}} : null)}
                    className={`border rounded-2xl p-6 flex flex-col space-y-4 cursor-pointer ${editingItem?.overrides?.knowledgeMode === 'base' ? 'border-purple-600 bg-purple-50/10' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-start space-x-4">
                      <div className="pt-1">
                        <div className={`w-5 h-5 rounded-full ${editingItem?.overrides?.knowledgeMode === 'base' ? 'border-4 border-purple-600' : 'border border-slate-300'} bg-white`}></div>
                      </div>
                      <div>
                        <Label className="text-base font-medium cursor-pointer">Use Knowledge Base</Label>
                        <p className="text-sm text-slate-500 mt-1">We'll generate content inspired by the knowledge base's assets.</p>
                      </div>
                    </div>
                    <div className="pl-9 w-full">
                      <Select disabled>
                        <SelectTrigger className="py-6 rounded-xl text-base text-slate-400 bg-slate-50"><SelectValue placeholder="Coming soon!" /></SelectTrigger>
                        <SelectContent>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div 
                    onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), knowledgeMode: 'none'}} : null)}
                    className={`border rounded-2xl p-6 flex items-start space-x-4 cursor-pointer ${editingItem?.overrides?.knowledgeMode === 'none' ? 'border-purple-600 bg-purple-50/10' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="pt-1">
                      <div className={`w-5 h-5 rounded-full ${editingItem?.overrides?.knowledgeMode === 'none' ? 'border-4 border-purple-600' : 'border border-slate-300'} bg-white`}></div>
                    </div>
                    <div>
                      <Label className="text-base font-medium cursor-pointer">No Extra Knowledge</Label>
                      <p className="text-sm text-slate-500 mt-1">We'll not provide the AI with any external knowledge.</p>
                    </div>
                  </div>
                </div>
                )}

                {/* Structure Section */}
                {activeModalTab === 'structure' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Call-To-Action</Label>
                    <Input 
                      placeholder="https://mywebsite.com/" 
                      value={editingItem?.overrides?.cta || ''}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), cta: e.target.value}} : null)}
                      className="text-base py-6 rounded-xl"
                    />
                    <p className="text-sm text-slate-500">We'll add an extra h3 to your articles with a call-to-action to this URL. Leave blank to opt-out.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Key Takeaways</Label>
                      <p className="text-sm text-slate-500">We'll add this section at the start of each article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.keyTakeaways !== undefined ? editingItem.overrides.keyTakeaways : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), keyTakeaways: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Conclusion</Label>
                      <p className="text-sm text-slate-500">We'll add this section at the end of each article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.conclusion !== undefined ? editingItem.overrides.conclusion : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), conclusion: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">FAQs</Label>
                      <p className="text-sm text-slate-500">We'll add this section at the end of each article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.faqs !== undefined ? editingItem.overrides.faqs : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), faqs: checked}} : null)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Article Size</Label>
                    <Select 
                      value={editingItem?.overrides?.articleSize || "medium"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), articleSize: val}} : null)}>
                      <SelectTrigger className="py-6 rounded-xl text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (3-5 headings)</SelectItem>
                        <SelectItem value="medium">Medium (5-8 headings)</SelectItem>
                        <SelectItem value="large">Large (8+ headings)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                )}

                {/* Internal Linking Section */}
                {activeModalTab === 'internal-linking' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Sitemaps <span className="text-slate-400 font-normal">(Optional)</span></Label>
                      <Button variant="ghost" onClick={() => alert('Sitemap crawl feature is coming soon!')} className="text-purple-600 font-semibold h-auto p-0 hover:bg-transparent hover:text-purple-700">
                        <SearchCode className="w-4 h-4 mr-2"/> Find Sitemap
                      </Button>
                    </div>
                    <DynamicInputList 
                      items={editingItem?.overrides?.sitemaps || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), sitemaps: items}} : null)} 
                      placeholder="https://example.com/sitemap.xml" 
                      buttonText="Add Sitemap"
                    />
                    <p className="text-sm text-slate-500 pt-2">Add sitemaps to include internal links from your website.<br/>Use commas , to include multiple patterns.</p>
                    <p className="text-sm text-purple-600 underline cursor-pointer pt-2" onClick={() => alert('Test & Preview Links feature is coming soon!')}>Test & Preview Links</p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Links per H2</Label>
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{editingItem?.overrides?.linksPerH2 !== undefined ? editingItem.overrides.linksPerH2 : 2} Links</span>
                    </div>
                    <div className="pt-2 pb-2">
                       <Slider 
                        value={[editingItem?.overrides?.linksPerH2 !== undefined ? editingItem.overrides.linksPerH2 : 2]} 
                        onValueChange={(val: any) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), linksPerH2: val[0]}} : null)}
                        max={5} min={0} step={1} 
                        className="[&_[role=slider]]:bg-purple-600 [&_[role=slider]]:border-purple-600 [&_.bg-primary]:bg-purple-600"
                      />
                    </div>
                    <p className="text-sm text-slate-500">Links will be balanced between Internal Links and External Links.</p>
                  </div>
                </div>
                )}

                {/* External Linking Section */}
                {activeModalTab === 'external-linking' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Include Links</Label>
                    <DynamicInputList 
                      items={editingItem?.overrides?.includeLinks || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), includeLinks: items}} : null)} 
                      placeholder="https://example.com" 
                      buttonText="Add Link"
                    />
                    <p className="text-sm text-slate-500">We'll include these exact links in the article.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Automatic External Links</Label>
                      <p className="text-sm text-slate-500">We'll scrape the internet for relevant articles in your niche & language.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.autoExternalLinks !== undefined ? editingItem.overrides.autoExternalLinks : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), autoExternalLinks: checked}} : null)}
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-base font-medium">Include External Sources</Label>
                    <DynamicInputList 
                      items={editingItem?.overrides?.includeSources || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), includeSources: items}} : null)} 
                      placeholder="example.com" 
                      buttonText="Add Website"
                    />
                    <p className="text-sm text-slate-500">ONLY links from these websites will be included. Leave blank to include ALL websites.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-base font-medium">Exclude External Sources</Label>
                    <DynamicInputList 
                      items={editingItem?.overrides?.excludeSources || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), excludeSources: items}} : null)} 
                      placeholder="competitor.com" 
                      buttonText="Add Website"
                    />
                    <p className="text-sm text-slate-500">No links will be placed from these websites.</p>
                  </div>
                </div>
                )}

                {/* Videos Section */}
                {activeModalTab === 'videos' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Automate Youtube Videos</Label>
                      <p className="text-sm text-slate-500">We'll automatically find and include relevant YouTube videos.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.autoYoutube !== undefined ? editingItem.overrides.autoYoutube : false}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), autoYoutube: checked}} : null)}
                    />
                  </div>
                </div>
                )}

                {/* Images Section (Overrides) */}
                {activeModalTab === 'images' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Featured Image</Label>
                      <p className="text-sm text-slate-500">Enable to add a featured image to your article.</p>
                    </div>
                    <Switch 
                      checked={editingItem?.overrides?.coverToggle !== undefined ? editingItem.overrides.coverToggle : coverToggle} 
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), coverToggle: checked}} : null)} 
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-base font-medium">Image Provider</Label>
                    <Select 
                      value={editingItem?.overrides?.imageProvider || "ai_1"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageProvider: val}} : null)}>
                      <SelectTrigger className="py-6 rounded-xl text-base"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai_1">AI images (1 credits per image)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">Use AI images for best results. All images will include an alt text.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start space-x-3">
                    <div className="bg-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <span className="text-xs font-bold leading-none">i</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-base font-medium text-slate-900 block">Premium AI images available</Label>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        In order to turn on premium AI images, please go to your account settings. They're 5x as expensive, but the quality is much better.
                      </p>
                      <p className="text-sm text-purple-600 font-medium underline cursor-pointer pt-1">Go to account settings →</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Number of In-Article Images</Label>
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{editingItem?.overrides?.inlineCount !== undefined ? editingItem.overrides.inlineCount : inlineCount[0]} ภาพ</span>
                    </div>
                    <div className="pt-2 pb-2">
                      <Slider 
                        value={[editingItem?.overrides?.inlineCount !== undefined ? editingItem.overrides.inlineCount : inlineCount[0]]} 
                        onValueChange={(val: any) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), inlineCount: val[0]}} : null)} 
                        max={5} min={0} step={1} 
                        className="py-2 [&_[role=slider]]:bg-purple-600 [&_[role=slider]]:border-purple-600 [&_.bg-primary]:bg-purple-600" 
                      />
                    </div>
                    <p className="text-sm text-slate-500">We'll sprinkle the images through-out the article.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-base font-medium">Extra Custom Styling</Label>
                    <Input 
                      placeholder="photographic image" 
                      value={editingItem?.overrides?.imageStyle || ""}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageStyle: e.target.value}} : null)}
                      className="text-base py-6 rounded-xl"
                    />
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-slate-500">Examples:</span>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md cursor-pointer hover:bg-slate-200" onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageStyle: "black and white"}} : null)}>black and white</span>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md cursor-pointer hover:bg-slate-200" onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageStyle: "illustrative"}} : null)}>illustrative</span>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md cursor-pointer hover:bg-slate-200" onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageStyle: "anime"}} : null)}>anime</span>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-white sm:justify-between items-center">
            <Button variant="outline" onClick={revertToTemplate}>Revert to Template</Button>
            <div className="space-x-2">
              <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={saveOverrides}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Generated Article Modal */}
      <Dialog open={articleModalOpen} onOpenChange={setArticleModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl sm:max-w-4xl md:w-[90vw] h-[85vh] flex flex-col pt-8 pb-4">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
            <DialogTitle className="text-xl">ผลลัพธ์บทความ: {generatedArticle?.title}</DialogTitle>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={() => navigate(`/article/${generatedArticle?.id}`)} className="text-slate-400 hover:text-slate-900">
                  <ExternalLink className="w-5 h-5" />
               </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 p-8 border border-slate-200 rounded-lg bg-white shadow-inner" id="preview-article-content">
            <div className="markdown-body max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  img: MarkdownImage
                }}
              >
                {generatedArticle?.markdown || ''}
              </ReactMarkdown>
            </div>
          </div>
          <DialogFooter className="mt-4 sm:justify-between items-center">
            <span className="text-xs text-slate-500">* ข้อมูลนี้สามารถตั้งค่าให้เซฟลงฐานข้อมูลหรืออัปโหลดขึ้นเว็บอัตโนมัติได้ภายหลัง</span>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setArticleModalOpen(false)}>ปิด</Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white inline-flex items-center gap-2" onClick={() => navigate(`/article/${generatedArticle?.id}`)}>
                Open <ExternalLink className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="hidden sm:inline-flex" onClick={() => {
                const el = document.getElementById('preview-article-content');
                if (el) {
                  const range = document.createRange();
                  range.selectNodeContents(el);
                  const sel = window.getSelection();
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                  document.execCommand('copy');
                  sel?.removeAllRanges();
                  alert('✅ คัดลอกเนื้อหาแบบจัดรูปแบบ (Rich Text) พร้อมรูปภาพลง Clipboard เรียบร้อยแล้ว สามารถนำไปวางใน Word หรือ Notion ได้เลยครับ');
                } else {
                  alert('ไม่พบเนื้อหา');
                }
              }}>
                คัดลอกลง Word / Notion (รูป+จัดรูปแบบ)
              </Button>
              <Button variant="outline" className="hidden sm:inline-flex" onClick={() => {
                navigator.clipboard.writeText(generatedArticle?.markdown || '');
                alert('คัดลอกลง Clipboard แล้ว');
              }}>
                คัดลอกออริจินัล Markdown
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
