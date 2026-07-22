import React, { useState, useEffect } from 'react';
import { 
  FileText, LayoutDashboard, Sparkles, Plus, User, LogOut,
  Search, Eye, Edit3, Trash2, Loader2, FileCheck, FileClock,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/hooks/useAdmin';
import { fetchUserArticles, Article, deleteArticle } from '@/lib/articles';

export default function Articles() {
  const [user, setUser] = useState<any>(null);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        loadArticles();
      } else {
        navigate('/');
      }
    });
  }, [navigate]);

  const loadArticles = async () => {
    setLoading(true);
    const dbArticles = await fetchUserArticles();

    // Fetch legacy articles from localStorage
    let localArticles: Article[] = [];
    try {
      const localData = localStorage.getItem(`campaign_config_${user?.id}_generatedArticles`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          localArticles = parsed.map((a: any) => ({
            id: a.id,
            user_id: user?.id || '',
            title: a.title || 'Untitled',
            content: a.content || '',
            status: 'Completed' as const,
            seo_score: 0,
            created_at: new Date(a.date || Date.now()).toISOString(),
            updated_at: new Date(a.date || Date.now()).toISOString(),
          }));
        }
      }
    } catch(e) {
      console.error('Failed to parse local articles', e);
    }

    // Merge and deduplicate
    const merged = [...dbArticles];
    localArticles.forEach(la => {
      if (!merged.find(da => da.id === la.id)) {
        merged.push(la);
      }
    });

    // Sort by created_at descending
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setArticles(merged);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const success = await deleteArticle(id);
      if (success) {
        setArticles(articles.filter(a => a.id !== id));
      }
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"><FileCheck className="w-3 h-3 mr-1" /> เสร็จสิ้น</Badge>;
      case 'published': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">เผยแพร่แล้ว</Badge>;
      case 'generating': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> กำลังสร้าง</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-0"><FileClock className="w-3 h-3 mr-1" /> ร่าง</Badge>;
    }
  };

  if(!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Sidebar - Desktop */}
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
            <Link to="/articles" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-white bg-slate-800 transition-colors">
              <FileText className="w-4 h-4" /> บทความทั้งหมด
            </Link>
            {isAdmin && (
            <Link to="/admin?tab=users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-purple-300 hover:text-white bg-purple-600/20 transition-colors">
              <User className="w-4 h-4" /> จัดการผู้ใช้
            </Link>
            )}
            {isAdmin && (
            <Link to="/admin?tab=stats" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-purple-300 hover:text-white bg-purple-600/20 transition-colors">
              <FileText className="w-4 h-4" /> สถิติรวม
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
            <span className="font-semibold text-slate-800">บทความทั้งหมด</span>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={handleSignOut} className="md:hidden">ออกจากระบบ</Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8 bg-[#fafafa]">
          <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">บทความของคุณ</h1>
                <p className="text-slate-500 mt-1">จัดการและดูประวัติบทความที่ถูกสร้างโดย AI ทั้งหมดของคุณที่นี่</p>
              </div>
              <Button onClick={() => navigate('/campaign/new')} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-md">
                <Plus className="w-4 h-4" /> สร้างบทความใหม่
              </Button>
            </div>

            <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="ค้นหาชื่อบทความ..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
                    <p>กำลังโหลดบทความ...</p>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-600 mb-1">ไม่พบบทความ</p>
                    <p className="text-sm text-center max-w-sm">คุณยังไม่มีบทความที่สร้างเสร็จแล้ว หรือไม่มีผลลัพธ์การค้นหาที่ตรงกับคำที่คุณพิมพ์</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="font-semibold text-slate-600 py-4 pl-6">ชื่อบทความ</TableHead>
                          <TableHead className="font-semibold text-slate-600 py-4 w-32">สถานะ</TableHead>
                          <TableHead className="font-semibold text-slate-600 py-4 w-40">สร้างเมื่อ</TableHead>
                          <TableHead className="font-semibold text-slate-600 py-4 w-24 text-right pr-6">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedArticles.map((article) => (
                          <TableRow key={article.id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group">
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100 flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                                  <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{article.title || 'ไม่มีชื่อเรื่อง (Untitled)'}</p>
                                  <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[200px] sm:max-w-sm">{(article.content || '').substring(0, 80)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              {getStatusBadge(article.status)}
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-500">
                              {new Date(article.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </TableCell>
                            <TableCell className="pr-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/article/${article.id}`)} className="text-slate-400 hover:text-purple-600 hover:bg-purple-50 h-8 w-8">
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              
              {!loading && filteredArticles.length > ITEMS_PER_PAGE && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-sm">
                  <div className="text-slate-500">
                    แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, filteredArticles.length)} จากทั้งหมด {filteredArticles.length} รายการ
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="h-8 gap-1 shadow-sm text-slate-600"
                    >
                      <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
                    </Button>
                    <div className="flex items-center justify-center min-w-[32px] font-medium text-slate-700">
                      {currentPage} / {totalPages}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="h-8 gap-1 shadow-sm text-slate-600"
                    >
                      ถัดไป <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
