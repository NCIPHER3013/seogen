// Replace all of App default export with CampaignSetup default export + wrap Link to dashboard logic
import React, { useState, useEffect } from 'react';
import { 
  Settings2, FileText, Image as ImageIcon, Link as LinkIcon, 
  ChevronRight, LayoutDashboard, Feather, Sparkles, Plus, X, User,
  Search, PlaySquare, Video, SearchCode, Edit3, Trash2, Loader2,
  AlignLeft, List, BookOpen, Type, Layout, ExternalLink,
  MoreHorizontal, Eye, Send, Newspaper, Youtube, Menu,
  Users, BarChart3, UploadCloud, CheckCircle2, Hash
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
import AppLayout from '@/components/AppLayout';
import { generateArticle } from '@/services/ai';
import { saveArticle, fetchUserArticles } from '@/lib/articles';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
  customReplacements?: string;
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
          <Badge key={tag} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors shadow-none">
            {tag}
            <X className="w-3 h-3 cursor-pointer text-emerald-400 hover:text-emerald-600" onClick={() => removeTag(tag)} />
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length >= 5 ? "จำกัดคีย์เวิร์ดสูงสุดแล้ว" : placeholder}
        disabled={tags.length >= 5}
        className="bg-white border-slate-100 rounded-lg focus-visible:ring-emerald-500"
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
          <div key={`${tag}-${idx}`} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg group hover:bg-slate-200 transition-colors">
            <span className="text-sm text-slate-700 font-medium">{tag}</span>
            <X className="w-4 h-4 cursor-pointer text-slate-500 hover:text-red-500" onClick={() => removeTag(tag)} />
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
          className="bg-emerald-600 hover:bg-emerald-700 text-slate-900 rounded-xl px-6 h-12"
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
          className="flex items-center text-emerald-600 font-semibold cursor-pointer pt-1 hover:underline underline-offset-2 w-max"
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Automatic Seeding Logic for empty state
  useEffect(() => {
    if (!user) return; // Wait until auth state is loaded

    // ONLY seed the forklift undercarriage campaign if logged in as kaojaonew@gmail.com
    if (user.email === 'kaojaonew@gmail.com') {
      const isSeeded = localStorage.getItem('campaign_forklift_under_seeded');

      if (!isSeeded) {
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
        localStorage.setItem('campaign_forklift_under_seeded', 'true');
      }

      const isVacuumSeeded = localStorage.getItem('campaign_vacuum_seeded');
      if (!isVacuumSeeded) {
        const dataToImport = [
          { keyword: "เครื่องซีลสูญญากาศสำหรับอาหาร", title: "เครื่องซีลสูญญากาศสำหรับอาหาร ยืดอายุได้จริงแค่ไหน" },
          { keyword: "เครื่องซีลสูญญากาศยืดอายุอาหารได้จริงไหม", title: "เครื่องซีลสูญญากาศยืดอายุอาหารได้จริงไหม หลักการทางวิทยาศาสตร์" },
          { keyword: "อาหารที่เหมาะซีลสูญญากาศ", title: "อาหารที่เหมาะซีลสูญญากาศ มีอะไรบ้าง" },
          { keyword: "อาหารที่ห้ามซีลสูญญากาศ", title: "อาหารที่ห้ามซีลสูญญากาศ อันตรายถ้าทำผิด" },
          { keyword: "เครื่องซีลสูญญากาศใช้กับผักผลไม้เพื่อยืดความสดได้ไหม", title: "เครื่องซีลสูญญากาศใช้กับผักผลไม้เพื่อยืดความสดได้ไหม" },
          { keyword: "เครื่องซีลสูญญากาศอาหารแห้ง", title: "เครื่องซีลสูญญากาศอาหารแห้ง กรอบได้นานแค่ไหน" },
          { keyword: "เครื่องซีลสูญญากาศอาหารแช่แข็ง", title: "เครื่องซีลสูญญากาศอาหารแช่แข็งกับการป้องกัน Freezer Burn" },
          { keyword: "เครื่องซีลสูญญากาศสำหรับร้านอาหาร", title: "เครื่องซีลสูญญากาศสำหรับร้านอาหารการเพิ่มประสิทธิภาพครัว" },
          { keyword: "เครื่องซีลสูญญากาศโรงงานอาหาร", title: "เครื่องซีลสูญญากาศโรงงานอาหาร มาตรฐาน GMP" },
          { keyword: "เครื่องซีลสูญญากาศ Sous Vide", title: "เครื่องซีลสูญญากาศ Sous Vide ใช้ร่วมกันอย่างไร" }
        ];
        const newItems = dataToImport.map((item, index) => {
          const base = {
            id: 'vacuum-auto-' + Date.now() + '-' + index,
            keyword: item.keyword,
            title: item.title,
            language: 'thai'
          };
          if (index > 0) {
            return {
              ...base,
              overrides: {
                secondaryKeywords: ["เครื่องซีลสูญญากาศสำหรับอาหาร"],
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

        const saved = localStorage.getItem('campaign_inputs');
        let current = [];
        if (saved) {
          try {
            current = JSON.parse(saved);
          } catch (e) {}
        }
        const existingKeywords = new Set(current.map((c) => c.keyword));
        const nonDuplicateNewItems = newItems.filter(item => !existingKeywords.has(item.keyword));
        const updated = [...current, ...nonDuplicateNewItems];

        setInputs(updated);
        localStorage.setItem('campaign_inputs', JSON.stringify(updated));
        localStorage.setItem('campaign_vacuum_seeded', 'true');
      }

      const isVacuumLv2ForcedSeeded = localStorage.getItem('campaign_vacuum_lv2_forced_seeded');
      if (!isVacuumLv2ForcedSeeded) {
        const dataToImport = [
          { keyword: "เครื่องซีลสูญญากาศยืดอายุอาหารได้จริงไหม", title: "เครื่องซีลสูญญากาศยืดอายุอาหารได้จริงไหม หลักการทางวิทยาศาสตร์" },
          { keyword: "อาหารที่เหมาะซีลสูญญากาศ", title: "อาหารที่เหมาะซีลสูญญากาศ มีอะไรบ้าง" },
          { keyword: "อาหารที่ห้ามซีลสูญญากาศ", title: "อาหารที่ห้ามซีลสูญญากาศ อันตรายถ้าทำผิด" },
          { keyword: "เครื่องซีลสูญญากาศใช้กับผักผลไม้เพื่อยืดความสดได้ไหม", title: "เครื่องซีลสูญญากาศใช้กับผักผลไม้เพื่อยืดความสดได้ไหม" },
          { keyword: "เครื่องซีลสูญญากาศอาหารแห้ง", title: "เครื่องซีลสูญญากาศอาหารแห้ง กรอบได้นานแค่ไหน" },
          { keyword: "เครื่องซีลสูญญากาศอาหารแช่แข็ง", title: "เครื่องซีลสูญญากาศอาหารแช่แข็งกับการป้องกัน Freezer Burn" },
          { keyword: "เครื่องซีลสูญญากาศสำหรับร้านอาหาร", title: "เครื่องซีลสูญญากาศสำหรับร้านอาหารการเพิ่มประสิทธิภาพครัว" },
          { keyword: "เครื่องซีลสูญญากาศโรงงานอาหาร", title: "เครื่องซีลสูญญากาศโรงงานอาหาร มาตรฐาน GMP" },
          { keyword: "เครื่องซีลสูญญากาศ Sous Vide", title: "เครื่องซีลสูญญากาศ Sous Vide ใช้ร่วมกันอย่างไร" }
        ];
        const newItems = dataToImport.map((item, index) => {
          return {
            id: 'vacuum-lv2-force-' + Date.now() + '-' + index,
            keyword: item.keyword,
            title: item.title,
            language: 'thai',
            overrides: {
              secondaryKeywords: ["เครื่องซีลสูญญากาศสำหรับอาหาร"],
              language: "thai",
              targetCountry: "thailand",
              tone: "professional",
              pov: "third",
              formality: "formal",
              autoExternalLinks: false
            }
          };
        });

        const saved = localStorage.getItem('campaign_inputs');
        let current = [];
        if (saved) {
          try {
            current = JSON.parse(saved);
          } catch (e) {}
        }
        const existingKeywords = new Set(current.map((c) => c.keyword));
        const nonDuplicateNewItems = newItems.filter(item => !existingKeywords.has(item.keyword));
        const updated = [...current, ...nonDuplicateNewItems];

        setInputs(updated);
        localStorage.setItem('campaign_inputs', JSON.stringify(updated));
        localStorage.setItem('campaign_vacuum_lv2_forced_seeded', 'true');
      }
    }

    const isSafetySeeded = localStorage.getItem('campaign_safetyForklift_seeded');
    if (!isSafetySeeded) {
      const safetyData = [
        { keyword: "อุปกรณ์ความปลอดภัยของรถโฟล์คลิฟท์", title: "อุปกรณ์ความปลอดภัยของรถโฟล์คลิฟท์ ต้องมีอะไรบ้าง", level: 1 },
        { keyword: "พนักพิงโหลดของรถโฟล์คลิฟท์", title: "พนักพิงโหลดของรถโฟล์คลิฟท์กับมาตรฐานและความสำคัญ", level: 2 },
        { keyword: "หลังคาป้องกันรถโฟล์คลิฟท์ Overhead Guard", title: "หลังคาป้องกันรถโฟล์คลิฟท์ Overhead Guard คืออะไร", level: 2 },
        { keyword: "ไฟเตือนและสัญญาณเสียงรถโฟล์คลิฟท์", title: "ไฟเตือนและสัญญาณเสียงรถโฟล์คลิฟท์ตามที่กฎหมายกำหนด", level: 2 },
        { keyword: "ระบบเบรคฉุกเฉินรถโฟล์คลิฟท์", title: "ระบบเบรคฉุกเฉินรถโฟล์คลิฟท์นั้นทำงานอย่างไร", level: 2 },
        { keyword: "กระจกมองหลังของรถโฟล์คลิฟท์", title: "กระจกมองหลังของรถโฟล์คลิฟท์ จำเป็นไหมในทุกสภาพงาน", level: 2 }
      ];
      
      const newItems = safetyData.map(item => ({
        id: 'safety-' + Math.random().toString(36).substr(2, 9),
        keyword: item.keyword,
        title: item.title,
        language: 'thai',
        overrides: {
          secondaryKeywords: ["อุปกรณ์ความปลอดภัยของรถโฟล์คลิฟท์"],
          language: "thai",
          targetCountry: "thailand",
          tone: "professional",
          pov: "third",
          formality: "formal",
          autoExternalLinks: false
        }
      }));

      const saved = localStorage.getItem('campaign_inputs');
      let current: any[] = [];
      if (saved) {
        try { current = JSON.parse(saved); } catch (e) {}
      }
      const existingKeywords = new Set(current.map((c) => c.keyword));
      const nonDuplicateNewItems = newItems.filter(item => !existingKeywords.has(item.keyword));
      const updated = [...current, ...nonDuplicateNewItems];

      setInputs(updated);
      localStorage.setItem('campaign_inputs', JSON.stringify(updated));
      localStorage.setItem('campaign_safetyForklift_seeded', 'true');
    }

    const isSafetyPillarForcedSeeded = localStorage.getItem('campaign_safetyPillar_forced_seeded_v2');
    if (!isSafetyPillarForcedSeeded) {
      const kw = "อุปกรณ์ความปลอดภัยของรถโฟล์คลิฟท์ ต้องมีอะไรบ้าง";
      const newItem = {
        id: 'safety-pillar-' + Math.random().toString(36).substr(2, 9),
        keyword: kw,
        title: kw,
        language: 'thai',
        overrides: {
          secondaryKeywords: ["อุปกรณ์ความปลอดภัยของรถโฟล์คลิฟท์"],
          language: "thai",
          targetCountry: "thailand",
          tone: "professional",
          pov: "third",
          formality: "formal",
          autoExternalLinks: false
        }
      };
      const saved = localStorage.getItem('campaign_inputs');
      let current: any[] = [];
      if (saved) {
        try { current = JSON.parse(saved); } catch (e) {}
      }
      const updated = [...current, newItem];
      setInputs(updated);
      localStorage.setItem('campaign_inputs', JSON.stringify(updated));
      localStorage.setItem('campaign_safetyPillar_forced_seeded_v2', 'true');
    }

    const savedArticles = localStorage.getItem('campaign_config_generatedArticles');
    let hasArticles = false;
    if (savedArticles) {
      try {
        const parsed = JSON.parse(savedArticles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasArticles = true;
          
          // Migration to replace old watermarked images for forklift shaft article with new clean images
          let modified = false;
          const updatedArticles = parsed.map(article => {
            if (article.keyword === "เพลาและข้อต่อรถโฟล์คลิฟท์" || article.title === "เพลาและข้อต่อรถโฟล์คลิฟท์ควรตรวจสอบอย่างไร") {
              if (article.content.includes('/shaft_image_0.jpg')) {
                return article; // already migrated
              }
              const imgPattern = /gemini_img_\w+/g;
              const matches = article.content.match(imgPattern) || [];
              let content = article.content;
              for (let i = 0; i < Math.min(matches.length, 4); i++) {
                content = content.replace(matches[i], `/shaft_image_${i}.jpg`);
              }
              modified = true;
              return { ...article, content };
            }
            return article;
          });
          if (modified) {
            localStorage.setItem('campaign_config_generatedArticles', JSON.stringify(updatedArticles));
            setTimeout(() => {
              setGeneratedArticles(updatedArticles);
            }, 100);
          }
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
  }, [user]);

  // Campaign Inputs State
  const [inputs, setInputs] = useState<ArticleItem[]>([]);

  // Load inputs when user is loaded
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`campaign_inputs_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInputs(parsed);
          } else {
            setInputs([]);
          }
        } catch (e) {
          setInputs([]);
        }
      } else {
        setInputs([]);
      }
    } else if (user === null) {
      setInputs([]);
    }
  }, [user]);

  // Save inputs when they change
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`campaign_inputs_${user.id}`, JSON.stringify(inputs));
      } catch(e) {}
    }
  }, [inputs, user]);
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
    const [state, setState] = useState<T>(initialValue);
    const isFirstRender = React.useRef(true);

    useEffect(() => {
      if (user?.id) {
        let saved = localStorage.getItem(`campaign_config_${user.id}_${key}`);
        
        if (saved !== null) {
          try {
            let parsed: any = JSON.parse(saved);
            
            // Migration: แก้ค่า URL เก่าที่ผิดอัตโนมัติ
            if (typeof parsed === 'string') {
              if (parsed.includes('SeoCipher') || parsed.includes('seocipher')) {
                console.warn(`[Migration] Fixing broken baseUrl for ${key}: ${parsed}`);
                parsed = 'https://api.z.ai/api/coding/paas/v4';
              }
              if (parsed.includes('bytepluses.com/api/v3/images/generations')) {
                console.warn(`[Migration] Fixing image baseUrl for ${key}: ${parsed}`);
                parsed = 'https://ark.ap-southeast.bytepluses.com/api/v3';
              }
            }
            if (Array.isArray(parsed) ? parsed.length > 0 : (parsed !== null && parsed !== '')) {
              setState(parsed);
            } else {
              setState(initialValue);
            }
          } catch (e) {
            setState(initialValue);
          }
        } else {
          setState(initialValue);
        }
      } else if (user === null) {
        setState(initialValue);
      }
    }, [user?.id, key]);

    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (user?.id) {
        try {
          localStorage.setItem(`campaign_config_${user.id}_${key}`, JSON.stringify(state));
        } catch (error) {
          console.warn('Failed to save to localStorage:', error);
        }
      }
    }, [key, state, user?.id]);

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
  const [customApiKey, setCustomApiKey] = usePersistentState('customApiKey', '');
  const [customOpenAiApiKey, setCustomOpenAiApiKey] = usePersistentState('customOpenAiApiKey', '');
  const [textApiModel, setTextApiModel] = usePersistentState('textApiModel', 'deepseek-v4-flash-260425');
  const [textApiBaseUrl, setTextApiBaseUrl] = usePersistentState('textApiBaseUrl', 'https://ark.ap-southeast.bytepluses.com/api/v3');
  const [textApiPrompt, setTextApiPrompt] = usePersistentState('textApiPrompt', '');
  const [imageApiModel, setImageApiModel] = usePersistentState('imageApiModel', 'seedream-4-0-250828');
  const [imageApiBaseUrl, setImageApiBaseUrl] = usePersistentState('imageApiBaseUrl', 'https://ark.ap-southeast.bytepluses.com/api/v3');
  const [imageApiPrompt, setImageApiPrompt] = usePersistentState('imageApiPrompt', '');
  const [customReplacements, setCustomReplacements] = usePersistentState('customReplacements', '');

  const [isTestingText, setIsTestingText] = useState(false);
  const [testTextStatus, setTestTextStatus] = useState<{success: boolean, message: string} | null>(null);
  
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [testImageStatus, setTestImageStatus] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    // ล้าง API key เก่าที่ค้างใน localStorage (บังคับใช้ global settings จาก admin แล้ว)
    // ทำครั้งเดียวตอน mount เพื่อเคลียร์ค่า key จริงที่เคยเก็บไว้
    try {
      ['customApiKey', 'customOpenAiApiKey'].forEach(k => {
        const v = localStorage.getItem(k);
        if (v && v !== '""' && v !== 'null') {
          localStorage.removeItem(k);
        }
      });
    } catch (e) { /* ignore */ }

    // ล้าง temp articles ทั้งหมดที่ค้างใน localStorage — เก็บเฉพาะบทความที่บันทึกลง DB แล้ว (id เป็น UUID)
    // เหตุผล: temp article ทั้งหมดจะถูกบันทึกลง DB เมื่อ generate เสร็จ ดังนั้นลบ temp ที่ค้างได้เลย
    // นี่จะแก้ปัญหา duplicate key อย่างเด็ดขาด
    try {
      const raw = localStorage.getItem('generatedArticles');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          // เก็บเฉพาะ article ที่ไม่ใช่ temp_* (คือบทความที่บันทึกลง DB แล้ว id เป็น UUID)
          const cleaned = arr.filter((a: any) => {
            if (!a || typeof a !== 'object') return false;
            if (a.id && typeof a.id === 'string' && a.id.startsWith('temp_')) {
              return false; // ลบ temp ทั้งหมด
            }
            return true;
          });
          // Dedup โดย id
          const seen = new Set<string>();
          const deduped = cleaned.filter((a: any) => {
            if (!a.id) return false;
            if (seen.has(a.id)) return false;
            seen.add(a.id);
            return true;
          });
          if (deduped.length !== arr.length) {
            localStorage.setItem('generatedArticles', JSON.stringify(deduped));
            setGeneratedArticles(deduped);
          }
        }
      }
    } catch (e) { /* ignore */ }

    // Migrate model/baseUrl ให้เป็น DeepSeek + ByteDance Ark (ค่าเริ่มต้นของระบบ)
    if (!textApiModel || textApiModel === 'auto' || textApiModel === 'GLM-5-Turbo' || textApiModel === 'glm-5-turbo' || textApiModel === 'glm-4.5') {
      setTextApiModel('deepseek-v4-flash-260425');
    }
    if (!textApiBaseUrl || textApiBaseUrl === 'https://open.bigmodel.cn/api/paas/v4' || textApiBaseUrl === 'https://api.z.ai/api/coding/paas/v4' || textApiBaseUrl.includes('SeoCipher') || textApiBaseUrl.includes('seocipher')) {
      setTextApiBaseUrl('https://ark.ap-southeast.bytepluses.com/api/v3');
    }
    if (!imageApiModel || imageApiModel === 'auto') {
      setImageApiModel('seedream-4-0-250828');
    }
    if (!imageApiBaseUrl || imageApiBaseUrl.includes('/images/generations')) {
      setImageApiBaseUrl('https://ark.ap-southeast.bytepluses.com/api/v3');
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

  // Fetch from Supabase on mount to merge with local storage
  useEffect(() => {
    async function loadDbArticles() {
      try {
        const dbArticles = await fetchUserArticles();
        if (dbArticles && dbArticles.length > 0) {
          const mappedArticles = dbArticles.map(a => ({
            id: a.id,
            title: a.title,
            keyword: a.keyword || a.title,
            language: a.language || 'English (US)',
            content: a.content,
            date: new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
          }));
          
          setGeneratedArticles(prev => {
             const merged = [...prev];
             mappedArticles.forEach(dbA => {
                const existingIdx = merged.findIndex(p => p.id === dbA.id);
                if (existingIdx === -1) {
                  merged.push(dbA);
                } else {
                  // Update existing item with latest data from DB
                  merged[existingIdx] = dbA;
                }
             });
             // Sort by date descending roughly
             return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
        }
      } catch (e) {
        console.error('Failed to load DB articles:', e);
      }
    }
    loadDbArticles();
  }, []);

  // Generation State
  const [activeTab, setActiveTab] = useState("inputs");
  const [generatingQueue, setGeneratingQueue] = usePersistentState<ArticleItem[]>('generatingQueue', []);
  const [generatedArticle, setGeneratedArticle] = useState<{id: string, title: string, markdown: string, content?: string, keyword?: string, language?: string} | null>(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);


  // === Concurrent Article Generation ===
  const MAX_CONCURRENT_ARTICLES = 10;
  const activeWorkersRef = React.useRef(new Set<string>());
  const cancelledWorkersRef = React.useRef(new Set<string>());
  const [activeWorkerIds, setActiveWorkerIds] = React.useState<Set<string>>(new Set());
  const updateActiveWorkers = (add: boolean, id: string) => {
    activeWorkersRef.current[add ? 'add' : 'delete'](id);
    setActiveWorkerIds(new Set(activeWorkersRef.current));
  };

  // Refs สำหรับเก็บ config ล่าสุด เพื่อให้ worker อ่านค่าได้ตลอดโดยไม่เกิด closure stale
  const configRef = React.useRef({
    language, tone, copywritingFramework, pov, lengthWords, audience,
    secondaryKeywords, coverToggle, inlineCount, aspectRatio, sitemaps,
    internalLinks, customApiKey, customOpenAiApiKey, textApiModel,
    textApiBaseUrl, textApiPrompt, imageApiModel, imageApiBaseUrl, imageApiPrompt
  });
  
  configRef.current = {
    language, tone, copywritingFramework, pov, lengthWords, audience,
    secondaryKeywords, coverToggle, inlineCount, aspectRatio, sitemaps,
    internalLinks, customApiKey, customOpenAiApiKey, textApiModel,
    textApiBaseUrl, textApiPrompt, imageApiModel, imageApiBaseUrl, imageApiPrompt
  };

  const processItem = React.useCallback((input: ArticleItem) => {
    if (activeWorkersRef.current.has(input.id)) return;
    updateActiveWorkers(true, input.id);
    
    console.log(`[Worker] Start: ${input.keyword} (active: ${activeWorkersRef.current.size})`);
    
    (async () => {
      try {
        const cfg = configRef.current;
        // Merge global configuration with row-specific overrides
        const activeConfig = {
          language: input.overrides?.language || cfg.language,
          tone: input.overrides?.tone || cfg.tone,
          copywritingFramework: input.overrides?.copywritingFramework || cfg.copywritingFramework,
          pov: input.overrides?.pov || cfg.pov,
          lengthWords: input.overrides?.lengthWords || cfg.lengthWords[0],
          audience: input.overrides?.audience || cfg.audience,
          secondaryKeywords: input.overrides?.secondaryKeywords || cfg.secondaryKeywords,
          coverToggle: input.overrides?.coverToggle !== undefined ? input.overrides.coverToggle : cfg.coverToggle,
          inlineCount: input.overrides?.inlineCount !== undefined ? input.overrides.inlineCount : cfg.inlineCount[0],
          aspectRatio: input.overrides?.aspectRatio || cfg.aspectRatio,
          outline: input.overrides?.outline,
          sitemaps: input.overrides?.sitemaps || cfg.sitemaps,
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
          customApiKey: cfg.customApiKey,
          customOpenAiApiKey: cfg.customOpenAiApiKey,
          textApiModel: cfg.textApiModel,
          textApiBaseUrl: cfg.textApiBaseUrl,
          textApiPrompt: cfg.textApiPrompt,
          imageApiModel: cfg.imageApiModel,
          imageApiBaseUrl: cfg.imageApiBaseUrl,
          imageApiPrompt: cfg.imageApiPrompt
        };

        const tempArticleId = `temp_${input.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const placeholderArticle = {
          id: tempArticleId,
          title: input.title || input.keyword,
          keyword: input.keyword,
          language: input.overrides?.language || cfg.language || 'English (US)',
          content: '...',
          date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
        };
        
        // Dedup ก่อน add: ลบ temp article เก่าที่มี id เดียวกันออกก่อน (กัน duplicate key)
        setGeneratedArticles(prev => {
          const filtered = prev.filter(a => a.id !== tempArticleId);
          return [placeholderArticle, ...filtered];
        });

        // Throttle onChunk เพื่อลด React re-render ระหว่าง concurrent streaming
        let latestPartialText = '';
        let throttleTimer: ReturnType<typeof setTimeout> | null = null;
        const throttledUpdate = () => {
          if (throttleTimer) return;
          throttleTimer = setTimeout(() => {
            throttleTimer = null;
            if (cancelledWorkersRef.current.has(input.id)) return;
            setGeneratedArticles(prev => {
              const idx = prev.findIndex(a => a.id === tempArticleId);
              if (idx >= 0 && latestPartialText) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], content: latestPartialText };
                return updated;
              }
              return prev;
            });
          }, 200);
        };

        const content = await generateArticle(input.keyword, input.title, activeConfig, (partialText) => {
          if (cancelledWorkersRef.current.has(input.id)) return;
          latestPartialText = partialText;
          throttledUpdate();
        });

        // Flush ข้อความสุดท้ายหลัง generate เสร็จ
        if (throttleTimer) { clearTimeout(throttleTimer); throttleTimer = null; }
        if (latestPartialText) {
          setGeneratedArticles(prev => {
            const idx = prev.findIndex(a => a.id === tempArticleId);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], content: latestPartialText };
              return updated;
            }
            return prev;
          });
        }

        if (cancelledWorkersRef.current.has(input.id)) {
          console.log(`[Worker] Cancelled: ${input.keyword}`);
          cancelledWorkersRef.current.delete(input.id);
          updateActiveWorkers(false, input.id);
          return;
        }

        if (!content || content.trim().length === 0) {
          throw new Error('AI ไม่ได้ส่งเนื้อหาบทความกลับมา');
        }

        const newArticle = {
          id: tempArticleId,
          title: input.title || input.keyword,
          keyword: input.keyword,
          language: input.overrides?.language || cfg.language || 'English (US)',
          content: content,
          date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
        };

        try {
          console.log(`[Worker] Saving article, content length: ${newArticle.content?.length || 0}`);
          const savedDbArticle = await saveArticle(newArticle.title, newArticle.content, 'Completed', undefined, newArticle.keyword, newArticle.language);
          if (savedDbArticle) {
            console.log(`[Worker] Saved to DB, returned content length: ${savedDbArticle.content?.length || 0}`);
            newArticle.id = savedDbArticle.id;
          } else {
            console.error(`[Worker] saveArticle returned null!`);
          }
        } catch (dbErr) {
          console.error('[Worker] Failed to save to Supabase', dbErr);
        }

        setGeneratedArticles(prev => {
          const filtered = prev.filter(a => a.id !== tempArticleId);
          return [newArticle, ...filtered];
        });

        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 rounded-full px-6 py-3 text-sm font-medium shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4';
        toast.innerHTML = `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> บทความ "${newArticle.title}" สร้างเสร็จแล้ว`;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.classList.add('fade-out', 'slide-out-to-bottom-4');
          setTimeout(() => toast.remove(), 300);
        }, 3000);

      } catch (err: any) {
        console.error('Generation failed:', err);
        // Restore input back to inputs list on failure
        setInputs(prev => {
          if (prev.some(i => i.id === input.id)) return prev;
          return [...prev, input];
        });
        
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-2xl z-[9999]';
        toast.innerHTML = `ข้อผิดพลาด: ${err.message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
      } finally {
        updateActiveWorkers(false, input.id);
        setGeneratingQueue(prev => prev.filter(a => a.id !== input.id));
      }
    })();
  }, [setGeneratedArticles, setGeneratingQueue, setInputs]);

  useEffect(() => {
    const idleItems = generatingQueue.filter(item => !activeWorkersRef.current.has(item.id));
    const slotsAvailable = Math.max(0, MAX_CONCURRENT_ARTICLES - activeWorkersRef.current.size);
    const toStart = idleItems.slice(0, slotsAvailable);
    toStart.forEach(item => processItem(item));
  }, [generatingQueue, processItem]);

  const startGenerating = (input: ArticleItem) => {
    // Only queue if not already queued
    if (generatingQueue.some(item => item.id === input.id)) return;
    
    setGeneratingQueue(prev => [...prev, input]);
    setInputs(prev => prev.filter(i => i.id !== input.id));
    setActiveTab("generations"); // Switch tab immediately
    
    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 rounded-full px-6 py-3 text-sm font-medium shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4';
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
      toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 rounded-full px-6 py-3 text-sm font-medium shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4';
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
    <AppLayout user={user}>
      <div className="flex-1 w-full bg-[#f8fafc] overflow-hidden min-h-[calc(100vh-4rem)]">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 lg:p-10 relative z-10 h-full hide-scrollbar">
          <div className="max-w-[1400px] mx-auto w-full space-y-6">
            
            {/* Header Bento Card */}
            <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-slate-100/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group hover:shadow-md transition-all duration-500">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/40 to-teal-50/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600 shadow-sm border border-emerald-100/50">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">แคมเปญอัตโนมัติ</h1>
                    <Badge variant="secondary" className="font-semibold text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200/50 shadow-sm">Default Campaign</Badge>
                  </div>
                  <p className="text-[15px] text-slate-500 font-medium flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    ระบบสแตนด์บายพร้อมทำงาน • อัปเดตล่าสุดเมื่อสักครู่
                  </p>
                </div>
                
                <div className="flex flex-wrap w-full md:w-auto gap-3 relative z-10">
                  <Button variant="outline" className="h-12 rounded-2xl bg-white/80 backdrop-blur-md border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all font-semibold px-5">
                    <FileText className="w-4 h-4 mr-2 text-slate-400" /> คู่มือการใช้งาน
                  </Button>
                  <Button variant="outline" className="h-12 rounded-2xl bg-white/80 backdrop-blur-md border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all font-semibold px-5">
                    <PlaySquare className="w-4 h-4 mr-2 text-slate-400" /> วิดีโอสอน
                  </Button>
                </div>
            </div>

            {/* Action Area Bento */}
            <div className="mb-6 flex flex-col md:flex-row items-center justify-between bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/60 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute -left-12 -top-12 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
              <div className="flex items-center gap-5 relative z-10 w-full md:w-auto mb-4 md:mb-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-inner">
                  <Search className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">คีย์เวิร์ดตั้งต้น</h3>
                  <p className="text-sm text-slate-500 font-medium">เพิ่มคีย์เวิร์ดเป้าหมายเพื่อสร้างบทความ SEO</p>
                </div>
              </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] px-8 h-14 font-bold flex items-center justify-center gap-2 relative z-10 hover:-translate-y-1 hover:scale-105 transition-all duration-300">
                  <Plus className="w-6 h-6" /> เพิ่มคีย์เวิร์ดเป้าหมาย
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] gap-0 !p-0 overflow-hidden bg-white/70 backdrop-blur-3xl border border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] rounded-[2.5rem]">
                  
                  <div className="p-10 pb-6 relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                      <h2 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 mb-2">เพิ่มคีย์เวิร์ด SEO</h2>
                      <p className="text-base font-medium text-slate-500">พิมพ์คีย์เวิร์ดที่คุณต้องการ หรืออัปโหลดไฟล์เพื่อให้ระบบจัดการให้</p>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="manual" className="w-full flex flex-col relative z-10">
                    <div className="px-10 pb-2">
                      <TabsList className="bg-slate-900/5 p-1.5 gap-2 rounded-[1.25rem] inline-flex w-full sm:w-auto shadow-inner">
                        <TabsTrigger value="manual" className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl py-3 px-8 font-bold text-slate-500 data-[state=active]:text-slate-900 transition-all duration-300">
                          กรอกเอง
                        </TabsTrigger>
                        <TabsTrigger value="import" className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl py-3 px-8 font-bold text-slate-500 data-[state=active]:text-slate-900 transition-all duration-300">
                          อัปโหลดไฟล์
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="manual" className="p-10 pt-4 m-0 border-none outline-none max-h-[50vh] overflow-y-auto hide-scrollbar">
                      <div className="space-y-5">
                        {pendingInputs.map((item, index) => (
                          <div key={item.id} className="flex gap-4 items-center group relative bg-white/50 hover:bg-white rounded-[1.5rem] p-2 pr-4 transition-all duration-300 shadow-sm border border-white hover:shadow-md">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 ml-2 shadow-inner">
                              <span className="text-emerald-700 font-bold text-sm">{index + 1}</span>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Input 
                                placeholder="คีย์เวิร์ดหลัก..." 
                                value={item.keyword}
                                onChange={(e) => handleFieldChange(item.id, 'keyword', e.target.value)}
                                className="h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 shadow-none font-bold text-lg text-slate-900 placeholder:text-slate-300 px-2"
                              />
                              <Input 
                                placeholder="หัวข้อบทความ (ไม่บังคับ)..." 
                                value={item.title}
                                onChange={(e) => handleFieldChange(item.id, 'title', e.target.value)}
                                className="h-14 rounded-2xl bg-transparent border-0 focus-visible:ring-0 shadow-none font-medium text-slate-500 placeholder:text-slate-300 px-2"
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-12 w-12 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shrink-0 opacity-0 group-hover:opacity-100" 
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
                          className="w-full text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 hover:text-emerald-700 h-16 font-extrabold rounded-[1.5rem] mt-4 transition-all border border-emerald-100 border-dashed"
                        >
                          <Plus className="w-6 h-6 mr-2" /> เพิ่มช่องคีย์เวิร์ด
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="import" className="p-10 pt-4 m-0">
                      <div className="flex flex-col items-center justify-center py-16 text-slate-500 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/40 hover:bg-white/80 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer group">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 mb-6 group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-300">
                          <UploadCloud className="w-10 h-10 text-emerald-500 group-hover:animate-bounce" />
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 mb-2">ลากไฟล์ CSV มาวางที่นี่</h4>
                        <p className="text-base font-medium text-slate-500">หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ</p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="px-10 py-6 m-0 border-t border-white/40 bg-white/60 backdrop-blur-xl flex justify-between items-center z-20 relative rounded-b-[2.5rem]">
                    <span className="text-sm font-bold text-slate-400">Total: {pendingInputs.filter(p => p.keyword.trim() !== '').length} keywords</span>
                    <div className="flex gap-4">
                      <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl font-bold hover:bg-slate-200/50 text-slate-500 px-8 h-14">ยกเลิก</Button>
                      <Button onClick={handleAddKeyword} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] font-bold px-10 h-14 transition-all hover:scale-105">สร้างบทความเลย</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Campaign Tabs */}
            <Tabs value={activeTab} onValueChange={(val) => {
              setActiveTab(val);
            }} className="w-full space-y-6">
              <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100/60 inline-flex w-full md:w-auto overflow-x-auto hide-scrollbar">
                <TabsList className="bg-transparent h-auto p-0 flex space-x-1 min-w-max">
                  <TabsTrigger value="inputs" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 rounded-xl py-2.5 px-4 font-semibold text-slate-500 hover:text-slate-800 transition-all data-[state=active]:shadow-sm">
                    คีย์เวิร์ด <Badge className="ml-2 bg-emerald-100/50 text-emerald-700 font-bold px-1.5 py-0 rounded-md border-0">{inputs.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="generations" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 rounded-xl py-2.5 px-4 font-semibold text-slate-500 hover:text-slate-800 transition-all data-[state=active]:shadow-sm">
                    ประวัติสร้าง <Badge className="ml-2 bg-emerald-100/50 text-emerald-700 font-bold px-1.5 py-0 rounded-md border-0">{generatedArticles.length + generatingQueue.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="publications" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 rounded-xl py-2.5 px-4 font-semibold text-slate-500 hover:text-slate-800 transition-all data-[state=active]:shadow-sm">
                    เผยแพร่ <Badge className="ml-2 bg-slate-100 text-slate-600 font-bold px-1.5 py-0 rounded-md border-0">0</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="configuration" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 rounded-xl py-2.5 px-4 font-semibold text-slate-500 hover:text-slate-800 transition-all data-[state=active]:shadow-sm">
                    การตั้งค่า
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab: Inputs */}
              <TabsContent value="inputs" className="outline-none">
                {selectedInputIds.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-900/50 rounded-xl p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-emerald-700 font-medium text-sm ml-2">เลือกแล้ว {selectedInputIds.length} รายการ</span>
                    <Button 
                      onClick={generateSelectedInputs}
                      className="bg-emerald-600 hover:bg-emerald-700 text-slate-900 font-medium shadow-lg shadow-slate-200/50 transition-all text-sm h-9 px-4 rounded-lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      สร้างบทความที่เลือก
                    </Button>
                  </div>
                )}
                
                {inputs.length > 0 && (
                  <div className="flex items-center justify-end mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (selectedInputIds.length === inputs.length) {
                          setSelectedInputIds([]);
                        } else {
                          setSelectedInputIds(inputs.map(i => i.id));
                        }
                      }}
                      className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 text-xs font-bold px-3 h-8 rounded-lg transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      {selectedInputIds.length === inputs.length && inputs.length > 0 ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inputs.length === 0 ? (
                    <div className="col-span-full bg-white text-sm rounded-[2rem] border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px]">
                      <div className="flex flex-col items-center justify-center text-slate-500 space-y-6">
                        <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-50 opacity-50"></div>
                          <SearchCode className="w-12 h-12 text-emerald-500 relative z-10" />
                        </div>
                        <div className="space-y-2 text-center">
                          <h3 className="text-xl font-bold text-slate-900">ยังไม่มีข้อมูลคีย์เวิร์ด</h3>
                          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">เพิ่มคีย์เวิร์ดตั้งต้นเพื่อเริ่มต้นสร้างบทความ SEO ที่สมบูรณ์แบบได้ทันที</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    inputs.map((input, index) => {
                      const isSelected = selectedInputIds.includes(input.id);
                      return (
                        <div 
                          key={input.id} 
                          className={`group bg-white rounded-3xl p-6 border ${isSelected ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-100 shadow-sm hover:shadow-md'} transition-all relative overflow-hidden flex flex-col h-[280px]`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-500">
                                {index + 1}
                              </div>
                              <Badge variant="secondary" className="font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border-0">
                                {(() => {
                                  const activeLang = input.overrides?.language || language;
                                  return activeLang === 'thai' ? 'TH' : 'EN';
                                })()}
                              </Badge>
                            </div>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                setSelectedInputIds(prev => 
                                  checked ? [...prev, input.id] : prev.filter(id => id !== input.id)
                                );
                              }}
                              className="border-slate-200 rounded-lg w-6 h-6 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 shadow-sm" 
                            />
                          </div>

                          <div className="mb-auto">
                            <h4 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">
                              {input.keyword}
                            </h4>
                            {input.title && (
                              <p className="text-sm font-medium text-slate-500 line-clamp-2">
                                {input.title}
                              </p>
                            )}
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                            <Button 
                              variant="ghost" 
                              className={`flex-1 h-11 font-bold rounded-xl transition-all ${generatingQueue.some(i => i.id === input.id) ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'}`}
                              onClick={() => startGenerating(input)}
                              disabled={generatingQueue.some(i => i.id === input.id)}
                            >
                              {generatingQueue.some(i => i.id === input.id) ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  อยู่ในคิว...
                                </>
                              ) : (
                                <>
                                  <PlaySquare className="w-4 h-4 mr-2" />
                                  สร้างบทความ
                                </>
                              )}
                            </Button>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm" onClick={() => setEditingItem(input)}>
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm transition-colors" onClick={() => removeInput(input.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* Tab: Configuration (Bento Grid) */}
              {/* Tab: Configuration (Spatial Layout) */}
              <TabsContent value="configuration" className="outline-none pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Main Settings */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Block 1: Target Settings */}
                    <div className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden group">
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl group-hover:bg-emerald-400/20 transition-all duration-700 pointer-events-none"></div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 mb-8 flex items-center gap-3">
                        <div className="bg-emerald-100/50 p-2.5 rounded-2xl text-emerald-600">
                          <Settings2 className="w-5 h-5" />
                        </div>
                        การตั้งค่าเป้าหมาย
                      </h3>
                      
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <Label className="text-lg font-black tracking-tight text-slate-900">คีย์เวิร์ดรอง (Secondary Keywords)</Label>
                          <div className="bg-white/80 rounded-[1.5rem] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] p-2">
                            <TagInput 
                              tags={secondaryKeywords} 
                              setTags={setSecondaryKeywords} 
                              placeholder="พิมพ์แล้วกด Enter..." 
                            />
                          </div>
                          <p className="text-sm font-medium text-slate-400 ml-2">คำที่ต้องการเน้นรองลงมา เพื่อเพิ่มโอกาสในการติดหน้าแรก</p>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="audience" className="text-lg font-black tracking-tight text-slate-900">กลุ่มเป้าหมาย (Target Audience)</Label>
                          <Input 
                            id="audience" 
                            placeholder="เช่น คนที่ค้นหาข้อมูลสินค้าในอินเทอร์เน็ต" 
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                            className="text-lg h-16 px-6 rounded-[1.5rem] bg-white/80 border-0 focus-visible:ring-4 focus-visible:ring-emerald-500/20 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] font-medium text-slate-800 placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Internal Linking & Sitemaps */}
                    <div className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden group">
                      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl group-hover:bg-teal-400/20 transition-all duration-700 pointer-events-none"></div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 mb-8 flex items-center gap-3">
                        <div className="bg-teal-100/50 p-2.5 rounded-2xl text-teal-600">
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        ลิงก์ภายในและ Sitemap (Internal Linking)
                      </h3>
                      
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <Label className="text-lg font-black tracking-tight text-slate-900">Reference URLs</Label>
                          <Textarea 
                            placeholder="https://...&#10;https://..." 
                            value={internalLinks}
                            onChange={(e) => setInternalLinks(e.target.value)}
                            className="min-h-[120px] p-6 text-base rounded-[1.5rem] bg-white/80 border-0 focus-visible:ring-4 focus-visible:ring-emerald-500/20 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] font-medium text-slate-800 placeholder:text-slate-300 resize-none font-mono leading-relaxed"
                          />
                          <p className="text-sm font-medium text-slate-400 ml-2">ใส่ลิงก์ของคุณเพื่อให้ AI แทรกเข้าบทความอัตโนมัติ</p>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                            Sitemaps <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg text-xs uppercase tracking-widest">Optional</span>
                          </Label>
                          <div className="bg-white/80 rounded-[1.5rem] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] p-2">
                            <InlineTagInput 
                              tags={sitemaps} 
                              setTags={setSitemaps} 
                              placeholder="https://example.com/sitemap.xml" 
                              buttonText="Add Sitemap"
                            />
                          </div>
                          <p className="text-sm font-medium text-slate-400 ml-2">เพิ่ม Sitemap เพื่อให้ AI ค้นหาลิงก์ภายในได้ครอบคลุมมากขึ้น</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Rules & Settings */}
                  <div className="space-y-8">
                    <div className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-8 relative overflow-hidden group">
                      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-sky-400/10 rounded-full blur-2xl group-hover:bg-sky-400/20 transition-all duration-700 pointer-events-none"></div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 mb-8 flex items-center gap-3">
                        <div className="bg-sky-100/50 p-2.5 rounded-2xl text-sky-600">
                          <Feather className="w-5 h-5" />
                        </div>
                        กฎเกณฑ์เนื้อหา
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-base font-bold text-slate-700 ml-2">น้ำเสียง (Tone)</Label>
                          <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger className="h-14 px-5 rounded-[1.25rem] text-base bg-white/80 border-0 hover:bg-white transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-medium text-slate-800">
                              <SelectValue placeholder="เลือกสไตล์" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-2">
                              <SelectItem value="professional" className="rounded-xl py-2.5 cursor-pointer">เป็นทางการ (Professional)</SelectItem>
                              <SelectItem value="conversational" className="rounded-xl py-2.5 cursor-pointer">เป็นกันเอง (Conversational)</SelectItem>
                              <SelectItem value="persuasive" className="rounded-xl py-2.5 cursor-pointer">เพื่อการขาย (Persuasive)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-bold text-slate-700 ml-2">โครงสร้างบทความ (Framework)</Label>
                          <Select value={copywritingFramework || 'standard'} onValueChange={(val) => setCopywritingFramework(val === 'standard' ? '' : val)}>
                            <SelectTrigger className="h-14 px-5 rounded-[1.25rem] text-base bg-white/80 border-0 hover:bg-white transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-medium text-slate-800">
                              <SelectValue placeholder="ปกติ (มาตรฐาน SEO)" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-2">
                              <SelectItem value="auto" className="rounded-xl py-2.5 cursor-pointer text-emerald-700 font-bold bg-emerald-50/50 mb-1">✨ Auto AI โครงสร้างอัตโนมัติ</SelectItem>
                              <SelectItem value="standard" className="rounded-xl py-2.5 cursor-pointer">ปกติ (มาตรฐาน SEO)</SelectItem>
                              <SelectItem value="AIDA" className="rounded-xl py-2.5 cursor-pointer">AIDA (Attention, Interest...)</SelectItem>
                              <SelectItem value="PAS" className="rounded-xl py-2.5 cursor-pointer">PAS (Problem, Agitate, Solve)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-bold text-slate-700 ml-2">มุมมอง (POV)</Label>
                          <Select value={pov} onValueChange={setPov}>
                            <SelectTrigger className="h-14 px-5 rounded-[1.25rem] text-base bg-white/80 border-0 hover:bg-white transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-medium text-slate-800">
                              <SelectValue placeholder="เลือกมุมมอง" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-2">
                              <SelectItem value="first" className="rounded-xl py-2.5 cursor-pointer">บุรุษที่ 1</SelectItem>
                              <SelectItem value="third" className="rounded-xl py-2.5 cursor-pointer">บุรุษที่ 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-bold text-slate-700 ml-2">ภาษา (Language)</Label>
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="h-14 px-5 rounded-[1.25rem] text-base bg-white/80 border-0 hover:bg-white transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-medium text-slate-800">
                              <SelectValue placeholder="เลือกภาษา" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-2">
                              <SelectItem value="english" className="rounded-xl py-2.5 cursor-pointer">English (US)</SelectItem>
                              <SelectItem value="thai" className="rounded-xl py-2.5 cursor-pointer">ภาษาไทย (Thai)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-slate-100">
                          <div className="flex items-center justify-between ml-2">
                            <Label className="text-base font-bold text-slate-700">ความยาวเนื้อหา</Label>
                            <span className="text-sm font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-xl">~{lengthWords[0]} คำ</span>
                          </div>
                          <Slider value={lengthWords} onValueChange={(val: any) => setLengthWords(val as number[])} max={3000} min={500} step={100} className="py-2 px-2" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-8 relative overflow-hidden group">
                      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl group-hover:bg-purple-400/20 transition-all duration-700 pointer-events-none"></div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 mb-8 flex items-center gap-3">
                        <div className="bg-purple-100/50 p-2.5 rounded-2xl text-purple-600">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        สื่อประกอบเนื้อหา
                      </h3>
                      
                      <div className="space-y-8">
                        <div className="flex justify-between items-center bg-white/80 p-5 rounded-[1.5rem] shadow-sm border border-slate-100/50 hover:border-emerald-200 transition-colors">
                          <Label className="text-base font-bold text-slate-800">สร้างภาพปก AI</Label>
                          <Switch checked={coverToggle} onCheckedChange={setCoverToggle} className="scale-110 data-[state=checked]:bg-emerald-500" />
                        </div>
                        
                        <div className={`space-y-3 transition-opacity duration-300 ${!coverToggle ? 'opacity-40 pointer-events-none' : ''}`}>
                          <Label className="text-base font-bold text-slate-700 ml-2">สัดส่วนภาพ</Label>
                          <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={!coverToggle}>
                            <SelectTrigger className="h-14 px-5 rounded-[1.25rem] text-base bg-white/80 border-0 hover:bg-white transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-medium text-slate-800">
                              <SelectValue placeholder="สัดส่วนภาพ" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-2">
                              <SelectItem value="16:9" className="rounded-xl py-2.5 cursor-pointer">16:9 (แนวนอน)</SelectItem>
                              <SelectItem value="1:1" className="rounded-xl py-2.5 cursor-pointer">1:1 (จัตุรัส)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-6 pt-6 border-t border-slate-100">
                           <div className="flex items-center justify-between ml-2">
                            <Label className="text-base font-bold text-slate-700">จำนวนภาพแทรกในบทความ</Label>
                            <span className="text-sm font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-xl">{inlineCount[0]} ภาพ</span>
                          </div>
                          <Slider value={inlineCount} onValueChange={(val: any) => setInlineCount(val as number[])} max={5} min={0} step={1} className="px-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Generations */}
              <TabsContent value="generations" className="outline-none pt-2">
                <div className="bg-white text-sm rounded-[2rem] border-0 shadow-sm overflow-hidden px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 py-4 sm:px-6">
                  {generatingQueue.map((queueItem, index) => {
                    const isActive = activeWorkerIds.has(queueItem.id);
                    return (
                    <div key={`queue-${queueItem.id}`} className="group bg-white rounded-3xl p-6 border border-orange-100 shadow-sm relative overflow-hidden flex flex-col h-[280px]">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className={`${isActive ? "text-orange-600 border-orange-200 bg-orange-50" : "text-slate-500 border-slate-200 bg-slate-50"} font-bold px-3 py-1 rounded-xl`}>
                          {isActive ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
                          )}
                          {isActive ? 'กำลังสร้าง...' : `คิว #${index + 1}`}
                        </Badge>
                        <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border-0">
                          {queueItem.overrides?.language === 'thai' ? 'TH' : 'EN'}
                        </Badge>
                      </div>

                      <div className="mb-auto">
                        <h4 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">
                          {queueItem.keyword}
                        </h4>
                        <div className="flex items-center text-xs font-medium text-slate-400 mt-2">
                          <SearchCode className="w-3.5 h-3.5 mr-1.5" /> Input Keyword
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                        <span className="text-xs font-medium text-slate-400">
                          {new Date().toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                        </span>

                      </div>
                    </div>
                    );
                  })}

                  {generatedArticles.length === 0 && generatingQueue.length === 0 ? (
                    <div className="col-span-full bg-white text-sm rounded-[2rem] border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px]">
                      <div className="flex flex-col items-center justify-center text-slate-500 space-y-6">
                        <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center relative overflow-hidden group border border-slate-100">
                          <FileText className="w-12 h-12 text-slate-400 relative z-10" />
                        </div>
                        <div className="space-y-2 text-center">
                          <h3 className="text-xl font-bold text-slate-900">ยังไม่มีบทความที่สร้างเสร็จ</h3>
                          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">บทความที่สร้างสำเร็จจะถูกเก็บไว้ที่นี่ชั่วคราว</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    generatedArticles.map((article, idx) => (
                      <div key={`${article.id}-${idx}`} className="group bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col h-[280px]">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 font-bold px-3 py-1 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> เสร็จสิ้น
                          </Badge>
                          <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border-0">
                            {article.language === 'thai' ? 'TH' : 'EN'}
                          </Badge>
                        </div>

                        <div className="mb-auto">
                          <h4 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">
                            {article.title}
                          </h4>
                          <div className="flex items-center text-xs font-medium text-slate-400 mt-2">
                            <SearchCode className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> {article.keyword}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                          <span className="text-xs font-medium text-slate-400">
                            {article.date}
                          </span>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              onClick={() => {
                                setGeneratedArticle({ ...article, markdown: article.content });
                                setArticleModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-50 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors">
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-xl bg-slate-50 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                              onClick={() => setGeneratedArticles(prev => prev.filter(a => a.id !== article.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                </div>
              </TabsContent>
              <TabsContent value="publications" className="bg-white text-sm rounded-[2rem] border-0 shadow-sm outline-none pt-2">
                <div className="p-16 text-center text-slate-500 font-medium">
                    ไม่มีบทความที่เผยแพร่
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </main>

      {/* Item Settings (Overrides) Modal - Slide-over Bento */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="!max-w-[1200px] w-[95vw] h-[90vh] !rounded-[2.5rem] bg-slate-50/90 backdrop-blur-3xl border border-white/60 shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col p-0 z-50">
          
          {/* Decorative Background Orbs */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-emerald-200/40 to-teal-100/10 rounded-full blur-[100px] -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/30 to-purple-100/30 rounded-full blur-[80px] -z-10 pointer-events-none -translate-x-1/4 translate-y-1/4"></div>

          <DialogHeader className="px-12 py-10 border-b-0 bg-transparent flex-shrink-0 relative z-10 flex flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-4xl font-black tracking-tighter text-slate-900 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">ปรับแต่งรายละเอียด SEO</DialogTitle>
              <DialogDescription className="mt-3 text-slate-500 text-[16px] font-medium max-w-lg leading-relaxed">
                กำหนดค่าการสร้างบทความแบบเจาะจง หรือปล่อยให้เป็นไปตาม <span className="text-emerald-600 font-bold hover:underline cursor-pointer transition-all">การตั้งค่าแคมเปญหลัก</span>
              </DialogDescription>
            </div>
            <div className="hidden sm:flex gap-4">
              <Button variant="ghost" onClick={() => setEditingItem(null)} className="rounded-[1.25rem] font-bold hover:bg-white/60 hover:shadow-sm text-slate-500 px-8 h-14 transition-all">ยกเลิก</Button>
              <Button onClick={saveOverrides} className="bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] font-bold px-10 h-14 transition-all hover:scale-105">บันทึกและอัปเดต</Button>
            </div>
          </DialogHeader>
          
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-transparent px-4 sm:px-12 pb-12 gap-10">
            {/* Floating Navigation Sidebar */}
            <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-4 overflow-y-auto hide-scrollbar pb-10 pl-2 pt-2">
              <Button variant="ghost" onClick={() => setActiveModalTab('details')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'details' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <AlignLeft className={`w-6 h-6 mr-4 ${activeModalTab === 'details' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">รายละเอียด (Details)</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('outline')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'outline' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <List className={`w-6 h-6 mr-4 ${activeModalTab === 'outline' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">โครงสร้าง Outline</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('content')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'content' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <FileText className={`w-6 h-6 mr-4 ${activeModalTab === 'content' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">เนื้อหา (Content)</span>
              </Button>

              <Button variant="ghost" onClick={() => setActiveModalTab('formatting')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'formatting' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <Type className={`w-6 h-6 mr-4 ${activeModalTab === 'formatting' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">รูปแบบอักษร (Format)</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('structure')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'structure' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <Layout className={`w-6 h-6 mr-4 ${activeModalTab === 'structure' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">โครงสร้างบทความ</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('internal-linking')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'internal-linking' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <LinkIcon className={`w-6 h-6 mr-4 ${activeModalTab === 'internal-linking' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">ลิงก์ภายใน (Internal)</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('external-linking')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'external-linking' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <ExternalLink className={`w-6 h-6 mr-4 ${activeModalTab === 'external-linking' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">ลิงก์ภายนอก (External)</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('images')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'images' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <ImageIcon className={`w-6 h-6 mr-4 ${activeModalTab === 'images' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">รูปภาพ (Images)</span>
              </Button>
              <Button variant="ghost" onClick={() => setActiveModalTab('videos')} className={`w-full justify-start font-black text-sm rounded-[1.5rem] py-8 px-6 transition-all duration-300 ${activeModalTab === 'videos' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] translate-x-3' : 'bg-white/40 text-slate-500 hover:text-slate-900 hover:bg-white/80 hover:shadow-sm border border-white/60 hover:translate-x-1'}`}>
                <PlaySquare className={`w-6 h-6 mr-4 ${activeModalTab === 'videos' ? 'text-emerald-400' : 'text-slate-400'}`} /> <span className="hidden md:inline tracking-wide">วิดีโอ (Videos)</span>
              </Button>
            </div>

            {/* Content Area - Floating Card */}
            <div className="flex-1 overflow-y-auto bg-white/60 backdrop-blur-3xl rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white p-8 sm:p-14 hide-scrollbar">
              <div className="max-w-3xl space-y-12 pb-10">
                
                {/* Details Section */}
                {activeModalTab === 'details' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-5 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                      <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl mr-3"><AlignLeft className="w-5 h-5"/></span>
                      Focus Keyword <span className="text-rose-500 ml-2 text-2xl">*</span>
                    </Label>
                    <Input 
                      value={editingItem?.keyword || ''} 
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, keyword: e.target.value} : null)}
                      className="text-xl h-20 px-8 rounded-[1.75rem] bg-white border-0 focus-visible:ring-4 focus-visible:ring-emerald-500/20 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] font-black text-slate-900"
                    />
                    <p className="text-sm font-bold text-slate-400 ml-4">The article will be centered around this keyword.</p>
                  </div>

                  <div className="space-y-5 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <div className="flex justify-between items-center">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                        <span className="bg-blue-100 text-blue-600 p-2 rounded-xl mr-3"><Type className="w-5 h-5"/></span>
                        Article Title
                      </Label>
                      <Button variant="ghost" onClick={() => alert('Generative feature is coming soon!')} className="text-emerald-600 font-black h-12 px-6 rounded-2xl bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 transition-colors shadow-sm">
                        <Sparkles className="w-5 h-5 mr-2"/> Generate Title
                      </Button>
                    </div>
                    <Input 
                      value={editingItem?.title || ''} 
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, title: e.target.value} : null)}
                      placeholder="Leave blank to generate automatically"
                      className="text-xl h-20 px-8 rounded-[1.75rem] bg-white border-0 focus-visible:ring-4 focus-visible:ring-emerald-500/20 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] font-black text-slate-900 placeholder:text-slate-300 placeholder:font-medium"
                    />
                    <p className="text-sm font-bold text-slate-400 ml-4">This will be the title of the article. You can leave blank so it gets generated along with the article.</p>
                  </div>

                  <div className="space-y-5 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                        <span className="bg-purple-100 text-purple-600 p-2 rounded-xl mr-3"><Hash className="w-5 h-5"/></span>
                        Include Keywords
                      </Label>
                      <Button variant="ghost" onClick={() => alert('Generative feature is coming soon!')} className="text-emerald-600 font-black h-12 px-6 rounded-2xl bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 transition-colors shadow-sm">
                        <Sparkles className="w-5 h-5 mr-2"/> Generate Keywords
                      </Button>
                    </div>
                    <DynamicInputList 
                      items={editingItem?.overrides?.secondaryKeywords || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), secondaryKeywords: items}} : null)} 
                      placeholder="how to bake bread" 
                      buttonText="Add Keyword"
                    />
                    <p className="text-sm font-bold text-slate-400 ml-4 pt-2 leading-relaxed">We will force-feed these keywords to the article. Make sure the keywords are related to the article's topic and do not contain typos.</p>
                  </div>
                </div>
                )}

                {/* Content Section (Overrides) */}
                {activeModalTab === 'content' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-5 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                      <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl mr-3"><FileText className="w-5 h-5"/></span>
                      Language
                    </Label>
                    <Select 
                      value={editingItem?.overrides?.language || language} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), language: val}} : null)}>
                      <SelectTrigger className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-3xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-3 bg-white/90 backdrop-blur-xl">
                        <SelectItem value="english" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">English (US)</SelectItem>
                        <SelectItem value="thai" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Thai</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm font-bold text-slate-400 ml-4">The language in which all articles will be written in.</p>
                  </div>

                  <div className="space-y-5 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-xl mr-3"><BookOpen className="w-5 h-5"/></span>
                      Target Country
                    </Label>
                    <Select 
                      value={editingItem?.overrides?.targetCountry || "united_states"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), targetCountry: val}} : null)}>
                      <SelectTrigger className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-3xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-3 bg-white/90 backdrop-blur-xl">
                        <SelectItem value="united_states" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">United States</SelectItem>
                        <SelectItem value="thailand" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Thailand</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm font-bold text-slate-400 ml-4">Generate location-specific content. Important for features like Connect to Web and External Linking.</p>
                  </div>
                  
                  <div className="space-y-5 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                      <span className="bg-purple-100 text-purple-600 p-2 rounded-xl mr-3"><Type className="w-5 h-5"/></span>
                      Tone of Voice
                    </Label>
                    <Input 
                      placeholder="e.g. Professional, Funny, Academic"
                      value={editingItem?.overrides?.tone || tone} 
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), tone: e.target.value}} : null)}
                      className="text-xl h-20 px-8 rounded-[1.75rem] bg-white border-0 focus-visible:ring-4 focus-visible:ring-emerald-500/20 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] font-black text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                    />
                    <p className="text-sm font-bold text-slate-400 ml-4">Examples: funny, informal, academic</p>
                  </div>

                  <div className="space-y-5 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                      <span className="bg-rose-100 text-rose-600 p-2 rounded-xl mr-3"><Layout className="w-5 h-5"/></span>
                      Point of View
                    </Label>
                    <Select 
                      value={editingItem?.overrides?.pov || pov} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), pov: val}} : null)}>
                      <SelectTrigger className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-3xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-3 bg-white/90 backdrop-blur-xl">
                        <SelectItem value="automatic" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Automatic</SelectItem>
                        <SelectItem value="first" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">First Person (I/We)</SelectItem>
                        <SelectItem value="second" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Second Person (You)</SelectItem>
                        <SelectItem value="third" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Third Person (He/She/They)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm font-bold text-slate-400 ml-4">This will affect the pronouns used in the article.</p>
                  </div>

                  <div className="space-y-5 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                      <span className="bg-amber-100 text-amber-600 p-2 rounded-xl mr-3"><Hash className="w-5 h-5"/></span>
                      Formality
                    </Label>
                    <Select 
                      value={editingItem?.overrides?.formality || "automatic"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formality: val}} : null)}>
                      <SelectTrigger className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-3xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-3 bg-white/90 backdrop-blur-xl">
                        <SelectItem value="automatic" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Automatic</SelectItem>
                        <SelectItem value="formal" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Formal</SelectItem>
                        <SelectItem value="informal" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Informal</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm font-bold text-slate-400 ml-4">Useful if selected language has both formal & informal verb conjugations.</p>
                  </div>
                </div>
                )}

                {/* Formatting Section (Overrides) */}
                {activeModalTab === 'formatting' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                        <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl mr-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Type className="w-5 h-5"/></span>
                        Bold Emphasis
                      </Label>
                      <p className="text-sm font-bold text-slate-400 pl-14">We will bold important keywords in your article automatically.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-emerald-500 mr-2"
                      checked={editingItem?.overrides?.formattingBold !== undefined ? editingItem.overrides.formattingBold : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingBold: checked}} : null)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                        <span className="bg-blue-100 text-blue-600 p-2 rounded-xl mr-3 group-hover:bg-blue-500 group-hover:text-white transition-colors"><Type className="w-5 h-5 italic"/></span>
                        Italics
                      </Label>
                      <p className="text-sm font-bold text-slate-400 pl-14">We will use italics for subtle emphasis in your article.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-blue-500 mr-2"
                      checked={editingItem?.overrides?.formattingItalics !== undefined ? editingItem.overrides.formattingItalics : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingItalics: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                        <span className="bg-purple-100 text-purple-600 p-2 rounded-xl mr-3 group-hover:bg-purple-500 group-hover:text-white transition-colors"><Layout className="w-5 h-5"/></span>
                        Tables
                      </Label>
                      <p className="text-sm font-bold text-slate-400 pl-14">If appropriate, we'll include tables in your article.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-purple-500 mr-2"
                      checked={editingItem?.overrides?.formattingTables !== undefined ? editingItem.overrides.formattingTables : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingTables: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                        <span className="bg-rose-100 text-rose-600 p-2 rounded-xl mr-3 group-hover:bg-rose-500 group-hover:text-white transition-colors"><AlignLeft className="w-5 h-5"/></span>
                        Quotes
                      </Label>
                      <p className="text-sm font-bold text-slate-400 pl-14">If appropriate, we'll include quotes/tips/recommendations in your article.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-rose-500 mr-2"
                      checked={editingItem?.overrides?.formattingQuotes !== undefined ? editingItem.overrides.formattingQuotes : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingQuotes: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                        <span className="bg-amber-100 text-amber-600 p-2 rounded-xl mr-3 group-hover:bg-amber-500 group-hover:text-white transition-colors"><List className="w-5 h-5"/></span>
                        Lists
                      </Label>
                      <p className="text-sm font-bold text-slate-400 pl-14">If appropriate, we'll include bulleted or numbered lists in your article.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-amber-500 mr-2"
                      checked={editingItem?.overrides?.formattingLists !== undefined ? editingItem.overrides.formattingLists : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), formattingLists: checked}} : null)}
                    />
                  </div>

                  <div className="space-y-6 pt-4 bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <Label className="text-xl font-black tracking-tight text-slate-800">Heading letter case</Label>
                    <Select 
                      value={editingItem?.overrides?.headingCase || "title"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), headingCase: val}} : null)}>
                      <SelectTrigger className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-3xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-3 bg-white/90 backdrop-blur-xl">
                        <SelectItem value="title" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Title Case</SelectItem>
                        <SelectItem value="sentence" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Sentence case</SelectItem>
                        <SelectItem value="lower" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">lower case</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="bg-white/80 p-6 rounded-[1.5rem] border border-white shadow-sm">
                      <p className="text-sm font-bold text-slate-400 mb-2">Preview:</p>
                      <p className="text-xl font-black text-slate-800">
                        {editingItem?.overrides?.headingCase === 'sentence' ? 'How to build a website for your small business in new york' : 
                         editingItem?.overrides?.headingCase === 'lower' ? 'how to build a website for your small business in new york' : 
                         'How to Build a Website for Your Small Business in New York'}
                      </p>
                    </div>
                  </div>
                </div>
                )}

                {/* Outline Section (Overrides) */}
                {activeModalTab === 'outline' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-start space-x-5">
                      <div className="bg-emerald-100 rounded-[1.25rem] p-4 text-emerald-600 shrink-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xl font-black tracking-tight text-slate-800">Customize Article Structure</Label>
                        <p className="text-sm font-bold text-slate-400">Leave blank to let AI automatically generate the perfect outline.</p>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => alert('Generative feature is coming soon!')} className="text-emerald-600 font-black text-sm h-14 px-8 rounded-[1.25rem] hover:bg-emerald-50 hover:text-emerald-700 bg-white shadow-sm border border-emerald-50 transition-all shrink-0">
                      <Sparkles className="w-5 h-5 mr-3"/> Auto Generate
                    </Button>
                  </div>
                  
                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <InlineTagInput 
                      tags={editingItem?.overrides?.outline || []} 
                      setTags={(tags) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), outline: tags}} : null)} 
                      placeholder="e.g. Introduction to the Topic..." 
                      buttonText="Add Heading"
                      maxTags={20}
                    />
                  </div>
                </div>
                )}



                {/* Structure Section */}
                {activeModalTab === 'structure' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <Label className="text-xl font-black tracking-tight text-slate-800">Call-To-Action</Label>
                    <Input 
                      placeholder="https://mywebsite.com/" 
                      value={editingItem?.overrides?.cta || ''}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), cta: e.target.value}} : null)}
                      className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"
                    />
                    <p className="text-sm font-bold text-slate-400 pl-4">We'll add an extra h3 to your articles with a call-to-action to this URL. Leave blank to opt-out.</p>
                  </div>

                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">Key Takeaways</Label>
                      <p className="text-sm font-bold text-slate-400">We'll add this section at the start of each article.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-emerald-500 mr-2"
                      checked={editingItem?.overrides?.keyTakeaways !== undefined ? editingItem.overrides.keyTakeaways : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), keyTakeaways: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">Conclusion</Label>
                      <p className="text-sm font-bold text-slate-400">We'll add this section at the end of each article.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-emerald-500 mr-2"
                      checked={editingItem?.overrides?.conclusion !== undefined ? editingItem.overrides.conclusion : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), conclusion: checked}} : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">FAQs</Label>
                      <p className="text-sm font-bold text-slate-400">We'll add this section at the end of each article.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-emerald-500 mr-2"
                      checked={editingItem?.overrides?.faqs !== undefined ? editingItem.overrides.faqs : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), faqs: checked}} : null)}
                    />
                  </div>

                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <Label className="text-xl font-black tracking-tight text-slate-800">Article Size</Label>
                    <Select 
                      value={editingItem?.overrides?.articleSize || "medium"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), articleSize: val}} : null)}>
                      <SelectTrigger className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-3xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-3 bg-white/90 backdrop-blur-xl">
                        <SelectItem value="small" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Small (3-5 headings)</SelectItem>
                        <SelectItem value="medium" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Medium (5-8 headings)</SelectItem>
                        <SelectItem value="large" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">Large (8+ headings)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                )}

                {/* Internal Linking Section */}
                {activeModalTab === 'internal-linking' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <div className="flex justify-between items-center mb-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800">Sitemaps <span className="text-slate-400 font-bold ml-2">(Optional)</span></Label>
                      <Button variant="ghost" onClick={() => alert('Sitemap crawl feature is coming soon!')} className="text-emerald-600 bg-emerald-50 rounded-2xl font-bold h-12 px-6 hover:bg-emerald-100 hover:text-emerald-700 transition-colors">
                        <SearchCode className="w-5 h-5 mr-2"/> Find Sitemap
                      </Button>
                    </div>
                    <DynamicInputList 
                      items={editingItem?.overrides?.sitemaps || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), sitemaps: items}} : null)} 
                      placeholder="https://example.com/sitemap.xml" 
                      buttonText="Add Sitemap"
                    />
                    <div className="pt-4">
                      <p className="text-sm font-bold text-slate-400">Add sitemaps to include internal links from your website.<br/>Use commas , to include multiple patterns.</p>
                      <p className="text-sm font-black text-emerald-600 underline cursor-pointer pt-2 hover:text-emerald-700 transition-colors" onClick={() => alert('Test & Preview Links feature is coming soon!')}>Test & Preview Links</p>
                    </div>
                  </div>

                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-xl font-black tracking-tight text-slate-800">Links per H2</Label>
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">{editingItem?.overrides?.linksPerH2 !== undefined ? editingItem.overrides.linksPerH2 : 2} Links</span>
                    </div>
                    <div className="pt-4 pb-4">
                       <Slider 
                        value={[editingItem?.overrides?.linksPerH2 !== undefined ? editingItem.overrides.linksPerH2 : 2]} 
                        onValueChange={(val: any) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), linksPerH2: val[0]}} : null)}
                        max={5} min={0} step={1} 
                        className="py-2 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:w-8 [&_[role=slider]]:h-8 [&_[role=slider]]:shadow-lg [&_.bg-primary]:bg-emerald-500"
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Links will be balanced between Internal Links and External Links.</p>
                  </div>
                </div>
                )}

                {/* External Linking Section */}
                {activeModalTab === 'external-linking' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <Label className="text-xl font-black tracking-tight text-slate-800">Include Links</Label>
                    <DynamicInputList 
                      items={editingItem?.overrides?.includeLinks || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), includeLinks: items}} : null)} 
                      placeholder="https://example.com" 
                      buttonText="Add Link"
                    />
                    <p className="text-sm font-bold text-slate-400">We'll include these exact links in the article.</p>
                  </div>

                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">Automatic External Links</Label>
                      <p className="text-sm font-bold text-slate-400">We'll scrape the internet for relevant articles in your niche & language.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-emerald-500 mr-2"
                      checked={editingItem?.overrides?.autoExternalLinks !== undefined ? editingItem.overrides.autoExternalLinks : true}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), autoExternalLinks: checked}} : null)}
                    />
                  </div>

                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <Label className="text-xl font-black tracking-tight text-slate-800">Include External Sources</Label>
                    <DynamicInputList 
                      items={editingItem?.overrides?.includeSources || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), includeSources: items}} : null)} 
                      placeholder="example.com" 
                      buttonText="Add Website"
                    />
                    <p className="text-sm font-bold text-slate-400">ONLY links from these websites will be included. Leave blank to include ALL websites.</p>
                  </div>

                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <Label className="text-xl font-black tracking-tight text-slate-800">Exclude External Sources</Label>
                    <DynamicInputList 
                      items={editingItem?.overrides?.excludeSources || []} 
                      setItems={(items) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), excludeSources: items}} : null)} 
                      placeholder="competitor.com" 
                      buttonText="Add Website"
                    />
                    <p className="text-sm font-bold text-slate-400">No links will be placed from these websites.</p>
                  </div>
                </div>
                )}

                {/* Videos Section */}
                {activeModalTab === 'videos' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">
                        <span className="bg-red-100 text-red-600 p-2 rounded-xl mr-3 group-hover:bg-red-500 group-hover:text-white transition-colors"><Youtube className="w-5 h-5"/></span>
                        Automate Youtube Videos
                      </Label>
                      <p className="text-sm font-bold text-slate-400 pl-14">We'll automatically find and include relevant YouTube videos.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-red-500 mr-2"
                      checked={editingItem?.overrides?.autoYoutube !== undefined ? editingItem.overrides.autoYoutube : false}
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), autoYoutube: checked}} : null)}
                    />
                  </div>
                </div>
                )}

                {/* Images Section (Overrides) */}
                {activeModalTab === 'images' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] group">
                    <div className="space-y-2 pr-6">
                      <Label className="text-xl font-black tracking-tight text-slate-800 flex items-center">Featured Image</Label>
                      <p className="text-sm font-bold text-slate-400">Enable to add a featured image to your article.</p>
                    </div>
                    <Switch 
                      className="scale-150 data-[state=checked]:bg-emerald-500 mr-2"
                      checked={editingItem?.overrides?.coverToggle !== undefined ? editingItem.overrides.coverToggle : coverToggle} 
                      onCheckedChange={(checked) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), coverToggle: checked}} : null)} 
                    />
                  </div>

                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <Label className="text-xl font-black tracking-tight text-slate-800">Image Provider</Label>
                    <Select 
                      value={editingItem?.overrides?.imageProvider || "ai_1"} 
                      onValueChange={(val) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageProvider: val}} : null)}>
                      <SelectTrigger className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-3xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-3 bg-white/90 backdrop-blur-xl">
                        <SelectItem value="ai_1" className="rounded-2xl py-4 px-4 text-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 font-bold transition-colors">AI images (1 credits per image)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm font-bold text-slate-400 pl-4">Use AI images for best results. All images will include an alt text.</p>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-8 rounded-[2rem] flex items-start space-x-6 shadow-sm">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl w-12 h-12 flex items-center justify-center text-white shrink-0 shadow-lg">
                      <Sparkles className="w-6 h-6"/>
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                      <Label className="text-xl font-black text-amber-900 block tracking-tight">Premium AI images available</Label>
                      <p className="text-base text-amber-700/80 font-medium leading-relaxed">
                        In order to turn on premium AI images, please go to your account settings. They're 5x as expensive, but the quality is much better.
                      </p>
                      <p className="text-base text-amber-700 font-black hover:text-amber-900 transition-colors cursor-pointer pt-2">Go to account settings &rarr;</p>
                    </div>
                  </div>

                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-xl font-black tracking-tight text-slate-800">Number of In-Article Images</Label>
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">{editingItem?.overrides?.inlineCount !== undefined ? editingItem.overrides.inlineCount : inlineCount[0]} ภาพ</span>
                    </div>
                    <div className="pt-4 pb-4">
                      <Slider 
                        value={[editingItem?.overrides?.inlineCount !== undefined ? editingItem.overrides.inlineCount : inlineCount[0]]} 
                        onValueChange={(val: any) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), inlineCount: val[0]}} : null)} 
                        max={5} min={0} step={1} 
                        className="py-2 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:w-8 [&_[role=slider]]:h-8 [&_[role=slider]]:shadow-lg [&_.bg-primary]:bg-emerald-500" 
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-400">We'll sprinkle the images through-out the article.</p>
                  </div>

                  <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4 transition-all duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                    <Label className="text-xl font-black tracking-tight text-slate-800">Extra Custom Styling</Label>
                    <Input 
                      placeholder="photographic image" 
                      value={editingItem?.overrides?.imageStyle || ""}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageStyle: e.target.value}} : null)}
                      className="h-20 px-8 rounded-[1.75rem] text-xl bg-white border-0 hover:bg-slate-50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] focus:ring-4 focus:ring-emerald-500/20 font-black text-slate-800"
                    />
                    <div className="flex items-center gap-3 text-sm flex-wrap pt-2 pl-4">
                      <span className="text-slate-400 font-bold">Examples:</span>
                      <span className="bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm" onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageStyle: "black and white"}} : null)}>black and white</span>
                      <span className="bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm" onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageStyle: "illustrative"}} : null)}>illustrative</span>
                      <span className="bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm" onClick={() => setEditingItem(prev => prev ? {...prev, overrides: {...(prev.overrides || {}), imageStyle: "anime"}} : null)}>anime</span>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>


        </DialogContent>
      </Dialog>


      {/* Generated Article Modal */}
      <Dialog open={articleModalOpen} onOpenChange={setArticleModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl sm:max-w-4xl md:w-[90vw] h-[85vh] flex flex-col pt-8 pb-4">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
            <DialogTitle className="text-xl">ผลลัพธ์บทความ: {generatedArticle?.title}</DialogTitle>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={async () => {
                 try {
                   let aid = generatedArticle?.id;
                   const saved = await saveArticle(generatedArticle.title, generatedArticle.content, 'Completed', aid?.startsWith('temp_') ? undefined : aid, generatedArticle.keyword, generatedArticle.language);
                   if (saved) {
                     setGeneratedArticles(prev => prev.map(a => a.id === generatedArticle.id ? { ...a, id: saved.id } : a));
                     navigate(`/article/${saved.id}`);
                   }
                 } catch (e) { console.error('Save before open failed:', e); }
               }} className="text-slate-500 hover:text-slate-900" title="เปิดบทความ">
                  <ExternalLink className="w-5 h-5" />
               </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 p-8 border border-slate-100 rounded-lg bg-white shadow-inner" id="preview-article-content">
            <div className="markdown-body max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: MarkdownImage
                }}
              >
                {generatedArticle?.content || generatedArticle?.markdown || ''}
              </ReactMarkdown>
            </div>
          </div>
          <DialogFooter className="mt-4 sm:justify-between items-center">
            <span className="text-xs text-slate-500">* ข้อมูลนี้สามารถตั้งค่าให้เซฟลงฐานข้อมูลหรืออัปโหลดขึ้นเว็บอัตโนมัติได้ภายหลัง</span>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setArticleModalOpen(false)}>ปิด</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-slate-900 inline-flex items-center gap-2" onClick={async () => {
                let articleId = generatedArticle?.id;
                // บันทึกลง DB ทุกครั้งก่อนเปิด เพื่อให้มั่นใจว่ามี content
                try {
                  const saved = await saveArticle(generatedArticle.title, generatedArticle.content, 'Completed', articleId?.startsWith('temp_') ? undefined : articleId, generatedArticle.keyword, generatedArticle.language);
                  if (saved) {
                    articleId = saved.id;
                    setGeneratedArticles(prev => prev.map(a => a.id === generatedArticle.id ? { ...a, id: saved.id } : a));
                  }
                } catch (e) { console.error('Save before open failed:', e); }
                setArticleModalOpen(false);
                navigate(`/article/${articleId}`);
              }}>
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
                  alert('คัดลอกลง Clipboard แล้ว');
                } else {
                  alert('ไม่พบเนื้อหา');
                }
              }}>
                คัดลอก
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}
