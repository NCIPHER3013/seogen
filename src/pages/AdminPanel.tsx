import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/hooks/useAdmin';
import {
  LayoutDashboard, Plus, FileText, Sparkles, LogOut,
  Users, BarChart3, Shield, Pencil, Loader2, ArrowLeft, RefreshCw,
  Image as ImageIcon, Activity, CheckCircle, Server, Database, TrendingUp,
  Save, Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppLayout from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

  // AI Settings (global)
  // aiSettings: เก็บค่าที่อ่านจาก DB (masked, สถานะว่าตั้งค่าแล้วหรือไม่)
  const [aiSettings, setAiSettings] = useState({
    text_api_key_masked: '',
    text_api_key_set: false,
    text_api_model: '',
    text_api_base_url: '',
    image_api_key_masked: '',
    image_api_key_set: false,
    image_api_model: '',
    image_api_base_url: '',
  });
  // aiInput: เก็บเฉพาะค่าที่ผู้ใช้กรอกใน input (key ใหม่เท่านั้น ไม่ใช่ masked)
  const [aiInput, setAiInput] = useState({
    text_api_key: '',
    image_api_key: '',
  });
  const [savingAi, setSavingAi] = useState(false);
  const [aiSavedMsg, setAiSavedMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
      else navigate('/');
    });
  }, [navigate]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/dashboard');
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
      loadAiSettings();
    }
  }, [isAdmin]);

  const loadAiSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        // map field จาก server (text_api_key ที่เป็น masked) ไปยัง state ใหม่
        setAiSettings({
          text_api_key_masked: data.text_api_key || '',
          text_api_key_set: !!data.text_api_key_set,
          text_api_model: data.text_api_model || '',
          text_api_base_url: data.text_api_base_url || '',
          image_api_key_masked: data.image_api_key || '',
          image_api_key_set: !!data.image_api_key_set,
          image_api_model: data.image_api_model || '',
          image_api_base_url: data.image_api_base_url || '',
        });
      }
    } catch (e) {
      console.error('Failed to load AI settings:', e);
    }
  };

  const handleSaveAiSettings = async () => {
    setSavingAi(true);
    setAiSavedMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ส่ง key จาก aiInput (ค่าที่ผู้ใช้กรอกใหม่เท่านั้น ไม่ใช่ masked)
          text_api_key: aiInput.text_api_key,
          text_api_model: aiSettings.text_api_model,
          text_api_base_url: aiSettings.text_api_base_url,
          image_api_key: aiInput.image_api_key,
          image_api_model: aiSettings.image_api_model,
          image_api_base_url: aiSettings.image_api_base_url,
        }),
      });
      if (res.ok) {
        setAiSavedMsg('บันทึกการตั้งค่าเรียบร้อย — มีผลต่อผู้ใช้ทุกคนทันที');
        // เคลียร์ช่อง key input หลังบันทึก แล้วโหลดค่า masked ใหม่มาแสดง badge
        setAiInput({ text_api_key: '', image_api_key: '' });
        await loadAiSettings();
        setTimeout(() => setAiSavedMsg(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        setAiSavedMsg('เกิดข้อผิดพลาดในการบันทึก: ' + (err.error || ''));
      }
    } catch (e: any) {
      setAiSavedMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + e.message);
    }
    setSavingAi(false);
  };

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

    try {
      // ดึงสถานะ API จาก global settings ใน DB (admin ตั้งค่าไว้)
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.text_api_key_set || s.image_api_key_set) {
          // มีการตั้งค่าแล้ว — แสดง provider ที่ใช้
          const provider = s.text_api_base_url?.includes('bytepluses') ? 'ByteDance Ark'
            : s.text_api_base_url?.includes('z.ai') ? 'Z.ai'
            : s.text_api_base_url?.includes('openai') ? 'OpenAI'
            : s.text_api_model?.startsWith('deepseek') ? 'DeepSeek'
            : s.text_api_model?.startsWith('glm') ? 'GLM'
            : s.text_api_key?.startsWith('ark-') ? 'ByteDance Ark'
            : 'AI';
          setStats(prev => ({ ...prev, apiStatus: `ใช้งานได้ (${provider})` }));
        } else {
          setStats(prev => ({ ...prev, apiStatus: 'ยังไม่ได้ตั้งค่า' }));
        }
      } else {
        setStats(prev => ({ ...prev, apiStatus: 'ไม่สามารถเช็คได้' }));
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
    <AppLayout user={user}>
      <div className="flex-1 w-full bg-white/70 backdrop-blur-sm rounded-[2rem] shadow-sm border border-slate-100/50 overflow-hidden min-h-[calc(100vh-8rem)]">
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 lg:p-12 relative z-10 h-full">
          
          <div className="flex-1 overflow-auto bg-transparent">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto">
              {[
                { id: 'users', label: 'ผู้ใช้', icon: Users },
                { id: 'stats', label: 'ภาพรวม', icon: BarChart3 },
                { id: 'ai-settings', label: 'ตั้งค่า AI ระบบ', icon: Sparkles },
              ].map(t => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSearchParams({ tab: t.id })}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-emerald-600 border-b-2 border-emerald-600 -mb-px bg-emerald-50/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {activeTab === 'stats' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">ภาพรวมระบบ (Overview)</h2>
                  <p className="text-slate-500 mt-1">ติดตามสถานะและการใช้งานระบบในภาพรวม</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Users Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 text-slate-900 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 text-slate-900/10">
                      <Users className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-slate-900/80 font-medium mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Users className="w-5 h-5 text-slate-900" /></div>
                        ผู้ใช้ทั้งหมด
                      </div>
                      <div className="text-4xl font-extrabold tracking-tight">{stats.totalUsers.toLocaleString()}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-900/90 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <TrendingUp className="w-3.5 h-3.5" /> +{stats.newUsersToday} วันนี้
                      </div>
                    </div>
                  </div>

                  {/* Articles Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-6 text-slate-900 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 text-slate-900/10">
                      <FileText className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-slate-900/80 font-medium mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><FileText className="w-5 h-5 text-slate-900" /></div>
                        บทความทั้งหมด
                      </div>
                      <div className="text-4xl font-extrabold tracking-tight">{stats.totalArticles.toLocaleString()}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-900/90 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <Database className="w-3.5 h-3.5" /> เก็บในฐานข้อมูล
                      </div>
                    </div>
                  </div>

                  {/* Images Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 p-6 text-slate-900 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 text-slate-900/10">
                      <ImageIcon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-slate-900/80 font-medium mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><ImageIcon className="w-5 h-5 text-slate-900" /></div>
                        รูปภาพทั้งหมด
                      </div>
                      <div className="text-4xl font-extrabold tracking-tight">{stats.totalImages.toLocaleString()}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-900/90 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5" /> ภาพจาก AI
                      </div>
                    </div>
                  </div>

                  {/* API Status Card */}
                  <div className={`relative overflow-hidden rounded-2xl p-6 text-slate-900 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${stats.apiStatus === 'ใช้งานได้' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : stats.apiStatus === 'กำลังตรวจสอบ...' ? 'bg-gradient-to-br from-slate-400 to-slate-500' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 text-slate-900/10">
                      <Server className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-slate-900/80 font-medium mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Server className="w-5 h-5 text-slate-900" /></div>
                        สถานะ API
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight">{stats.apiStatus}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-900/90 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {stats.apiStatus === 'ใช้งานได้' ? <CheckCircle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />} ระบบเชื่อมต่อแล้ว
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Chart Section */}
                <div className="mt-8">
                  <Card className="shadow-lg shadow-slate-200/50 border-slate-100 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                      <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" /> สถิติการใช้งานย้อนหลัง 7 วัน
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartData.length > 0 ? (
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
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">กำลังโหลดข้อมูล...</div>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            )}

            {activeTab === 'users' && (
              <Card className="shadow-lg shadow-slate-200/50 border-slate-100 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">จัดการผู้ใช้</CardTitle>
                </CardHeader>
                <CardContent>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">ยังไม่มีผู้ใช้</div>
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
                            <Badge variant="outline" className={u.role === 'admin' ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-slate-500"}>
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
                        className="w-full h-9 rounded-md border border-slate-100 bg-transparent px-3 py-1 text-sm shadow-lg shadow-slate-200/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="user">ผู้ใช้ทั่วไป (User)</option>
                        <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveUser} className="flex-1 bg-emerald-600 hover:bg-emerald-700">บันทึก</Button>
                      <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">ยกเลิก</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'ai-settings' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                    ตั้งค่า AI ระบบ
                  </h2>
                  <p className="text-slate-500 mt-1">
                    การตั้งค่าที่นี่จะมีผลต่อผู้ใช้งาน <b>ทุกคน</b> ในระบบทันที — ผู้ใช้ทั่วไปไม่ต้องตั้งค่า API Key เอง
                  </p>
                </div>

                {/* Warning banner */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <b>หมายเหตุความปลอดภัย:</b> API Key จะถูกเก็บในฐานข้อมูลและใช้ฝั่ง Server เท่านั้น — ผู้ใช้ทั่วไปจะไม่เห็น key นี้ในเบราว์เซอร์ของตน
                  </div>
                </div>

                {/* Text API Settings */}
                <Card className="shadow-lg shadow-slate-200/50 border-slate-100 rounded-2xl">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                      <Type className="w-5 h-5 text-emerald-600" />
                      Text API (สร้างบทความ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        API Key
                        {aiSettings.text_api_key_set && (
                          <Badge variant="outline" className="ml-2 text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">
                            ตั้งค่าแล้ว: {aiSettings.text_api_key_masked}
                          </Badge>
                        )}
                      </Label>
                      <Input
                        type="password"
                        value={aiInput.text_api_key}
                        onChange={(e) => setAiInput(prev => ({ ...prev, text_api_key: e.target.value }))}
                        placeholder={aiSettings.text_api_key_set ? 'ใส่ key ใหม่เพื่อเปลี่ยน (เว้นว่าง = คงเดิม)' : 'กรอก API Key เช่น ark-xxxxx'}
                        className="h-11 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Model</Label>
                      <Input
                        type="text"
                        value={aiSettings.text_api_model}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, text_api_model: e.target.value }))}
                        placeholder="deepseek-v4-flash-260425"
                        className="h-11 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Base URL</Label>
                      <Input
                        type="text"
                        value={aiSettings.text_api_base_url}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, text_api_base_url: e.target.value }))}
                        placeholder="https://ark.ap-southeast.bytepluses.com/api/v3"
                        className="h-11 font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Image API Settings */}
                <Card className="shadow-lg shadow-slate-200/50 border-slate-100 rounded-2xl">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-rose-500" />
                      Image API (สร้างภาพ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        API Key
                        {aiSettings.image_api_key_set && (
                          <Badge variant="outline" className="ml-2 text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">
                            ตั้งค่าแล้ว: {aiSettings.image_api_key_masked}
                          </Badge>
                        )}
                      </Label>
                      <Input
                        type="password"
                        value={aiInput.image_api_key}
                        onChange={(e) => setAiInput(prev => ({ ...prev, image_api_key: e.target.value }))}
                        placeholder={aiSettings.image_api_key_set ? 'ใส่ key ใหม่เพื่อเปลี่ยน (เว้นว่าง = คงเดิม)' : 'กรอก API Key เช่น ark-xxxxx'}
                        className="h-11 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Model</Label>
                      <Input
                        type="text"
                        value={aiSettings.image_api_model}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, image_api_model: e.target.value }))}
                        placeholder="seedream-4-0-250828"
                        className="h-11 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Base URL</Label>
                      <Input
                        type="text"
                        value={aiSettings.image_api_base_url}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, image_api_base_url: e.target.value }))}
                        placeholder="https://ark.ap-southeast.bytepluses.com/api/v3"
                        className="h-11 font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save button */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleSaveAiSettings}
                    disabled={savingAi}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6"
                  >
                    {savingAi ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    บันทึกการตั้งค่า
                  </Button>
                  {aiSavedMsg && (
                    <span className={`text-sm font-medium ${aiSavedMsg.includes('เกิดข้อผิดพลาด') ? 'text-red-600' : 'text-emerald-600'}`}>
                      {aiSavedMsg}
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}