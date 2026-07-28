import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Plus, FileText, User, Sparkles, LogOut, Menu, X, Users, Loader2, Map } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { motion, AnimatePresence } from 'framer-motion';

interface AppLayoutProps {
  children: React.ReactNode;
  user?: any;
}

export default function AppLayout({ children, user: initialUser }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(initialUser);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    if (!initialUser) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setUser(user);
      }).catch(() => {});
    }
  }, [initialUser]);


  useEffect(() => {
    try {
      if (localStorage.getItem('typo_migration_v2_done')) return;
      
      const wrongWords = [
        [/สุญญากาศ/g, 'สูญญากาศ'],
        [/สูญากาศ/g, 'สูญญากาศ'],
        [/มือาชีพ/g, 'มืออาชีพ'],
        [/อาหาร้อน/g, 'อาหารร้อน'],
        [/กรไกร/g, 'กรรไกร'],
        [/จาการปนเปื้อน/g, 'จากการปนเปื้อน'],
        [/จาการซีล/g, 'จากการซีล'],
        [/ต้องการะดับ/g, 'ต้องการระดับ'],
        [/ข้อควระวัง/g, 'ข้อควรระวัง'],
        [/ช่วยับยั้ง/g, 'ช่วยยับยั้ง'],
        [/การู้วิธี/g, 'การรู้วิธี'],
        [/ช่วยืนยัน/g, 'ช่วยยืนยัน'],
        [/พบ่อย/g, 'พบบ่อย'],
        [/ช่วยืด/g, 'ช่วยยืด'],
        [/โครงสร้างเซล์/g, 'โครงสร้างเซลล์'],
        [/ก่อนำ/g, 'ก่อนนำ'],
        [/ใน้ำเดือด/g, 'ในน้ำเดือด'],
        [/สนิทั้ง/g, 'สนิททั้ง'],
        [/การั่วไหล/g, 'การรั่วไหล'],
        [/รอย่น/g, 'รอยย่น'],
        [/เนื้อาหาร/g, 'เนื้ออาหาร'],
        [/เห็ดิบ/g, 'เห็ดดิบ'],
        [/หรือาจ/g, 'หรืออาจ'],
        [/อย่าง่าย/g, 'อย่างง่าย'],
        [/รอยซีลเดิมาซีล/g, 'รอยซีลเดิมมาซีล'],
        [/หนึ่งมื้น/g, 'หนึ่งมื้อ'],
        [/ออกจากัน/g, 'ออกจากกัน'],
        [/กระดูก่อน/g, 'กระดูกก่อน'],
        [/ความชื้นี้/g, 'ความชื้นนี้'],
        [/ระบไร้อากาศ/g, 'ระบบไร้อากาศ'],
        [/การักษา/g, 'การรักษา'],
        [/หรือุ่น/g, 'หรืออุ่น'],
        [/แบ Sous-vide/g, 'แบบ Sous-vide'],
        [/ถูกักไว้/g, 'ถูกกักไว้'],
        [/หรืออกซิเจน/g, 'หรือออกซิเจน'],
        [/เนื่องจาก๊าซ/g, 'เนื่องจากก๊าซ'],
        [/สามารถูกดึง/g, 'สามารถถูกดึง'],
        [/แบเรียบ/g, 'แบบเรียบ'],
        [/ขั้นตอนี้/g, 'ขั้นตอนนี้'],
        [/ตรวจับ/g, 'ตรวจจับ']
      ];
      
      let changedGlobal = false;
      const keys = ['campaign_config_generatedArticles', 'generatedArticles'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('campaign_config') || key.includes('generatedArticles'))) {
          const item = localStorage.getItem(key);
          if (item) {
            let str = item;
            let changed = false;
            for (const [pattern, replacement] of wrongWords) {
              const oldStr = str;
              str = str.replace(pattern, replacement as string);
              if (oldStr !== str) changed = true;
            }
            if (changed) {
              localStorage.setItem(key, str);
              changedGlobal = true;
            }
          }
        }
      }
      
      localStorage.setItem('typo_migration_v2_done', 'true');
      if (changedGlobal) {
        window.location.reload();
      }
    } catch (e) {}
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "ภาพรวม" },
    { to: "/campaign/new", icon: Plus, label: "สร้างแคมเปญ" },
    { to: "/articles", icon: FileText, label: "บทความ" },
    { to: "/topical-map", icon: Map, label: "Topical Map" }
  ];

  if (isAdmin) {
    navLinks.push({ to: "/admin", icon: Users, label: "แอดมิน" });
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50/50 font-sans text-slate-900 selection:bg-emerald-500/20 flex flex-col relative overflow-x-hidden">
      
      {/* Decorative Background Gradients (Light Smoky Aurora) */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none bg-slate-50" style={{ zIndex: 0 }}>
        <svg className="absolute w-full h-full opacity-60" preserveAspectRatio="none" viewBox="0 0 1440 800">
          <defs>
            <linearGradient id="smoke-grad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="smoke-grad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="smoke-grad3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow-heavy" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="35" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="20" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base thick ribbon */}
          <motion.path
            fill="none"
            stroke="url(#smoke-grad3)"
            strokeWidth="60"
            filter="url(#glow-heavy)"
            style={{ mixBlendMode: 'multiply' }}
            d="M -100,800 C 300,700 400,300 800,400 C 1100,450 1300,100 1540,50"
            animate={{ 
              opacity: [0.5, 1, 0.5],
              d: [
                "M -100,800 C 300,700 400,300 800,400 C 1100,450 1300,100 1540,50",
                "M -100,750 C 350,650 350,350 750,450 C 1150,550 1250,50 1540,100",
                "M -100,800 C 300,700 400,300 800,400 C 1100,450 1300,100 1540,50"
              ]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Main bright ribbon */}
          <motion.path
            fill="none"
            stroke="url(#smoke-grad1)"
            strokeWidth="40"
            filter="url(#glow-soft)"
            style={{ mixBlendMode: 'multiply' }}
            d="M -100,900 C 200,600 500,500 850,300 C 1150,150 1350,200 1540,-50"
            animate={{ 
              opacity: [0.5, 0.8, 0.5],
              d: [
                "M -100,900 C 200,600 500,500 850,300 C 1150,150 1350,200 1540,-50",
                "M -100,950 C 250,550 450,550 800,250 C 1200,100 1300,250 1540,0",
                "M -100,900 C 200,600 500,500 850,300 C 1150,150 1350,200 1540,-50"
              ]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Secondary top ribbon */}
          <motion.path
            fill="none"
            stroke="url(#smoke-grad2)"
            strokeWidth="30"
            filter="url(#glow-soft)"
            style={{ mixBlendMode: 'multiply' }}
            d="M -100,600 C 350,750 600,150 1000,250 C 1300,300 1400,-50 1540,-100"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              d: [
                "M -100,600 C 350,750 600,150 1000,250 C 1300,300 1400,-50 1540,-100",
                "M -100,550 C 300,800 650,100 1050,300 C 1250,250 1450,-100 1540,-50",
                "M -100,600 C 350,750 600,150 1000,250 C 1300,300 1400,-50 1540,-100"
              ]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Subtle fill behind */}
          <motion.path
            fill="url(#smoke-grad1)"
            opacity="0.1"
            style={{ mixBlendMode: 'multiply' }}
            d="M -100,900 C 200,600 500,500 850,300 C 1150,150 1350,200 1540,-50 L 1540,800 L -100,800 Z"
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Floating Top Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-4 md:top-6 z-50 mx-4 md:mx-auto max-w-6xl w-[calc(100%-2rem)] bg-white/70 backdrop-blur-xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between"
      >
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg md:text-xl text-slate-800">
          <div className="bg-emerald-100 p-1.5 md:p-2 rounded-xl text-emerald-600">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span>Seo<span className="text-emerald-500 font-light ml-1">Cipher</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
          {navLinks.map(link => {
            const isActive = location.pathname.startsWith(link.to) && (link.to !== '/dashboard' || location.pathname === '/dashboard');
            return (
              <Link 
                key={link.to}
                to={link.to} 
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                  isActive 
                    ? 'bg-white shadow-sm text-emerald-600 font-semibold' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <link.icon className="w-4 h-4" /> {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-right mr-2">
            <p className="text-sm font-semibold text-slate-800">{user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-slate-500">บัญชีผู้ใช้</p>
          </div>
          <button onClick={handleSignOut} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 flex items-center justify-center transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-20 left-4 right-4 z-40 bg-white border border-slate-100 rounded-3xl p-4 shadow-xl shadow-slate-200/50 flex flex-col gap-2"
          >
            {navLinks.map(link => {
              const isActive = location.pathname.startsWith(link.to) && (link.to !== '/dashboard' || location.pathname === '/dashboard');
              return (
                <Link 
                  key={link.to}
                  to={link.to} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className={`px-4 py-3 rounded-2xl font-medium flex items-center gap-3 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" /> {link.label}
                </Link>
              );
            })}
            <div className="h-px bg-slate-100 my-2" />
            <button onClick={handleSignOut} className="px-4 py-3 rounded-2xl text-red-500 font-medium hover:bg-red-50 flex items-center gap-3">
              <LogOut className="w-5 h-5" /> ออกจากระบบ
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 pb-24 relative z-10">
        {children}
      </main>
    </div>
  );
}
