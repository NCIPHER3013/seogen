import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Plus, FileText, User, Sparkles, LogOut, Activity, Menu, X, ArrowRight, BarChart3, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdmin } from '@/hooks/useAdmin';
import { fetchUserArticles, Article } from '@/lib/articles';
import AppLayout from '@/components/AppLayout';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (user) {
        setUser(user);
        loadStats();
      } else {
        navigate('/');
      }
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const dbArticles = await fetchUserArticles();
      let localArticles: Article[] = [];
      const localData = localStorage.getItem(`campaign_config_${user?.id}_generatedArticles`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          localArticles = parsed.map((a: any) => ({
            id: a.id,
            user_id: '',
            title: a.title,
            content: a.content,
            status: 'Completed' as const,
            seo_score: 0,
            created_at: a.date ? new Date(a.date).toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
        }
      }

      const merged = [...dbArticles];
      localArticles.forEach(la => {
        if (!merged.find(da => da.id === la.id)) {
          merged.push(la);
        }
      });

      setStats({
        total: merged.length,
        completed: merged.filter(a => a.status === 'Completed' || a.status === 'Published').length
      });
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AppLayout user={user}>
      <div className="w-full relative z-10">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[2rem] transform -rotate-1 opacity-20 blur-lg"></div>
          <div className="relative bg-white border border-slate-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10 text-center sm:text-left">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-4 py-1.5 mb-6 text-sm font-medium inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Content Generator 
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                เริ่มต้นสร้างเนื้อหา <br/><span className="text-emerald-600">ให้เหนือกว่าคู่แข่ง</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-lg mb-8">
                เขียนบทความ SEO ที่ติดหน้าแรก Google ได้ง่ายๆ ภายในไม่กี่นาทีด้วยระบบ AI ของ SeoCipher
              </p>
              
              <Link to="/campaign/new" className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl px-8 py-4 text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-1 gap-3">
                <Plus className="w-6 h-6" /> สร้างแคมเปญใหม่
              </Link>
            </div>
            
            <div className="relative z-10 hidden md:block">
               <div className="w-64 h-64 bg-emerald-50 border-8 border-white rounded-[3rem] shadow-xl shadow-emerald-900/5 rotate-6 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <FileText className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-teal-400" />
                    </div>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <Activity className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl shadow-sm flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Grid layout */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <FileText className="w-24 h-24 text-emerald-600 -rotate-12" />
            </div>
            <h3 className="text-slate-500 font-medium mb-2 relative z-10">แคมเปญของคุณ</h3>
            <div className="text-5xl font-black text-slate-800 mb-4 relative z-10">1</div>
            <div className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full relative z-10">
              <Activity className="w-4 h-4" /> แคมเปญเริ่มต้น
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <BarChart3 className="w-24 h-24 text-emerald-600 -rotate-12" />
            </div>
            <h3 className="text-slate-500 font-medium mb-2 relative z-10">บทความที่สร้างสำเร็จ</h3>
            <div className="text-5xl font-black text-slate-800 mb-4 relative z-10">{stats.completed}</div>
            <div className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full relative z-10">
              <Sparkles className="w-4 h-4" /> เนื้อหาในระบบ
            </div>
          </div>

          {/* Card 3 - Uploaded */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-lg shadow-slate-900/20 hover:shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-slate-400 font-medium mb-2 relative z-10">ส่งออก / อัปโหลด</h3>
            <div className="text-5xl font-black text-white mb-4 relative z-10">0</div>
            <div className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full relative z-10 border border-emerald-500/20">
              <ArrowRight className="w-4 h-4" /> รอการส่งออก
            </div>
          </div>

          {/* Large Area: Recent Activity */}
          <div className="md:col-span-3 bg-white border border-slate-100 rounded-[2.5rem] p-8 sm:p-10 shadow-sm mt-2">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">กิจกรรมล่าสุด</h2>
                <p className="text-slate-500 mt-1">บทความใหม่ล่าสุดที่คุณมอบหมายให้ AI สร้าง</p>
              </div>
              <Link to="/articles" className="hidden sm:flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-colors">
                ดูทั้งหมด <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="text-center py-20 px-4 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                <div className="w-20 h-20 bg-white shadow-sm rounded-3xl mx-auto flex items-center justify-center mb-6">
                  <Activity className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">ยังไม่มีประวัติการทำงาน</h3>
                <p className="text-base text-slate-500 mb-8 max-w-md mx-auto">เริ่มต้นแคมเปญแรกของคุณเพื่อให้ระบบ AI เริ่มร่างเนื้อหาคุณภาพสูง</p>
                <Link to="/campaign/new" className={buttonVariants({ variant: "default", className: "bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-2xl px-8 h-12 text-base font-semibold" })}>
                  <Plus className="w-5 h-5 mr-2" /> เริ่มสร้างตอนนี้เลย
                </Link>
            </div>
          </div>
        </motion.div>
        </div>
    </AppLayout>
  );
}
