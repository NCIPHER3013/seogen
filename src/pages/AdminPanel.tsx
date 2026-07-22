import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/hooks/useAdmin';
import {
  LayoutDashboard, Plus, FileText, Sparkles, LogOut, Menu, X,
  Users, BarChart3, Shield, Pencil, Loader2, ArrowLeft, RefreshCw,
  Image as ImageIcon, Activity, TrendingUp, CheckCircle, Server, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserData {
  id: string;
  email: string;
  subscription_tier: string;
  word_credits: number;
  image_credits: number;
  created_at: string;
  role?: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';
  const { isAdmin, loading } = useAdmin();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Users management
  const [users, setUsers] = useState<UserData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editCredits, setEditCredits] = useState({ word: 0, image: 0, tier: '', role: 'user' });

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    totalImages: 0,
    apiStatus: 'กำลังตรวจสอบ...' as string,
    newUsersToday: 0,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
      else navigate('/');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_OUT') navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/dashboard');
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, statsRes, chartRes] = await Promise.all([
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/chart-data').then(r => r.json()),
      ]);

      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setChartData(Array.isArray(chartRes) ? chartRes : []);
      setStats({
        totalUsers: statsRes.totalUsers || 0,
        totalArticles: statsRes.totalArticles || 0,
        totalImages: statsRes.totalImages || 0,
        apiStatus: 'กำลังตรวจสอบ...',
        newUsersToday: statsRes.newUsersToday || 0,
      });
    } catch (err) {
      console.error('loadData error:', err);
    }
    setLoadingUsers(false);

    // ทดสอบ API status
    try {
      const apiKey = localStorage.getItem('customApiKey');
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
        setStats(prev => ({ ...prev, apiStatus: 'ไม่ได้ตั้งค่า' }));
      } else {
        const textApiBaseUrl = localStorage.getItem('textApiBaseUrl');
        const textApiModel = localStorage.getItem('textApiModel');
        const baseUrl = textApiBaseUrl || 'https://generativelanguage.googleapis.com';
        const model = textApiModel || 'gemini-2.0-flash';
        const res = await fetch(`${baseUrl}/v1beta/models/${model}?key=${apiKey}`);
        setStats(prev => ({ ...prev, apiStatus: res.ok ? 'ใช้งานได้' : 'ผิดพลาด' }));
      }
    } catch {
      setStats(prev => ({ ...prev, apiStatus: 'ไม่สามารถเชื่อมต่อ' }));
    }
  };

  const handleEditUser = (u: UserData) => {
    setEditingUser(u);
    setEditCredits({ word: u.word_credits, image: u.image_credits, tier: u.subscription_tier, role: u.role || 'user' });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    // Update credits and tier
    await fetch('/api/admin/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingUser.id,
        word_credits: editCredits.word,
        image_credits: editCredits.image,
        subscription_tier: editCredits.tier,
      }),
    });
    
    // Update role if changed
    if (editCredits.role !== (editingUser.role || 'user')) {
      await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          role: editCredits.role
        }),
      });
    }

    setEditingUser(null);
    loadData();
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

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
            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800">
              <LayoutDashboard className="w-5 h-5" /> แดชบอร์ด
            </Link>
            <Link to="/campaign/new" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800">
              <Plus className="w-5 h-5" /> สร้างแคมเปญใหม่
            </Link>
            <Link to="/articles" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl text-slate-300 hover:text-white hover:bg-slate-800">
              <FileText className="w-5 h-5" /> บทความทั้งหมด
            </Link>
            <Link to="/admin?tab=users" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl ${activeTab === 'users' ? 'text-white bg-purple-600' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
              <Users className="w-5 h-5" /> จัดการผู้ใช้
            </Link>
            <Link to="/admin?tab=stats" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-center gap-3 w-full py-3 text-base font-medium rounded-xl ${activeTab === 'stats' ? 'text-white bg-purple-600' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
              <BarChart3 className="w-5 h-5" /> สถิติรวม
            </Link>
          </nav>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0 z-20">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white mb-8">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span>z.ai<span className="text-purple-500 font-light ml-2">SEO Studio</span></span>
          </Link>
          <nav className="space-y-1">
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <LayoutDashboard className="w-4 h-4" /> แดชบอร์ด
            </Link>
            <Link to="/campaign/new" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Plus className="w-4 h-4" /> สร้างแคมเปญใหม่
            </Link>
            <Link to="/articles" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <FileText className="w-4 h-4" /> บทความทั้งหมด
            </Link>
            <Link to="/admin?tab=users" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'text-white bg-purple-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Users className="w-4 h-4" /> จัดการผู้ใช้
            </Link>
            <Link to="/admin?tab=stats" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'stats' ? 'text-white bg-purple-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <BarChart3 className="w-4 h-4" /> สถิติรวม
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-800 cursor-pointer group relative">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-purple-400 truncate">{isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้งาน'}</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="absolute right-2 opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-md transition-opacity">
              <LogOut className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/dashboard" className="hover:text-purple-600"><ArrowLeft className="w-4 h-4" /></Link>
            <span className="font-semibold text-slate-800">{activeTab === 'users' ? 'จัดการผู้ใช้' : 'สถิติรวม'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loadingUsers} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">

            {activeTab === 'stats' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ภาพรวมระบบ (Overview)</h2>
                  <p className="text-slate-500 mt-1">ติดตามสถานะและการใช้งานระบบในภาพรวม</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Users Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 text-white/10">
                      <Users className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-white/80 font-medium mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Users className="w-5 h-5 text-white" /></div>
                        ผู้ใช้ทั้งหมด
                      </div>
                      <div className="text-4xl font-extrabold tracking-tight">{stats.totalUsers.toLocaleString()}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <TrendingUp className="w-3.5 h-3.5" /> +{stats.newUsersToday} วันนี้
                      </div>
                    </div>
                  </div>

                  {/* Articles Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 text-white/10">
                      <FileText className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-white/80 font-medium mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><FileText className="w-5 h-5 text-white" /></div>
                        บทความทั้งหมด
                      </div>
                      <div className="text-4xl font-extrabold tracking-tight">{stats.totalArticles.toLocaleString()}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <Database className="w-3.5 h-3.5" /> เก็บในฐานข้อมูล
                      </div>
                    </div>
                  </div>

                  {/* Images Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 text-white/10">
                      <ImageIcon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-white/80 font-medium mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><ImageIcon className="w-5 h-5 text-white" /></div>
                        รูปภาพทั้งหมด
                      </div>
                      <div className="text-4xl font-extrabold tracking-tight">{stats.totalImages.toLocaleString()}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5" /> ภาพจาก AI
                      </div>
                    </div>
                  </div>

                  {/* API Status Card */}
                  <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${stats.apiStatus === 'ใช้งานได้' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : stats.apiStatus === 'กำลังตรวจสอบ...' ? 'bg-gradient-to-br from-slate-400 to-slate-500' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 text-white/10">
                      <Server className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-white/80 font-medium mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Server className="w-5 h-5 text-white" /></div>
                        สถานะ API
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight">{stats.apiStatus}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {stats.apiStatus === 'ใช้งานได้' ? <CheckCircle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />} ระบบเชื่อมต่อแล้ว
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Chart Section */}
                <div className="mt-8">
                  <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                      <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" /> สถิติการใช้งานย้อนหลัง 7 วัน
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis 
                              dataKey="date" 
                              stroke="#cbd5e1" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false} 
                            />
                            <YAxis 
                              stroke="#cbd5e1" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false} 
                              tickFormatter={(value) => `${value}`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="users" 
                              name="ผู้ใช้สมัครใหม่"
                              stroke="#8b5cf6" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorUsers)" 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="articles" 
                              name="บทความที่สร้าง"
                              stroke="#0ea5e9" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorArticles)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            )}

            {activeTab === 'users' && (
              <Card className="shadow-sm border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">จัดการผู้ใช้</CardTitle>
                </CardHeader>
                <CardContent>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">ยังไม่มีผู้ใช้</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>อีเมล</TableHead>
                        <TableHead className="text-center">สิทธิ์ (Role)</TableHead>
                        <TableHead className="text-center">แพ็กเกจ</TableHead>
                        <TableHead className="text-center">Word Credits</TableHead>
                        <TableHead className="text-center">Image Credits</TableHead>
                        <TableHead className="text-center">สมัครเมื่อ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={u.role === 'admin' ? "text-purple-600 border-purple-200 bg-purple-50" : "text-slate-500"}>
                              {u.role === 'admin' ? 'Admin' : 'User'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">{u.subscription_tier || 'free'}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{u.word_credits?.toLocaleString()}</TableCell>
                          <TableCell className="text-center">{u.image_credits?.toLocaleString()}</TableCell>
                          <TableCell className="text-center text-xs text-slate-500">
                            {new Date(u.created_at).toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                </CardContent>
              </Card>
            )}

            {/* Edit User Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
                <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <CardHeader>
                    <CardTitle>แก้ไขผู้ใช้: {editingUser.email}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subscription Tier</Label>
                      <Input value={editCredits.tier} onChange={e => setEditCredits(p => ({ ...p, tier: e.target.value }))} placeholder="free" />
                    </div>
                    <div className="space-y-2">
                      <Label>Word Credits</Label>
                      <Input type="number" value={editCredits.word} onChange={e => setEditCredits(p => ({ ...p, word: Number(e.target.value) }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Image Credits</Label>
                      <Input type="number" value={editCredits.image} onChange={e => setEditCredits(p => ({ ...p, image: Number(e.target.value) }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>สิทธิ์การใช้งาน (Role)</Label>
                      <select 
                        value={editCredits.role} 
                        onChange={e => setEditCredits(p => ({ ...p, role: e.target.value }))}
                        className="w-full h-9 rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="user">ผู้ใช้ทั่วไป (User)</option>
                        <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveUser} className="flex-1 bg-purple-600 hover:bg-purple-700">บันทึก</Button>
                      <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">ยกเลิก</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}