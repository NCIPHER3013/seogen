import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Plus, FileText, User, Sparkles, LogOut, Menu, X, Users, Loader2 } from 'lucide-react';
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
    { to: "/articles", icon: FileText, label: "บทความ" }
  ];

  if (isAdmin) {
    navLinks.push({ to: "/admin", icon: Users, label: "แอดมิน" });
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50/50 font-sans text-slate-900 selection:bg-emerald-500/20 flex flex-col relative overflow-x-hidden">
      
      {/* Dynamic Background Blurs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/40 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-emerald-100/50 blur-[100px] pointer-events-none z-0" />

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
