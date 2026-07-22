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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    }
  }, [src]);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      style={{ maxWidth: '100%', borderRadius: '12px', margin: '1.5rem auto', display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
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
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword)}?width=800&height=450&nologo=true`;
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

  return turndownService.turndown(html);
};

interface WysiwygEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

const WysiwygEditor = ({ content, onChange }: WysiwygEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef<boolean>(false);
  const lastContentRef = useRef<string>('');

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
    const url = prompt('ใส่ลิงก์ปลายทาง (Enter URL):', 'https://');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleImage = () => {
    const url = prompt('ใส่ที่อยู่ลิงก์รูปภาพ (Enter Image URL):', 'https://');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Premium WYSIWYG Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-900 text-white p-1.5 rounded-xl shadow-lg w-fit overflow-x-auto no-scrollbar shrink-0 sticky top-4 z-40 my-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock('<h2>')}
          className="h-8 px-2.5 hover:bg-slate-800 text-slate-300 font-bold text-xs"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock('<h3>')}
          className="h-8 px-2.5 hover:bg-slate-800 text-slate-300 font-bold text-xs"
        >
          H3
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock('<p>')}
          className="h-8 px-2 text-slate-300 hover:bg-slate-800"
          title="ย่อหน้าปกติ"
        >
          <Type className="w-3.5 h-3.5" />
        </Button>

        <Separator orientation="vertical" className="h-4 bg-slate-700 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('bold')}
          className="h-8 px-2.5 hover:bg-slate-800 text-slate-300 font-extrabold text-xs"
        >
          B
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('italic')}
          className="h-8 px-2.5 hover:bg-slate-800 text-slate-300 italic text-xs"
        >
          I
        </Button>

        <Separator orientation="vertical" className="h-4 bg-slate-700 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertUnorderedList')}
          className="h-8 px-2 hover:bg-slate-800 text-slate-300"
          title="รายการแบบสัญลักษณ์"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertOrderedList')}
          className="h-8 px-2 hover:bg-slate-800 text-slate-300 font-bold text-[10px]"
          title="รายการแบบตัวเลข"
        >
          1.
        </Button>

        <Separator orientation="vertical" className="h-4 bg-slate-700 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          className="h-8 px-2 hover:bg-slate-800 text-slate-300"
          title="ลิงก์"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImage}
          className="h-8 px-2 hover:bg-slate-800 text-slate-300"
          title="รูปภาพ"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatBlock('<blockquote>')}
          className="h-8 px-2 hover:bg-slate-800 text-slate-300 italic font-serif text-sm"
          title="อ้างอิง"
        >
          ""
        </Button>
      </div>

      {/* Editor Main Content Area */}
      <div className="border border-slate-100/80 rounded-2xl p-6 bg-white hover:bg-white/90 transition-colors focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-300 shadow-sm">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="w-full min-h-[500px] outline-none text-[17px] leading-relaxed text-slate-800 font-sans pb-32 focus:outline-none select-text markdown-body empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 before:pointer-events-none"
          data-placeholder="เขียนบทความของคุณตรงนี้..."
          style={{ wordBreak: 'break-word' }}
        />
      </div>
    </div>
  );
};

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [articles, setArticles] = usePersistentState<any[]>('campaign_config_generatedArticles', []);
  const [article, setArticle] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ index: number, position: 'top' | 'bottom' } | null>(null);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);

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

  useEffect(() => {
    async function loadArticle() {
      if (!id) return;
      
      let loadedArticle: any = null;
      
      // Try to fetch from Supabase first
      const dbArticle = await fetchArticleById(id);
      if (dbArticle) {
        loadedArticle = dbArticle;
      } else if (articles.length > 0) {
        // Fallback to local storage if not found in DB
        const found = articles.find(a => a.id === id);
        if (found) {
          loadedArticle = found;
        }
      }

      if (loadedArticle) {
        // Extract the first image from markdown to act as cover_image
        const imageRegex = /!\[.*?\]\((.*?)\)/;
        if (!loadedArticle.cover_image && loadedArticle.content) {
          const match = loadedArticle.content.match(imageRegex);
          if (match) {
            loadedArticle.cover_image = match[1];
            // Remove the first image from the content so it doesn't show in the WYSIWYG body
            loadedArticle.content = loadedArticle.content.replace(imageRegex, '').replace(/^\s*[\r\n]/gm, '');
          }
        }
        
        // Auto-format AI output: Fix squished lists (e.g., "1. foo 2. bar" -> newlines)
        if (loadedArticle.content) {
          loadedArticle.content = loadedArticle.content.replace(/([ก-๙a-zA-Z”"’')>])\s*((?:\*\*)?\d+\.(?:\*\*)?\s+)/g, '$1\n\n$2');
        }
        
        setArticle(loadedArticle);
      }
    }
    loadArticle();
  }, [id, articles]);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-slate-500 font-medium">กำลังโหลดบทความ...</p>
        </div>
      </div>
    );
  }

  const handleUpdateField = (field: string, value: string) => {
    setArticle((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Save to local state just in case
    setArticles(prev => prev.map(a => a.id === article.id ? article : a));
    
    // Save to Supabase
    try {
      await saveArticle(article.title, article.content, 'Completed', article.id);
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
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[17px] font-semibold text-slate-900 leading-tight">Default Workspace</h1>
              <p className="text-[13px] text-slate-500 font-medium">แคมเปญอัตโนมัติ (Default Campaign)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAdmin && (
          <>
            <Badge variant="secondary" className="bg-[#52c41a1a] text-[#52c41a] hover:bg-[#52c41a1a] border-0 px-3 py-1 rounded-full font-medium hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#52c41a]" />
              527 Credits
            </Badge>
            <Button variant="outline" size="sm" className="hidden border-slate-200 text-slate-600 font-semibold md:flex">
              Upgrade
            </Button>
          </>
          )}
          <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
          <Button onClick={handleSave} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm px-4">
            <Save className="w-4 h-4 mr-1.5" />
            บันทึก
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Breadcrumb row */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center gap-2 text-[13px]">
        <Link to="/dashboard" className="text-slate-500 hover:text-purple-600 transition-colors">Overview</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Link to="/campaigns" className="text-slate-500 hover:text-purple-600 transition-colors">Content</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-800 font-medium truncate">{article.title}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Mini-explorer) */}
        <aside className="w-16 md:w-56 bg-white border-r border-slate-100 hidden sm:flex flex-col shrink-0">
          <div className="p-4 space-y-6">
            <nav className="space-y-1">
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium text-[14px]">
                <Layout className="w-5 h-5" />
                <span className="hidden md:inline">Overview</span>
              </Link>
              <div className="pt-2">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 hidden md:block">Content</p>
                <Link to="/articles" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-50 text-purple-700 transition-all font-medium text-[14px]">
                  <AlignLeft className="w-5 h-5" />
                  <span className="hidden md:inline">All Articles</span>
                </Link>
                <div className="md:pl-6 space-y-1 mt-1 hidden md:block h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
                  <div className="flex items-center gap-3 px-3 py-2 text-[14px] text-slate-500">
                    <span className="w-1 h-8 bg-slate-200 rounded-full" />
                    <span className="truncate font-medium text-slate-700">{article.title || 'Article Outline'}</span>
                  </div>
                  <div className="pl-1 pr-1 space-y-0.5 mt-1 pb-10" onDragLeave={handleDragLeave}>
                    {outlineSections.map((sec, idx) => (
                      <div key={idx}>
                        {dragOverInfo?.index === idx && dragOverInfo.position === 'top' && (
                          <div className="h-0.5 bg-purple-500 rounded-full w-full" />
                        )}
                        <div 
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`group flex items-center justify-between px-2 py-1.5 rounded-lg transition-all cursor-grab active:cursor-grabbing hover:bg-slate-50 ${draggedIndex === idx ? 'opacity-30' : ''}`}
                        >
                          <span className={`text-[12.5px] truncate text-slate-600 ${sec.level === 3 ? 'pl-3 text-slate-400' : ''}`} title={sec.title}>
                            {sec.title}
                          </span>
                          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1">
                            <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-purple-600 disabled:opacity-30 p-1">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => moveSection(idx, 'down')} disabled={idx === outlineSections.length - 1} className="text-slate-300 hover:text-purple-600 disabled:opacity-30 p-1">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {dragOverInfo?.index === idx && dragOverInfo.position === 'bottom' && (
                          <div className="h-0.5 bg-purple-500 rounded-full w-full" />
                        )}
                      </div>
                    ))}
                    {outlineSections.length === 0 && (
                      <p className="px-3 text-[12px] text-slate-400 italic">No headings found</p>
                    )}
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Editor Component */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#FAFAFC]">
          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12 bg-white flex flex-col scrollbar-hide">
            <div className="mx-auto w-full max-w-4xl space-y-8">
              {/* Clean Info Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl -ml-2 -my-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                      }}
                      className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all ${!isEditing
                          ? "bg-white text-purple-700 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      <Eye className="w-3 h-3 mr-1" /> ดูตัวอย่าง
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className={`h-7 px-3 text-xs font-semibold rounded-lg transition-all ${isEditing
                          ? "bg-white text-purple-700 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> แก้ไขสด
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToWordNotion}
                    disabled={isCopying}
                    className="h-7 px-3 text-xs font-bold text-slate-700 hover:text-purple-700 hover:scale-[1.02] border-slate-200 hover:border-purple-200 hover:bg-purple-50/40 rounded-lg transition-all flex items-center gap-1.5 ml-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isCopying ? (
                      <><div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> กำลังอัปโหลด...</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5 text-purple-650 animate-pulse" /> คัดลอกไป Word/Notion ✨</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Unified Styled Article Body */}
              <div className="space-y-8 animate-fade-in pr-2">
                {/* Title Area - Editable directly in place with textarea */}
                <div className="space-y-3">
                  {isEditing ? (
                    <textarea
                      ref={titleTextareaRef}
                      rows={1}
                      value={article.title || ''}
                      onChange={(e) => handleUpdateField('title', e.target.value)}
                      className="w-full text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug border-0 border-b border-dashed border-slate-200 focus:border-purple-300 hover:bg-slate-50/50 p-2 -ml-2 rounded-xl transition-all focus-visible:ring-0 resize-none bg-transparent outline-none focus:outline-none placeholder:text-slate-300 font-sans overflow-hidden"
                      placeholder="ชื่อบทความ (Article Title)..."
                    />
                  ) : (
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug font-sans">
                      {article.title || 'Untitled Article'}
                    </h1>
                  )}

                  {/* Details row matching Preview exactly */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium font-sans">
                    <span>วันที่สร้าง: {article.date || new Date().toLocaleDateString('th-TH')}</span>
                    <span>•</span>
                    <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-bold">คีย์เวิร์ด: {article.keyword}</span>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {isEditing ? (
                  <WysiwygEditor
                    content={article.content || ''}
                    onChange={(markdown) => handleUpdateField('content', markdown)}
                  />
                ) : (
                  <div className="markdown-body max-w-none text-[17px] leading-relaxed text-slate-800 font-sans pb-16">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
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
          <aside className="w-full md:w-80 bg-white border-l border-slate-100 py-6 px-5 overflow-y-auto space-y-8 scrollbar-hide">
            {/* Action Header in Sidebar */}
            <div className="flex items-center gap-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="text-purple-600 border-b-2 border-purple-600 pb-1">Details</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-bold text-slate-700">Tags</Label>
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-9 justify-between text-slate-500 font-medium text-[13px] border-slate-100 bg-slate-50 rounded-lg">
                    Select a tag <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 justify-start text-slate-300 font-medium text-[13px] border-slate-100 bg-white dashed rounded-lg">
                    Create new tag
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700">Focus Keyword</Label>
                <Input
                  value={article.keyword || ''}
                  onChange={(e) => handleUpdateField('keyword', e.target.value)}
                  className="h-10 bg-slate-50 border-slate-100 rounded-lg text-[13px] font-medium text-slate-800"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700">Meta Description</Label>
                <Textarea
                  value={article.meta_description || ''}
                  onChange={(e) => handleUpdateField('meta_description', e.target.value)}
                  placeholder="Enter meta description here..."
                  className="min-h-[140px] text-[13px] leading-relaxed bg-slate-50 border-slate-100 rounded-lg text-slate-600 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[13px] font-bold text-slate-700">Featured Image</Label>
                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden relative group">
                  <MarkdownImage
                    src={article.cover_image || `https://image.pollinations.ai/prompt/realistic-photo-for-${(article.keyword || 'article').replace(/ /g, '-')}-workspace-warehouse?width=800&height=450&nologo=true`}
                    alt="Cover"
                    className="w-full h-full object-cover m-0 rounded-none shadow-none"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90 font-bold rounded-full">
                      Change Image
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button onClick={handleSave} className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200">
                  <Send className="w-4 h-4 mr-2" /> Publish Article
                </Button>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-11 w-11 rounded-xl bg-white border-slate-200 text-slate-500">
                    <DownloadCloud className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-11 w-11 rounded-xl bg-white border-slate-200 text-slate-500">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-11 w-11 rounded-xl bg-white border-slate-200 text-slate-500 ml-auto">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
      
      {/* Save Success Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-green-500/20 p-1.5 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-[14px] font-bold">บันทึกเสร็จสิ้น</p>
            <p className="text-[12px] text-slate-300">อัปเดตบทความลงฐานข้อมูลเรียบร้อยแล้ว</p>
          </div>
        </div>
      )}
    </div>
  );
}
