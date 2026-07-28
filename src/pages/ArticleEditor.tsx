import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Share2, Eye, Download, Search,
  Settings, Image as ImageIcon, Layout, AlignLeft,
  ChevronDown, Type, List, Link as LinkIcon, ExternalLink,
  ChevronRight, Sparkles, Send, Globe, History, DownloadCloud,
  CheckCircle2, Pencil, Trash2, MoreVertical, Columns, Plus, Copy,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import localforage from 'localforage';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { supabase } from '@/lib/supabase';
import { fetchArticleById, saveArticle } from '@/lib/articles';
import { useAdmin } from '@/hooks/useAdmin';

function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fall through
      }
    }

    // Fallback if the key is 'campaign_config_generatedArticles' but data is in 'generatedArticles'
    if (key === 'campaign_config_generatedArticles') {
      const fallback = localStorage.getItem('generatedArticles');
      if (fallback) {
        try {
          return JSON.parse(fallback);
        } catch (e) {
          // Fall through
        }
      }
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [key, state]);

  return [state, setState];
}

const MarkdownImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');

  useEffect(() => {
    if (src && src.startsWith('gemini_img_')) {
      localforage.getItem(src).then((dataUri) => {
        if (dataUri) {
          setImgSrc(dataUri as string);
        }
      }).catch(console.error);
    } else {
      setImgSrc(src || '');
    }
  }, [src]);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={props.className || "max-w-full rounded-xl my-6 mx-auto block shadow-sm"}
      style={props.style}
      referrerPolicy="no-referrer"
    />
  );
};

const compressBase64Image = (dataUri: string, maxWidth = 900, quality = 0.70): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUri || !dataUri.startsWith('data:image/')) {
      resolve(dataUri);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUri;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(dataUri);
        }
      } catch (err) {
        console.warn('Compression error:', err);
        resolve(dataUri);
      }
    };
    img.onerror = () => {
      resolve(dataUri);
    };
  });
};

