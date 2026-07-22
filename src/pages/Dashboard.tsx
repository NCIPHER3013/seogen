import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Plus, FileText, User, Sparkles, LogOut, ArrowRight, Activity, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/useAdmin';
import { Shield, Users, BarChart3 } from 'lucide-react';
import { fetchUserArticles, Article } from '@/lib/articles';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      // Intentionally ignoring network errors to prevent overlays
      if (user) {
        setUser(user);
        loadStats();
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

      // Merge and deduplicate
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

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row font-sans text-slate-900">
      
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
            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-white bg-slate-800">
              <LayoutDashboard className="w-5 h-5" /> แดชบอร์ด
            </Link>
            <Link to="/campaign/new" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <Plus className="w-5 h-5" /> สร้างแคมเปญใหม่
            </Link>
            <Link to="/articles" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <FileText className="w-5 h-5" /> บทความทั้งหมด
            </Link>
            {isAdmin && (
            <Link to="/admin?tab=users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-purple-300 hover:text-white bg-purple-600/20">
              <Users className="w-5 h-5" /> จัดการผู้ใช้
            </Link>
            )}
            {isAdmin && (
            <Link to="/admin?tab=stats" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-purple-300 hover:text-white bg-purple-600/20">
              <BarChart3 className="w-5 h-5" /> สถิติรวม
            </Link>
            )}
          </nav>
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0 z-20">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white mb-8">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span>z.ai<span className="text-purple-500 font-light ml-2">SEO Studio</span></span>
          </Link>
          
          <nav className="space-y-1">
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white bg-slate-800">
              <LayoutDashboard className="w-4 h-4" /> แดชบอร์ด
            </Link>
            <Link to="/campaign/new" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Plus className="w-4 h-4" /> สร้างแคมเปญใหม่
            </Link>
            <Link to="/articles" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <FileText className="w-4 h-4" /> บทความทั้งหมด
            </Link>
            {isAdmin && (
            <Link to="/admin?tab=users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-purple-300 hover:text-white bg-purple-600/20 transition-colors">
              <Users className="w-4 h-4" /> จัดการผู้ใช้
            </Link>
            )}
            {isAdmin && (
            <Link to="/admin?tab=stats" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-purple-300 hover:text-white bg-purple-600/20 transition-colors">
              <BarChart3 className="w-4 h-4" /> สถิติรวม
            </Link>
            )}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-800 cursor-pointer group relative">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-slate-400 truncate">{isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้งาน'}</p>
            </div>
            <button onClick={handleSignOut} className="absolute right-2 opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-md transition-opacity">
              <LogOut className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">แดชบอร์ด</span>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={handleSignOut} className="md:hidden">ออกจากระบบ</Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">ยินดีต้อนรับกลับมา!</h1>
                <p className="text-sm sm:text-base text-slate-500">นี่คือภาพรวมการสร้างเนื้อหาด้วย AI ของคุณ</p>
              </div>
              <Link to="/campaign/new" className={buttonVariants({ className: "w-full sm:w-auto bg-purple-600 hover:bg-purple-700 shadow-sm text-white font-medium rounded-lg justify-center py-6 sm:py-2" })}>
                <Plus className="w-4 h-4 mr-2" /> สร้างแคมเปญใหม่
              </Link>
            </div>

            {/* Metrics */}
            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="shadow-[0px_4px_16px_rgba(0,0,0,0.02)] border-slate-100 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">แคมเปญทั้งหมด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800">1</div>
                  <p className="text-xs text-slate-400 mt-1">แคมเปญเริ่มต้นในระบบ</p>
                </CardContent>
              </Card>
              <Card className="shadow-[0px_4px_16px_rgba(0,0,0,0.02)] border-slate-100 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">บทความที่สร้างเสร็จแล้ว</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.completed}</div>
                  <p className="text-xs text-slate-400 mt-1">เนื้อหาทั้งหมดในระบบ</p>
                </CardContent>
              </Card>
              <Card className="shadow-[0px_4px_16px_rgba(0,0,0,0.02)] border-slate-100 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">อัปโหลดไปยังเว็บแล้ว</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800">0</div>
                  <p className="text-xs text-slate-400 mt-1">บทความที่เผยแพร่อัตโนมัติ</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Table */}
            <Card className="shadow-[0px_4px_16px_rgba(0,0,0,0.02)] border-slate-100 rounded-2xl">
              <CardHeader>
                <CardTitle className="tracking-tight text-slate-800 text-xl font-semibold">กิจกรรมล่าสุด</CardTitle>
                <CardDescription>บทความใหม่ล่าสุดที่คุณมอบหมายให้ AI สร้าง</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16 px-4 border border-dashed border-slate-200 rounded-[1.25rem] bg-slate-50 mt-2">
                   <Activity className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-slate-800 mb-1">ยังไม่มีบทความที่สร้าง</h3>
                   <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">เริ่มสร้างแคมเปญแรกของคุณเพื่อให้ระบบ AI เขียนบทความแล้วจะแสดงขึ้นที่นี่</p>
                   <Link to="/campaign/new" className={buttonVariants({ variant: "outline", className: "bg-white border-slate-200 shadow-sm rounded-lg hover:bg-slate-50 font-medium" })}>
                     เพิ่มเป้าหมายคีย์เวิร์ด
                   </Link>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