const uploadImageToSupabase = async (src: string, altText: string = ''): Promise<string> => {
  if (!src) return src;
  
  let fallbackReturn = src;
  
  try {
    let file: File | null = null;
    let mime = 'image/jpeg';

    if (src.startsWith('data:image/')) {
      const arr = src.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      file = new File([u8arr], `img_${Date.now()}.jpg`, { type: mime });
      fallbackReturn = src;
    } else {
      let fetchSuccess = false;
      
      if (src.startsWith('http') || src.startsWith('/')) {
        const fullUrl = src.startsWith('/') ? window.location.origin + src : src;
        fallbackReturn = fullUrl;
        try {
          const response = await fetch(fullUrl);
          if (response.ok) {
            const blob = await response.blob();
            mime = blob.type || 'image/jpeg';
            if (mime.startsWith('image/')) {
              file = new File([blob], `img_${Date.now()}.jpg`, { type: mime });
              fetchSuccess = true;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch original image URL:', fullUrl);
        }
      }

      if (!fetchSuccess || src.startsWith('gemini_img_')) {
        const keyword = altText || 'industrial forklift';
        const fallbackUrl = '';
        fallbackReturn = fallbackUrl;
        const response = await fetch(fallbackUrl);
        const blob = await response.blob();
        mime = blob.type || 'image/jpeg';
        file = new File([blob], `img_${Date.now()}.jpg`, { type: mime });
      }
    }

    if (!file) return fallbackReturn;

    if (!supabase || !supabase.storage) {
      console.warn('Supabase storage not configured. Using fallback URL.');
      return fallbackReturn;
    }

    const fileName = `articles/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return fallbackReturn;
    }

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error uploading image to Supabase:', err);
    return fallbackReturn;
  }
};

const mdToHtml = async (markdown: string): Promise<string> => {
  if (!markdown) return '';
    // Brute-force auto-correction before rendering (SAFE VERSION)
                        markdown = markdown.replace(/สุญญากาศ/g, 'สูญญากาศ').replace(/สูญากาศ/g, 'สูญญากาศ').replace(/สุญากาศ/g, 'สูญญากาศ').replace(/มือาชีพ/g, 'มืออาชีพ').replace(/อาหาร้อน/g, 'อาหารร้อน').replace(/กรไกร/g, 'กรรไกร').replace(/จาการปนเปื้อน/g, 'จากการปนเปื้อน').replace(/จาการซีล/g, 'จากการซีล').replace(/ต้องการะดับ/g, 'ต้องการระดับ').replace(/ข้อควระวัง/g, 'ข้อควรระวัง').replace(/ช่วยับยั้ง/g, 'ช่วยยับยั้ง').replace(/การู้วิธี/g, 'การรู้วิธี').replace(/ช่วยืนยัน/g, 'ช่วยยืนยัน').replace(/พบ่อย/g, 'พบบ่อย').replace(/ช่วยืด/g, 'ช่วยยืด').replace(/โครงสร้างเซล์/g, 'โครงสร้างเซลล์').replace(/ก่อนำ/g, 'ก่อนนำ').replace(/ใน้ำเดือด/g, 'ในน้ำเดือด').replace(/สนิทั้ง/g, 'สนิททั้ง').replace(/การั่วไหล/g, 'การรั่วไหล').replace(/รอย่น/g, 'รอยย่น').replace(/เนื้อาหาร/g, 'เนื้ออาหาร').replace(/เห็ดิบ/g, 'เห็ดดิบ').replace(/หรือาจ/g, 'หรืออาจ').replace(/อย่าง่าย/g, 'อย่างง่าย').replace(/รอยซีลเดิมาซีล/g, 'รอยซีลเดิมมาซีล').replace(/หนึ่งมื้น/g, 'หนึ่งมื้อ').replace(/ออกจากัน/g, 'ออกจากกัน').replace(/กระดูก่อน/g, 'กระดูกก่อน').replace(/ความชื้นี้/g, 'ความชื้นนี้').replace(/ระบไร้อากาศ/g, 'ระบบไร้อากาศ').replace(/การักษา/g, 'การรักษา').replace(/หรือุ่น/g, 'หรืออุ่น').replace(/แบ Sous-vide/g, 'แบบ Sous-vide').replace(/ถูกักไว้/g, 'ถูกกักไว้').replace(/หรืออกซิเจน/g, 'หรือออกซิเจน').replace(/เนื่องจาก๊าซ/g, 'เนื่องจากก๊าซ').replace(/สามารถูกดึง/g, 'สามารถถูกดึง').replace(/แบเรียบ/g, 'แบบเรียบ').replace(/ขั้นตอนี้/g, 'ขั้นตอนนี้').replace(/ตรวจับ/g, 'ตรวจจับ').replace(/ผลัพธ์/g, 'ผลลัพธ์').replace(/หัวดูดึง/g, 'หัวดูด').replace(/ฟุ้ติดลงไป/g, 'รัดติดลงไป').replace(/ดูดสุญากาศ/g, 'ดูดสูญญากาศ').replace(/ธุรกิจำเป็น/g, 'ธุรกิจจำเป็น').replace(/ก้อน้ำแข็ง/g, 'ก้อนน้ำแข็ง').replace(/ฟ่างอากาศ/g, 'ฟองอากาศ').replace(/หรือุณหภูมิ/g, 'หรืออุณหภูมิ').replace(/อุณหูมิห้อง/g, 'อุณหภูมิห้อง').replace(/ปากามาร์คเกอร์/g, 'ปากกามาร์คเกอร์').replace(/แน่นิ่ง/g, 'แนบสนิท').replace(/เปรอฝาแฝด/g, 'เปรอะเปื้อน').replace(/แบไม่มี/g, 'แบบไม่มี').replace(/เช่น้ำซุป/g, 'เช่นน้ำซุป').replace(/เซล์/g, 'เซลล์').replace(/ระบบบบบ/g, 'ระบบ').replace(/ควบคุมมมม/g, 'ควบคุม').replace(/ป้องกัน้ำ/g, 'ป้องกันน้ำ').replace(/ประอุณหภูมิ/g, 'ปรับอุณหภูมิ').replace(/บอบาง/g, 'บอบบาง').replace(/ผักาดหอม/g, 'ผักกาดหอม').replace(/เอื้อำนวย/g, 'เอื้ออำนวย').replace(/แบเต็มที่/g, 'แบบเต็มที่').replace(/เครื่องแบ /g, 'เครื่องแบบ ').replace(/แบ Nozzle/g, 'แบบ Nozzle').replace(/แบ External/g, 'แบบ External').replace(/แบ Chamber/g, 'แบบ Chamber').replace(/ระบ Pulse/g, 'ระบบ Pulse').replace(/ทิชู่/g, 'ทิชชู่').replace(/อาจะเท/g, 'อาจจะเท').replace(/กึ่งแข็งแข็ง/g, 'กึ่งแข็ง').replace(/เติบโตได้อาหาร/g, 'เติบโตได้ อาหาร').replace(/ไม่ได้การซีล/g, 'ไม่ได้ การซีล').replace(/ปลอดภัยิ่ง/g, 'ปลอดภัยยิ่ง').replace(/การับมือ/g, 'การรับมือ').replace(/เมื่อากาศ/g, 'เมื่ออากาศ').replace(/การู้ว่า/g, 'การรู้ว่า').replace(/ตามา/g, 'ตามมา').replace(/สมบูรณ์แบ/g, 'สมบูรณ์แบบ').replace(/เครื่องมือุปกรณ์/g, 'เครื่องมืออุปกรณ์').replace(/ไม่ได้การสูบ/g, 'ไม่ได้ การสูบ')
      .replace(/ห่อาหาร/g, 'ห่ออาหาร')
      .replace(/จุดังกล่าว/g, 'จุดดังกล่าว')
      .replace(/อาหาระบุว่า/g, 'อาหารระบุว่า')
      .replace(/ไม่ได้ถุงเรียบ/g, 'ไม่ได้ ถุงเรียบ')
      .replace(/แบใช้แผ่นดูด/g, 'แบบใช้แผ่นดูด')
      .replace(/ขนอ่นุ่ม/g, 'ขนอ่อนนุ่ม')
      .replace(/ขนอ่น/g, 'ขนอ่อน')
      .replace(/ความั่นใจ/g, 'ความมั่นใจ')
      .replace(/ใน้ำอุ่น/g, 'ในน้ำอุ่น')
      .replace(/อัตราส่วน้ำ/g, 'อัตราส่วนน้ำ')
      .replace(/กลิ่น้ำยา/g, 'กลิ่นน้ำยา')
      .replace(/ถุงลาย่น/g, 'ถุงลายย่น')
      .replace(/หรือุดตัน/g, 'หรืออุดตัน')
      .replace(/เป็นิสัย/g, 'เป็นนิสัย')
      .replace(/การู้คำตอบ/g, 'การรู้คำตอบ')
      .replace(/ข้อจำกัด้าน/g, 'ข้อจำกัดด้าน')
      .replace(/การีไซเคิล/g, 'การรีไซเคิล')
      .replace(/สเปการรับรอง/g, 'สเปกการรับรอง')
      .replace(/ออก่อน/g, 'ออกก่อน')
      .replace(/การักษาสภาพ/g, 'การรักษาสภาพ')
      .replace(/แห้งจี๋/g, 'แห้งสนิท')
      .replace(/ระบโลจิสติกส์/g, 'ระบบโลจิสติกส์')
      .replace(/ควบคุ/g, 'ควบคุม')
      .replace(/ยุคปัจุบัน/g, 'ยุคปัจจุบัน')
      .replace(/หรือาหาร/g, 'หรืออาหาร')
      .replace(/ปัจัย/g, 'ปัจจัย')
      .replace(/ตั้งแต่ต้นั้น/g, 'ตั้งแต่ต้นนั้น')
      .replace(/หลัการ/g, 'หลักการ')
      .replace(/ถูกำจัดออก/g, 'ถูกกำจัดออก')
      .replace(/จาการ/g, 'จากการ')
      .replace(/ถูกสั่งาน/g, 'ถูกสั่งงาน')
      .replace(/รอยับ/g, 'รอยยับ')
      .replace(/ตะขล่วัด/g, 'แถบลวด')
      .replace(/หรือไม่นอกจากนี้/g, 'หรือไม่ นอกจากนี้')
      .replace(/หรือไม่หาก/g, 'หรือไม่ หาก')
      .replace(/แรงดัน้ำ/g, 'แรงดันน้ำ')
      .replace(/แบไม่ทำลาย/g, 'แบบไม่ทำลาย')
      .replace(/ทดสอบไว้หาก/g, 'ทดสอบไว้ หาก')
      .replace(/ทันทีซึ่งช่วย/g, 'ทันที ซึ่งช่วย')
      .replace(/การู้ถึง/g, 'การรู้ถึง')
      .replace(/เครื่องดูดแบ/g, 'เครื่องดูดแบบ')
      .replace(/พลาสติก็มีผล/g, 'พลาสติกก็มีผล')
      .replace(/ดันทะลักทะลาบริเวณ/g, 'ดันทะลักทะลายบริเวณ')
      .replace(/ความัน/g, 'ความมัน')
      .replace(/ก่อให้เกิดรอรั่ว/g, 'ก่อให้เกิดรอยรั่ว')
      .replace(/อย่างเป็นระบ\b/g, 'อย่างเป็นระบบ')
      .replace(/ต้น้ำ/g, 'ต้นน้ำ')
      .replace(/เสร็จึงฟู/g, 'เสร็จจึงฟู')
      .replace(/เกิดการั่วซึม/g, 'เกิดการรั่วซึม')
      .replace(/ได้ซึ่งอาจเกิด/g, 'ได้ ซึ่งอาจเกิด')
      .replace(/ได้จึงควร/g, 'ได้ จึงควร')
      .replace(/เพื่องานี้/g, 'เพื่องานนี้')
      .replace(/เริ่มีอาการ/g, 'เริ่มมีอาการ')
      .replace(/การับประกัน/g, 'การรับประกัน')
      .replace(/น้ำมันเยิ้น/g, 'น้ำมันเยิ้ม')
      .replace(/มิลิเมตร/g, 'มิลลิเมตร')
      .replace(/ตอบแบ/g, 'ตอบแบบ')
      .replace(/ดูดแบเป็น/g, 'ดูดแบบเป็น')
      .replace(/นวัตกรรมาใช้/g, 'นวัตกรรมมาใช้')
      .replace(/ร้านอาหาระดับ/g, 'ร้านอาหารระดับ')
      .replace(/การั่วซึม/g, 'การรั่วซึม')
      .replace(/ออกซิเจนั้น/g, 'ออกซิเจนนั้น')
      .replace(/วงการ้านอาหาร/g, 'วงการร้านอาหาร')
      .replace(/บีบรัด้วย/g, 'บีบรัดด้วย')
      .replace(/ไหล้นออกมา/g, 'ไหลล้นออกมา')
      .replace(/แห้งสนิทุกครั้ง/g, 'แห้งสนิททุกครั้ง')
      .replace(/เกิดจาการ/g, 'เกิดจากการ')
      .replace(/คือาการ/g, 'คืออาการ')
      .replace(/ธุรกิจัดเลี้ยง/g, 'ธุรกิจจัดเลี้ยง')
      .replace(/ความเสียหายัง/g, 'ความเสียหายยัง')
      .replace(/ในที่สุป/g, 'ในที่สุด')
      .replace(/อุตสาหกรรมักจะ/g, 'อุตสาหกรรมมักจะ')
      .replace(/โรงานอุตสาหกรรม/g, 'โรงงานอุตสาหกรรม')
      .replace(/ช่องแช่อย่างไรก็ตาม/g, 'ช่องแช่ อย่างไรก็ตาม')
      .replace(/รักษาคุณภาพสินค้\b/g, 'รักษาคุณภาพสินค้า')
      .replace(/กระดูกคมาก/g, 'กระดูกคมมาก')
      .replace(/คุ้มค่าการลงทุด/g, 'คุ้มค่าการลงทุน')
      .replace(/การปฏิบัติตามาตรฐาน/g, 'การปฏิบัติตามมาตรฐาน')
      .replace(/แรงกดันสูง/g, 'แรงกดดันสูง')
      .replace(/ถุงแบางทั่วไป/g, 'ถุงบางทั่วไป')
      .replace(/มีการะบุความหนา/g, 'มีการระบุความหนา')
      .replace(/ซื้อุปกรณ์/g, 'ซื้ออุปกรณ์')
      .replace(/แบใดีที่สุด/g, 'แบบไหนดีที่สุด')
      .replace(/การะบายแรงดัน/g, 'การระบายแรงดัน')
      .replace(/กระดาษทิชู่/g, 'กระดาษทิชชู่')
      .replace(/คือุปกรณ์/g, 'คืออุปกรณ์')
      .replace(/อาหาระดับ/g, 'อาหารระดับ')
      .replace(/\bโรงาน\b/g, 'โรงงาน')
      .replace(/โรงาน/g, 'โรงงาน')
      .replace(/เหลืออก/g, 'เหลือออก')
      .replace(/การะบายอากาศ/g, 'การระบายอากาศ')
      .replace(/สมบูรณ์แบ\b/g, 'สมบูรณ์แบบ')
      .replace(/ชานไก่การเก็บรักษา/g, 'ชิ้นไก่ การเก็บรักษา')
      .replace(/สีกลิ่น/g, 'สี กลิ่น')
      .replace(/ปัจุบัน/g, 'ปัจจุบัน')
      .replace(/การกลั้น \(Sealing\)/g, 'การปิดผนึก (Sealing)')
      .replace(/การกลั้น/g, 'การปิดผนึก')
      .replace(/จากนั้นำ/g, 'จากนั้นนำ')
      .replace(/วางไข่ในตู้แช่แข็ง/g, 'วางไว้ในตู้แช่แข็ง')
      .replace(/เป็น้ำแข็ง/g, 'เป็นน้ำแข็ง')
      .replace(/คุณภาพของานซีล/g, 'คุณภาพของงานซีล')
      .replace(/เปิด้วย/g, 'เปิดด้วย')
      .replace(/ตั้งใจะนำ/g, 'ตั้งใจจะนำ')
      .replace(/มื้อาหาร/g, 'มื้ออาหาร')
      .replace(/เซล์ผัก/g, 'เซลล์ผัก')
      .replace(/แล้วางไว้/g, 'แล้ววางไว้')
      .replace(/พิจารณาแล้ว่า/g, 'พิจารณาแล้วว่า')
      .replace(/เดียวกันี้/g, 'เดียวกันนี้')
      .replace(/เช่น้ำเลือด/g, 'เช่น น้ำเลือด')
      .replace(/เครื่องใช้ไฟ้า/g, 'เครื่องใช้ไฟฟ้า')
      .replace(/แรงานคน/g, 'แรงงานคน')
      .replace(/สะอาด้วย/g, 'สะอาดด้วย')
      .replace(/สะอาดี/g, 'สะอาดดี')
      .replace(/ผักาด/g, 'ผักกาด');
  const parsedHtml = await marked.parse(markdown);

  // Parse HTML string to DOM to do easy mutations
  const parser = new DOMParser();
  const doc = parser.parseFromString(parsedHtml, 'text/html');
  const images = doc.querySelectorAll('img');

  for (let img of Array.from(images)) {
    const src = img.getAttribute('src');
    if (src && src.startsWith('gemini_img_')) {
      try {
        const dataUri = await localforage.getItem(src);
        if (dataUri) {
          img.setAttribute('src', dataUri as string);
          img.setAttribute('data-original-src', src);
        }
      } catch (e) {
        console.error("Failed to load local image key", src, e);
      }
    }
  }

  return doc.body.innerHTML;
};

const htmlToMd = (html: string): string => {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    emDelimiter: '*'
  });

  // Keep image sources mapped back to localforage keys
  turndownService.addRule('images', {
    filter: 'img',
    replacement: function (content, node) {
      const imgNode = node as HTMLImageElement;
      const src = imgNode.getAttribute('data-original-src') || imgNode.getAttribute('src') || '';
      const alt = imgNode.getAttribute('alt') || '';
      return src ? `![${alt}](${src})` : '';
    }
  });

  let md = turndownService.turndown(html);
  return md;
};

interface WysiwygEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

const WysiwygEditor = ({ content, onChange }: WysiwygEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef<boolean>(false);
  const lastContentRef = useRef<string>('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Custom dialog states
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('https://');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolbarPos, setToolbarPos] = useState<{top: number, left: number} | null>(null);

  const updateToolbarPos = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && containerRef.current) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      if (rect.top === 0 && rect.left === 0) return;

      setToolbarPos({
        top: rect.top - containerRect.top - 50,
        left: rect.left - containerRect.left + (rect.width / 2)
      });
    }
  };

  // Save selection before opening modal
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0));
    }
  };

  // Restore selection before executing command
  const restoreSelection = () => {
    if (savedRange) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRange);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const url = await uploadImageToSupabase(base64data);
        restoreSelection();
        executeCommand('insertImage', url);
        setImageModalOpen(false);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/seeddream-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Failed to generate image");

      const finalUrl = await uploadImageToSupabase(data.url, aiPrompt);
      restoreSelection();
      executeCommand('insertImage', finalUrl);
      setImageModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างภาพ: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    setIsProcessing(false);
  };

  // Synchronize incoming markdown to HTML safely
  useEffect(() => {
    const renderContent = async () => {
      if (isUpdatingRef.current) return;

      const rawHtml = await mdToHtml(content || '');
      if (editorRef.current && rawHtml !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = rawHtml;
        lastContentRef.current = rawHtml;
      }
    };
    renderContent();
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html === lastContentRef.current) return;
      lastContentRef.current = html;

      isUpdatingRef.current = true;
      const markdown = htmlToMd(html);
      onChange(markdown);
      // Reset the updating guard after dynamic content propagates
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const formatBlock = (tag: string) => {
    document.execCommand('formatBlock', false, tag);
    handleInput();
  };

  const handleLink = () => {
    saveSelection();
    setInputValue('https://');
    setLinkModalOpen(true);
  };

  const submitLink = () => {
    if (inputValue && inputValue !== 'https://') {
      restoreSelection();
      executeCommand('createLink', inputValue);
    }
    setLinkModalOpen(false);
  };

  const handleImage = () => {
    saveSelection();
    setInputValue('https://');
    setImageModalOpen(true);
  };

  const submitImage = () => {
    if (inputValue && inputValue !== 'https://') {
      restoreSelection();
      executeCommand('insertImage', inputValue);
    }
    setImageModalOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      className="relative pt-2"
      onMouseUp={updateToolbarPos}
      onKeyUp={updateToolbarPos}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
    >
      {/* Absolute zero-height container for the floating toolbar */}
      <div 
        className="absolute z-50 overflow-visible flex justify-center items-start w-full pointer-events-none transition-all duration-200 ease-out"
        style={{
          top: toolbarPos ? toolbarPos.top : 0,
          left: toolbarPos ? toolbarPos.left : '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <div className={`flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur-xl border border-slate-200/80 p-1.5 rounded-2xl shadow-xl w-fit overflow-x-auto no-scrollbar transition-all duration-200 ${
          isFocused && toolbarPos ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock('<h2>')}
          className="h-8 px-2.5 hover:bg-slate-50 text-slate-700 font-bold text-xs"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock('<h3>')}
          className="h-8 px-2.5 hover:bg-slate-50 text-slate-700 font-bold text-xs"
        >
          H3
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock('<p>')}
          className="h-8 px-2 text-slate-700 hover:bg-slate-50"
          title="ย่อหน้าปกติ"
        >
          <Type className="w-3.5 h-3.5" />
        </Button>

        <Separator orientation="vertical" className="h-4 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('bold')}
          className="h-8 px-2.5 hover:bg-slate-50 text-slate-700 font-extrabold text-xs"
        >
          B
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('italic')}
          className="h-8 px-2.5 hover:bg-slate-50 text-slate-700 italic text-xs"
        >
          I
        </Button>

        <Separator orientation="vertical" className="h-4 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertUnorderedList')}
          className="h-8 px-2 hover:bg-slate-50 text-slate-700"
          title="รายการแบบสัญลักษณ์"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertOrderedList')}
          className="h-8 px-2 hover:bg-slate-50 text-slate-700 font-bold text-[10px]"
          title="รายการแบบตัวเลข"
        >
          1.
        </Button>

        <Separator orientation="vertical" className="h-4 w-[1px] bg-slate-200 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          className="h-8 px-2 hover:bg-slate-50 text-slate-700"
          title="ลิงก์"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImage}
          className="h-8 px-2 hover:bg-slate-50 text-slate-700"
          title="รูปภาพ"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock('<blockquote>')}
          className="h-8 px-2 hover:bg-slate-50 text-slate-700 italic font-serif text-sm"
          title="อ้างอิง"
        >
          ""
        </Button>
      </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="border border-slate-100/80 rounded-2xl p-6 bg-white hover:bg-white/90 transition-colors focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-400 shadow-sm mt-4">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="w-full min-h-[500px] outline-none pb-32 focus:outline-none select-text markdown-body empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 before:pointer-events-none font-sans font-normal text-[15px] text-slate-700 subpixel-antialiased [&_p]:font-normal [&_p]:text-slate-700 [&_p]:text-[15px] [&_p]:leading-[1.7] [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:text-lg [&_li]:font-normal [&_li]:text-slate-700 [&_li]:text-[15px] [&_strong]:font-semibold [&_strong]:text-slate-900"
          data-placeholder="เขียนบทความของคุณตรงนี้..."
          style={{ wordBreak: 'break-word' }}
        />
      </div>

      {/* Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-slate-800 mb-2">เพิ่มลิงก์ (Insert Link)</h3>
          <p className="text-sm text-slate-500 mb-4">ระบุ URL ปลายทางที่คุณต้องการให้ข้อความลิงก์ไป</p>
          <Input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder="https://example.com"
            className="mb-6 h-12 rounded-xl bg-slate-50 border-slate-200"
            onKeyDown={(e) => { if (e.key === 'Enter') submitLink(); }}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setLinkModalOpen(false)} className="rounded-xl">ยกเลิก</Button>
            <Button onClick={submitLink} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">เพิ่มลิงก์</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4">แทรกรูปภาพ (Insert Image)</h3>
          
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="url" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">URL</TabsTrigger>
              <TabsTrigger value="upload" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">อัปโหลดจากเครื่อง</TabsTrigger>
              <TabsTrigger value="ai" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">AI (Seeddream)</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <p className="text-sm text-slate-500">ระบุ URL ของรูปภาพที่คุณต้องการแทรก</p>
              <Input 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                placeholder="https://example.com/image.jpg"
                className="h-12 rounded-xl bg-slate-50 border-slate-200"
                onKeyDown={(e) => { if (e.key === 'Enter') submitImage(); }}
              />
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={() => setImageModalOpen(false)} className="rounded-xl">ยกเลิก</Button>
                <Button onClick={submitImage} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">แทรกรูปภาพ</Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <p className="text-sm text-slate-500">อัปโหลดรูปภาพจากอุปกรณ์ของคุณ (จะถูกอัปโหลดขึ้นเซิร์ฟเวอร์)</p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 relative hover:bg-slate-100 transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-600">{isProcessing ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <p className="text-sm text-slate-500">พิมพ์คำอธิบายรูปภาพ (Prompt) เพื่อให้ AI สร้างให้ใหม่</p>
              <Textarea 
                value={aiPrompt} 
                onChange={(e) => setAiPrompt(e.target.value)} 
                placeholder="เช่น ภาพถ่ายสมจริงของหุ่นยนต์ในโรงงาน..."
                className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200"
              />
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={() => setImageModalOpen(false)} className="rounded-xl">ยกเลิก</Button>
                <Button onClick={handleAIGenerate} disabled={isProcessing || !aiPrompt.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-2">
                  {isProcessing ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังสร้างภาพ...</>
                  ) : (
                    '✨ สร้าง & แทรก'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [articles, setArticles] = usePersistentState<any[]>('generatedArticles', []);
  const [article, setArticle] = useState<any>(null);
  const latestArticleRef = useRef<any>(null);
  
  useEffect(() => {
    latestArticleRef.current = article;
  }, [article]);

  const [userId, setUserId] = useState<string>('');

  // ดึง user ID เพื่อค้นหา localStorage key ที่ถูกต้อง
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) setUserId(user.id);
      } catch {}
    })();
  }, []);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ index: number, position: 'top' | 'bottom' } | null>(null);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [featuredImageModalOpen, setFeaturedImageModalOpen] = useState(false);
  const [featuredImageUrlInput, setFeaturedImageUrlInput] = useState('https://');
  const [featuredImageAiPrompt, setFeaturedImageAiPrompt] = useState('');
  const [isProcessingFeaturedImage, setIsProcessingFeaturedImage] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);


  const outlineParts = (article?.content || '').split(/(?=^#{2,3}\s)/m);
  const outlineSections = outlineParts.map((part: string, index: number) => {
    const match = part.match(/^(#{2,3})\s([^\n]*)/);
    const level = match ? match[1].length : 1;
    const title = match ? match[2].replace(/\*\*/g, '').trim() : 'บทนำ (Introduction)';
    return {
      id: index,
      title,
      level,
      content: part,
      isHeading: !!match
    };
  }).filter((p: any) => p.content.trim().length > 0);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...outlineSections];
    if (direction === 'up' && index > 0) {
      const temp = sections[index - 1];
      sections[index - 1] = sections[index];
      sections[index] = temp;
    } else if (direction === 'down' && index < sections.length - 1) {
      const temp = sections[index + 1];
      sections[index + 1] = sections[index];
      sections[index] = temp;
    } else {
      return;
    }
    const newContent = sections.map((s, idx) => {
      let content = s.content;
      if (!s.isHeading && idx > 0) {
        content = `## ${s.title}\n\n` + content;
      }
      if (!content.endsWith('\n')) {
        content += '\n';
      }
      return content;
    }).join('');
    handleUpdateField('content', newContent);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';
    
    if (!dragOverInfo || dragOverInfo.index !== index || dragOverInfo.position !== position) {
      setDragOverInfo({ index, position });
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we actually left the container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverInfo(null);
    }
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverInfo(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !dragOverInfo) {
      setDraggedIndex(null);
      setDragOverInfo(null);
      return;
    }
    
    const position = dragOverInfo.position;
    setDragOverInfo(null);
    
    let targetIndex = dropIndex;
    if (position === 'bottom') {
      targetIndex += 1;
    }

    const sections = [...outlineSections];
    const [draggedItem] = sections.splice(draggedIndex, 1);
    
    if (draggedIndex < targetIndex) {
      targetIndex -= 1;
    }
    
    sections.splice(targetIndex, 0, draggedItem);
    
    const newContent = sections.map((s, idx) => {
      let content = s.content;
      if (!s.isHeading && idx > 0) {
        content = `## ${s.title}\n\n` + content;
      }
      if (!content.endsWith('\n')) {
        content += '\n';
      }
      return content;
    }).join('');
    
    handleUpdateField('content', newContent);
    setDraggedIndex(null);
  };

  // Auto-grow Title Textarea to fit content precisely
  useEffect(() => {
    const titleTextarea = titleTextareaRef.current;
    if (titleTextarea) {
      titleTextarea.style.height = 'auto';
      titleTextarea.style.height = `${titleTextarea.scrollHeight}px`;
    }
  }, [article?.title]);

  const findArticleInLocalStorage = (id: string, uid: string): any => {
    const keysToTry = [
      `campaign_config_${uid}_generatedArticles`,
      'campaign_config_generatedArticles',
      'generatedArticles'
    ];
    for (const key of keysToTry) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const found = Array.isArray(parsed) ? parsed.find((a: any) => a.id === id) : null;
          if (found?.content) return found;
        }
      } catch {}
    }
    return null;
  };

  useEffect(() => {
    async function loadArticle() {
      if (!id) return;
      
      let loadedArticle: any = null;
      
      // Try to fetch from Supabase first (skip if temp id)
      let dbArticle = null;
      if (!id.startsWith('temp_')) {
        dbArticle = await fetchArticleById(id);
      }
      if (dbArticle) {
         console.log(`[Editor] Loaded from DB, content length: ${dbArticle.content?.length || 0}`);
         // ถ้า DB มีบทความแต่ content ว่าง ให้ค้น localStorage แทน
         if (!dbArticle.content || dbArticle.content.trim().length === 0) {
           console.log('[Editor] DB content is empty, searching localStorage...');
           const localArticle = await findArticleInLocalStorage(id, userId);
           if (localArticle?.content) {
             loadedArticle = localArticle;
           } else {
             loadedArticle = dbArticle;
           }
         } else {
           loadedArticle = dbArticle;
         }
       } else {
        console.log(`[Editor] DB not found for id: ${id}, searching localStorage...`);

        // Fallback: ค้นหาจาก localStorage หลาย key ที่เป็นไปได้
        const keysToTry = [
          `campaign_config_${userId}_generatedArticles`,
          'campaign_config_generatedArticles',
          'generatedArticles'
        ];
        for (const key of keysToTry) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              const found = Array.isArray(parsed) ? parsed.find((a: any) => a.id === id) : null;
              if (found) {
                loadedArticle = found;
                break;
              }
            }
          } catch {}
        }
      }

      if (loadedArticle) {
        // Extract the first image from markdown to act as cover_image ONLY if it's explicitly the AI-generated Cover Image
        const imageRegex = /!\[(?:Cover Image|Cover|ปกบทความ).*?\]\((.*?)\)/i;
        if (!loadedArticle.cover_image && loadedArticle.content) {
          const match = loadedArticle.content.match(imageRegex);
          if (match) {
            loadedArticle.cover_image = match[1];
            // Remove the cover image from the content so it doesn't show in the WYSIWYG body
            loadedArticle.content = loadedArticle.content.replace(imageRegex, '').trimStart();
          }
        }
        
        // Auto-format AI output: Fix squished lists (e.g., "1. foo 2. bar" -> newlines)
        if (loadedArticle.content) {
          loadedArticle.content = loadedArticle.content.replace(/([ก-๙a-zA-Z”"’')>])\s*((?:\*\*)?\d+\.(?:\*\*)?\s+)/g, '$1\n\n$2');
        }
        
        if (loadedArticle) {
          const typos = {
            'สุญญากาศ': 'สูญญากาศ',
            'สูญากาศ': 'สูญญากาศ',
            'มือาชีพ': 'มืออาชีพ',
            'อาหาร้อน': 'อาหารร้อน',
            'กรไกร': 'กรรไกร',
            'จาการปนเปื้อน': 'จากการปนเปื้อน',
            'จาการซีล': 'จากการซีล',
            'ต้องการะดับ': 'ต้องการระดับ',
            'ข้อควระวัง': 'ข้อควรระวัง',
            'ช่วยับยั้ง': 'ช่วยยับยั้ง',
            'การู้วิธี': 'การรู้วิธี',
            'ช่วยืนยัน': 'ช่วยยืนยัน',
            'พบ่อย': 'พบบ่อย',
            'ช่วยืด': 'ช่วยยืด',
            'โครงสร้างเซล์': 'โครงสร้างเซลล์',
            'ก่อนำ': 'ก่อนนำ',
            'ใน้ำเดือด': 'ในน้ำเดือด',
            'สนิทั้ง': 'สนิททั้ง',
            'การั่วไหล': 'การรั่วไหล',
            'รอย่น': 'รอยย่น',
            'เนื้อาหาร': 'เนื้ออาหาร',
            'เห็ดิบ': 'เห็ดดิบ',
            'หรือาจ': 'หรืออาจ',
            'อย่าง่าย': 'อย่างง่าย',
            'รอยซีลเดิมาซีล': 'รอยซีลเดิมมาซีล',
            'หนึ่งมื้น': 'หนึ่งมื้อ',
            'ออกจากัน': 'ออกจากกัน',
            'กระดูก่อน': 'กระดูกก่อน',
            'ความชื้นี้': 'ความชื้นนี้',
            'ระบไร้อากาศ': 'ระบบไร้อากาศ',
            'การักษา': 'การรักษา',
            'หรือุ่น': 'หรืออุ่น',
            'แบ Sous-vide': 'แบบ Sous-vide',
            'ถูกักไว้': 'ถูกกักไว้',
            'หรืออกซิเจน': 'หรือออกซิเจน',
            'เนื่องจาก๊าซ': 'เนื่องจากก๊าซ',
            'สามารถูกดึง': 'สามารถถูกดึง',
            'แบเรียบ': 'แบบเรียบ',
            'ขั้นตอนี้': 'ขั้นตอนนี้',
            'ตรวจับ': 'ตรวจจับ',
            'ผลัพธ์': 'ผลลัพธ์',
            'หัวดูดึง': 'หัวดูด',
            'ฟุ้ติดลงไป': 'รัดติดลงไป',
            'ดูดสุญากาศ': 'ดูดสูญญากาศ',
            'ธุรกิจำเป็น': 'ธุรกิจจำเป็น',
            'ก้อน้ำแข็ง': 'ก้อนน้ำแข็ง',
            'ฟ่างอากาศ': 'ฟองอากาศ',
            'หรือุณหภูมิ': 'หรืออุณหภูมิ',
            'อุณหูมิห้อง': 'อุณหภูมิห้อง',
            'ปากามาร์คเกอร์': 'ปากกามาร์คเกอร์',
            'แน่นิ่ง': 'แนบสนิท',
            'เปรอฝาแฝด': 'เปรอะเปื้อน',
            'แบไม่มี': 'แบบไม่มี',
            'สุญากาศ': 'สูญญากาศ',
            'เช่น้ำซุป': 'เช่นน้ำซุป',
            'เซล์': 'เซลล์',
            'ระบบบบบ': 'ระบบ',
            'ควบคุมมมม': 'ควบคุม',
            'ป้องกัน้ำ': 'ป้องกันน้ำ',
            'ประอุณหภูมิ': 'ปรับอุณหภูมิ',
            'บอบาง': 'บอบบาง',
            'ผักาดหอม': 'ผักกาดหอม',
            'เอื้อำนวย': 'เอื้ออำนวย',
            'แบเต็มที่': 'แบบเต็มที่',
            'เครื่องแบ ': 'เครื่องแบบ ',
            'แบ Nozzle': 'แบบ Nozzle',
            'แบ External': 'แบบ External',
            'แบ Chamber': 'แบบ Chamber',
            'ระบ Pulse': 'ระบบ Pulse',
            'ทิชู่': 'ทิชชู่',
            'อาจะเท': 'อาจจะเท',
            'กึ่งแข็งแข็ง': 'กึ่งแข็ง',
            'เติบโตได้อาหาร': 'เติบโตได้ อาหาร',
            'ไม่ได้การซีล': 'ไม่ได้ การซีล',
            'ปลอดภัยิ่ง': 'ปลอดภัยยิ่ง',
            'การับมือ': 'การรับมือ'
          };
          
          if (loadedArticle.content) {
            Object.keys(typos).forEach(k => {
              loadedArticle.content = loadedArticle.content.replace(new RegExp(k, 'g'), typos[k as keyof typeof typos]);
            });
          }
          if (loadedArticle.title) {
            Object.keys(typos).forEach(k => {
              loadedArticle.title = loadedArticle.title.replace(new RegExp(k, 'g'), typos[k as keyof typeof typos]);
            });
          }
        }
        setArticle(loadedArticle);

      }
    }
    loadArticle();
  }, [id, userId]);

  useEffect(() => {
    const handleGlobalCopy = async (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const container = document.createElement('div');
      for (let i = 0; i < selection.rangeCount; i++) {
        container.appendChild(selection.getRangeAt(i).cloneContents());
      }

      const images = container.querySelectorAll('img');
      let hasLocalImages = false;
      for (const img of Array.from(images)) {
        const src = img.getAttribute('src');
        if (src && (src.startsWith('gemini_img_') || src.startsWith('data:image/') || src.startsWith('http'))) {
          hasLocalImages = true;
          break;
        }
      }

      if (!hasLocalImages) return;

      e.preventDefault();

      await Promise.all(
        Array.from(images).map(async (img) => {
          let src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          if (src.startsWith('gemini_img_')) {
            const dataUri = await localforage.getItem(src);
            if (dataUri) {
              src = dataUri as string;
            }
          }
          if (src) {
            const compressed = await compressBase64Image(src, 900, 0.70);
            const publicUrl = await uploadImageToSupabase(compressed, alt);
            img.setAttribute('src', publicUrl);
          }
        })
      );

      const htmlContent = container.innerHTML;
      const textContent = selection.toString();

      if (e.clipboardData) {
        e.clipboardData.setData('text/html', htmlContent);
        e.clipboardData.setData('text/plain', textContent);
      }
    };

    document.addEventListener('copy', handleGlobalCopy);
    return () => {
      document.removeEventListener('copy', handleGlobalCopy);
    };
  }, []);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-slate-400 font-medium">กำลังโหลดบทความ...</p>
        </div>
      </div>
    );
  }

  const handleUpdateField = (field: string, value: string) => {
    latestArticleRef.current = { ...latestArticleRef.current, [field]: value };
    setArticle((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const currentArticle = latestArticleRef.current || article;
    if (!currentArticle) return;

    // Save to local state just in case
    setArticles(prev => prev.map(a => a.id === currentArticle.id ? currentArticle : a));
    
    // Save to Supabase
    try {
      let contentToSave = currentArticle.content || '';
      if (currentArticle.cover_image) {
        contentToSave = `![Cover Image](${currentArticle.cover_image})\n\n` + contentToSave;
      }
      await saveArticle(currentArticle.title, contentToSave, 'Completed', currentArticle.id);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (e) {
      console.error('Failed to save to Supabase:', e);
      alert('บันทึกในเครื่องสำเร็จ แต่ไม่สามารถบันทึกลงฐานข้อมูลได้');
    }
  };

  const handleCopyToWordNotion = async () => {
    try {
      setIsCopying(true);
      const titleHtml = `<h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem;">${article.title}</h1>`;
      const bodyHtml = await mdToHtml(article.content || '');

      const parser = new DOMParser();
      const doc = parser.parseFromString(bodyHtml, 'text/html');
      const images = doc.querySelectorAll('img');

      for (const img of Array.from(images)) {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        if (src) {
          const compressed = await compressBase64Image(src, 900, 0.70);
          const publicUrl = await uploadImageToSupabase(compressed, alt);
          img.setAttribute('src', publicUrl);
        }
      }

      const combinedHtml = `${titleHtml}\n${doc.body.innerHTML}`;
      const plainText = `# ${article.title}\n\n${article.content || ''}`;

      // Try passing a Promise if supported, otherwise standard Blob. This avoids NotAllowedError on long uploads.
      const clipboardItemPayload: Record<string, any> = {};
      
      const htmlBlob = new Blob([combinedHtml], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      
      clipboardItemPayload['text/html'] = htmlBlob;
      clipboardItemPayload['text/plain'] = textBlob;

      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem(clipboardItemPayload)
        ]);
        alert('✨ คัดลอกบทความและอัปโหลดรูปไปยัง Supabase เรียบร้อยแล้ว!\nคุณสามารถเปิด Microsoft Word หรือ Notion แล้วกด Ctrl+V วางได้เลยครับ 🚀');
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (e) {
      console.error('Failed to copy', e);
      alert('ขออภัย! เกิดข้อผิดพลาดในการคัดลอก หรือใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans overflow-hidden relative selection:bg-emerald-500/30 selection:text-emerald-900 text-slate-800">
      {/* Immersive Animated Background (Light Mode Smoky Aurora) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-[100%] bg-emerald-400/20 blur-[120px] mix-blend-multiply animate-pulse-slow opacity-80" style={{ transform: 'rotate(-15deg)' }}></div>
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[80%] rounded-[100%] bg-teal-400/20 blur-[140px] mix-blend-multiply animate-pulse-slow opacity-70" style={{ animationDelay: '2s', transform: 'rotate(25deg)' }}></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[60%] rounded-[100%] bg-cyan-400/15 blur-[130px] mix-blend-multiply animate-pulse-slow opacity-60" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-[10%] left-[40%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-[100px] mix-blend-multiply"></div>
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Floating Header */}
      <div className="px-6 sm:px-8 pt-6 pb-2 z-50">
        <header className="h-20 bg-white/70 backdrop-blur-3xl border border-slate-200/60 rounded-[2rem] px-6 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="w-12 h-12 bg-slate-100/50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md rounded-2xl transition-all shadow-sm border border-slate-200/50">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] text-white flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <Sparkles className="w-6 h-6 relative z-10" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Workspace</h1>
                <div className="flex items-center gap-2">
                  <Link to="/dashboard" className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">Overview</Link>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{article?.title || 'Untitled'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isAdmin && (
            <div className="hidden sm:flex items-center gap-4 mr-2">
              <Badge variant="secondary" className="bg-slate-800/80 backdrop-blur text-emerald-400 border-0 shadow-sm px-4 py-2.5 rounded-2xl font-black tracking-tight flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                527 Credits
              </Badge>
              <div className="h-8 w-px bg-slate-700/60"></div>
            </div>
            )}
            <Button onClick={handleSave} className="h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] font-bold transition-all flex items-center gap-2 border border-emerald-400 hover:scale-105">
              <Save className="w-4 h-4" /> <span className="hidden sm:inline">บันทึก</span>
            </Button>
            <Button variant="ghost" className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl p-0 flex items-center justify-center text-slate-400 hover:text-white shadow-sm border border-white/5 transition-all">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 sm:p-6 pt-2 gap-6 z-10">
        {/* Left Sidebar (Mini-explorer) */}
        <aside className="w-16 md:w-[280px] bg-white/70 backdrop-blur-3xl border border-slate-200/60 rounded-[2rem] hidden sm:flex flex-col shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-5 space-y-6">
            <nav className="space-y-2">
              <Link to="/dashboard" className="flex items-center gap-4 px-4 py-3 rounded-[1.25rem] text-slate-500 hover:bg-slate-100 hover:shadow-sm hover:text-emerald-600 transition-all font-bold text-sm border border-transparent group">
                <Layout className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Overview</span>
              </Link>
              <div className="pt-6">
                <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 hidden md:block">Content Architecture</p>
                <Link to="/articles" className="flex items-center gap-4 px-4 py-3 rounded-[1.25rem] bg-emerald-50 shadow-sm border border-emerald-100 text-emerald-600 transition-all font-bold text-sm mb-4 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-100/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                  <AlignLeft className="w-5 h-5 relative z-10" />
                  <span className="hidden md:inline relative z-10">All Articles</span>
                </Link>
                <div className="md:pl-6 space-y-2 mt-4 hidden md:block h-[calc(100vh-360px)] overflow-y-auto hide-scrollbar relative">
                  <div className="absolute left-[13px] top-6 bottom-10 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 relative bg-white rounded-xl shadow-sm border border-slate-200/50">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute left-[-8px] ring-4 ring-slate-50 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                    <span className="truncate font-black text-slate-900 tracking-tight">{article?.title || 'Outline'}</span>
                  </div>
                  <div className="pl-3 pr-1 space-y-1 mt-3 pb-10" onDragLeave={handleDragLeave}>
                    {outlineSections.map((sec, idx) => (
                      <div key={idx} className="relative">
                        {dragOverInfo?.index === idx && dragOverInfo.position === 'top' && (
                          <div className="h-0.5 bg-emerald-400 rounded-full w-full absolute top-0 z-10" />
                        )}
                        <div 
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-grab active:cursor-grabbing hover:bg-slate-100/80 hover:shadow-sm border border-transparent hover:border-slate-200/50 relative ${draggedIndex === idx ? 'opacity-30' : ''}`}
                        >
                          <div className={`absolute left-[-13px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-slate-50 ${sec.level === 3 ? 'bg-slate-300' : 'bg-slate-400'}`}></div>
                          <span className={`text-[13px] truncate font-bold ${sec.level === 3 ? 'pl-4 text-slate-400' : 'text-slate-700'}`} title={sec.title}>
                            {sec.title}
                          </span>
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1 bg-white backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 p-0.5 absolute right-1">
                            <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="text-slate-500 hover:text-emerald-600 disabled:opacity-30 p-1 rounded hover:bg-slate-50 transition-colors">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => moveSection(idx, 'down')} disabled={idx === outlineSections.length - 1} className="text-slate-500 hover:text-emerald-600 disabled:opacity-30 p-1 rounded hover:bg-slate-50 transition-colors">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {dragOverInfo?.index === idx && dragOverInfo.position === 'bottom' && (
                          <div className="h-0.5 bg-emerald-400 rounded-full w-full absolute bottom-0 z-10" />
                        )}
                      </div>
                    ))}
                    {outlineSections.length === 0 && (
                      <div className="px-4 py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[12px] font-bold text-slate-400">No headings found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Editor Component */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white/80 backdrop-blur-3xl border border-slate-200/60 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] relative">
          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-14 lg:px-20 flex flex-col hide-scrollbar relative z-10">
            <div className="mx-auto w-full max-w-4xl space-y-10">
              {/* Clean Info Header */}
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-6 shrink-0 -mt-10 bg-white/90 backdrop-blur-2xl -mx-6 px-6 sm:-mx-14 sm:px-14 lg:-mx-20 lg:px-20 pt-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 bg-slate-100/80 p-1.5 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] -ml-2 -my-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className={`h-9 px-4 text-xs font-bold rounded-xl transition-all ${!isEditing
                          ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        }`}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> ดูตัวอย่าง (Preview)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className={`h-9 px-4 text-xs font-bold rounded-xl transition-all ${isEditing
                          ? "bg-white text-emerald-600 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        }`}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> แก้ไขสด (Edit)
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToWordNotion}
                    disabled={isCopying}
                    className="h-10 px-4 text-xs font-bold text-slate-600 hover:text-emerald-600 hover:scale-[1.02] border-slate-200 bg-white hover:bg-slate-50 rounded-xl shadow-sm transition-all flex items-center gap-2 ml-4 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isCopying ? (
                      <><div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> กำลังอัปโหลด...</>
                    ) : (
                      <><Copy className="w-4 h-4 text-purple-500 animate-pulse" /> คัดลอกไป Word/Notion ✨</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Unified Styled Article Body */}
              <div className="space-y-10 animate-fade-in pr-2">
                {/* Title Area - Editable directly in place with textarea */}
                <div className="space-y-4">
                  {isEditing ? (
                    <textarea
                      ref={titleTextareaRef}
                      rows={1}
                      value={article.title || ''}
                      onChange={(e) => handleUpdateField('title', e.target.value)}
                      className="w-full text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-snug border-0 border-b-2 border-dashed border-slate-200 focus:border-emerald-500 hover:bg-slate-50 p-4 -ml-4 rounded-2xl transition-all focus-visible:ring-0 resize-none bg-transparent outline-none focus:outline-none placeholder:text-slate-300 font-sans overflow-hidden"
                      placeholder="ชื่อบทความ (Article Title)..."
                    />
                  ) : (
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-snug font-sans">
                      {article.title || 'Untitled Article'}
                    </h1>
                  )}

                  {/* Details row matching Preview exactly */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold font-sans tracking-wide uppercase">
                    <span>วันที่สร้าง: {article.date || new Date().toLocaleDateString('th-TH')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl shadow-sm">Keyword: {article.keyword || 'None'}</span>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {isEditing ? (
                  <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-2 shadow-inner">
                    <WysiwygEditor
                      content={article.content || ''}
                      onChange={(markdown) => handleUpdateField('content', markdown)}
                    />
                  </div>
                ) : (
                  <div className="markdown-body max-w-none text-lg leading-relaxed text-slate-700 font-sans pb-16">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        img: MarkdownImage
                      }}
                    >
                      {article.content || ''}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar (Controls) */}
          <aside className="w-full md:w-[320px] bg-white/60 backdrop-blur-3xl border-l border-slate-200/60 py-8 px-8 overflow-y-auto space-y-10 hide-scrollbar z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] relative">
            {/* Action Header in Sidebar */}
            <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-4">
              <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">Publish Settings</span>
              <Settings className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-sm font-black text-slate-700 flex items-center justify-between">
                  Tags
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 justify-between text-slate-600 font-bold text-xs border border-slate-200 bg-white hover:bg-slate-50 rounded-2xl shadow-sm transition-all">
                    Select tag <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                  <Button variant="outline" className="h-12 justify-center text-emerald-600 font-bold text-xs border border-dashed border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 rounded-2xl transition-all">
                    + New Tag
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-black text-slate-700">Focus Keyword</Label>
                <Input
                  value={article.keyword || ''}
                  onChange={(e) => handleUpdateField('keyword', e.target.value)}
                  placeholder="Enter main keyword..."
                  className="h-12 bg-white border border-slate-200 shadow-sm rounded-2xl text-sm font-medium text-slate-900 focus-visible:ring-emerald-500/30 focus-visible:ring-4 focus-visible:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-black text-slate-700">Meta Description</Label>
                <Textarea
                  value={article.meta_description || ''}
                  onChange={(e) => handleUpdateField('meta_description', e.target.value)}
                  placeholder="Brief summary for search results..."
                  className="min-h-[140px] p-4 resize-none bg-white border border-slate-200 shadow-sm rounded-2xl text-sm leading-relaxed font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500/30 focus-visible:ring-4 focus-visible:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-black text-slate-700">Featured Image</Label>
                <div 
                  className="aspect-video bg-white rounded-[1.5rem] overflow-hidden relative group border border-slate-200 shadow-sm cursor-pointer"
                >
                  <div className="w-full h-full overflow-hidden relative">
                    <MarkdownImage
                      src={article?.cover_image || ''}
                      alt="Cover"
                      className="w-full h-full object-cover m-0 shadow-none"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-all duration-300 backdrop-blur-sm">
                      <Button onClick={() => setIsImageModalOpen(true)} className="bg-white/90 text-slate-900 hover:bg-white px-4 py-2 rounded-xl font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> ดูภาพเต็ม
                      </Button>
                      <Button onClick={() => setFeaturedImageModalOpen(true)} className="bg-emerald-600/90 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> เปลี่ยนรูปภาพ
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 space-y-4 border-t border-slate-200">
                <Button onClick={handleSave} className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:scale-[1.02]">
                  <Send className="w-4 h-4 mr-2" /> Publish Article
                </Button>
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="outline" className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 shadow-sm transition-all group">
                    <DownloadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 shadow-sm transition-all group">
                    <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 shadow-sm transition-all ml-auto group">
                    <MoreVertical className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
      
      {/* Save Success Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-white text-slate-900 px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-green-500/20 p-1.5 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-[14px] font-bold">บันทึกเสร็จสิ้น</p>
            <p className="text-[12px] text-slate-700">อัปเดตบทความลงฐานข้อมูลเรียบร้อยแล้ว</p>
          </div>
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-5xl bg-transparent border-0 shadow-none p-0 flex items-center justify-center overflow-hidden">
          <div className="relative group w-full flex justify-center">
            <MarkdownImage 
              src={article?.cover_image || ''} 
              alt="Full Cover" 
              className="max-w-full max-h-[85vh] rounded-[2rem] shadow-2xl object-contain border-4 border-white/20"
              style={{ margin: 0, boxShadow: 'none' }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Featured Image Editor Modal */}
      <Dialog open={featuredImageModalOpen} onOpenChange={setFeaturedImageModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4">เปลี่ยนรูปภาพปก (Featured Image)</h3>
          
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="url" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">URL</TabsTrigger>
              <TabsTrigger value="upload" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">อัปโหลด</TabsTrigger>
              <TabsTrigger value="ai" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">AI</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <p className="text-sm text-slate-500">ระบุ URL ของรูปภาพปกใหม่</p>
              <Input 
                value={featuredImageUrlInput} 
                onChange={(e) => setFeaturedImageUrlInput(e.target.value)} 
                placeholder="https://example.com/image.jpg"
                className="h-12 rounded-xl bg-slate-50 border-slate-200"
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && featuredImageUrlInput !== 'https://') { 
                    handleUpdateField('cover_image', featuredImageUrlInput); 
                    setFeaturedImageModalOpen(false); 
                  } 
                }}
              />
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={() => setFeaturedImageModalOpen(false)} className="rounded-xl">ยกเลิก</Button>
                <Button onClick={() => { if (featuredImageUrlInput !== 'https://') { handleUpdateField('cover_image', featuredImageUrlInput); setFeaturedImageModalOpen(false); } }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">ตั้งเป็นภาพปก</Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <p className="text-sm text-slate-500">อัปโหลดรูปภาพจากเครื่องของคุณ</p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 relative hover:bg-slate-100 transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-600">{isProcessingFeaturedImage ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                  disabled={isProcessingFeaturedImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsProcessingFeaturedImage(true);
                    try {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64data = reader.result as string;
                        const url = await uploadImageToSupabase(base64data);
                        handleUpdateField('cover_image', url);
                        setFeaturedImageModalOpen(false);
                        setIsProcessingFeaturedImage(false);
                      };
                      reader.readAsDataURL(file);
                    } catch (err) {
                      console.error(err);
                      setIsProcessingFeaturedImage(false);
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <p className="text-sm text-slate-500">สร้างภาพปกใหม่ด้วย AI (Seeddream)</p>
              <Textarea 
                value={featuredImageAiPrompt} 
                onChange={(e) => setFeaturedImageAiPrompt(e.target.value)} 
                placeholder="อธิบายภาพปกที่คุณต้องการ..."
                className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200"
              />
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="ghost" onClick={() => setFeaturedImageModalOpen(false)} className="rounded-xl">ยกเลิก</Button>
                <Button 
                  disabled={isProcessingFeaturedImage || !featuredImageAiPrompt.trim()} 
                  onClick={async () => {
                    if (!featuredImageAiPrompt.trim()) return;
                    setIsProcessingFeaturedImage(true);
                    try {
                      const response = await fetch('/api/seeddream-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: featuredImageAiPrompt })
                      });
                      const data = await response.json();
                      if (!response.ok || !data.url) throw new Error(data.error || "Failed to generate image");

                      const finalUrl = await uploadImageToSupabase(data.url, featuredImageAiPrompt);
                      handleUpdateField('cover_image', finalUrl);
                      setFeaturedImageModalOpen(false);
                    } catch (err) {
                      console.error(err);
                      alert('เกิดข้อผิดพลาดในการสร้างภาพ: ' + (err instanceof Error ? err.message : 'Unknown error'));
                    }
                    setIsProcessingFeaturedImage(false);
                  }} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-2"
                >
                  {isProcessingFeaturedImage ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังสร้างภาพ...</>
                  ) : (
                    '✨ สร้างเป็นภาพปก'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
