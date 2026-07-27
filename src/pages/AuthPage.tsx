import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let created = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && window.location.pathname === '/login') {
        navigate('/dashboard');
        if (created) return;
        created = true;
        fetch('/api/ensure-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: session.user.id, email: session.user.email }),
        }).catch(() => {});
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for the confirmation link.');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setMessage('Check your email for the magic link.');
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Supabase ปลายทางไม่ถูกต้อง หรืออินเทอร์เน็ตมีปัญหา)');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 font-sans selection:bg-emerald-500/30">
      
      {/* Left Decoration Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-white border-r border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-100 via-transparent to-transparent opacity-80" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-100 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 font-bold text-3xl mb-12">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-[1rem] bg-emerald-100 text-emerald-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-slate-800">Seo<span className="text-emerald-500 font-light">Cipher</span></span>
          </div>
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h1 className="text-5xl font-extrabold leading-[1.1] mb-6 tracking-tight text-slate-900">
              สร้างบทความ SEO <br/> ที่ <span className="text-emerald-600 bg-emerald-50 px-2 leading-relaxed rounded-xl">แตกต่าง</span> และโดดเด่น
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-md">
              AI Content Generator ที่ออกแบบมาเพื่อให้เว็บไซต์ของคุณติดอันดับแรกๆ บน Google อย่างยั่งยืน
            </p>
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-xl shadow-emerald-900/5 max-w-sm">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-emerald-500/30">
              1st
            </div>
            <div>
              <p className="font-semibold text-slate-800">อันดับที่ 1 บน Google</p>
              <p className="text-sm text-slate-500">เป้าหมายต่อไปของคุณเริ่มต้นที่นี่</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative bg-slate-50">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-200/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white">
            
            <div className="flex lg:hidden items-center justify-center gap-2 font-bold text-3xl mb-8">
              <Sparkles className="w-8 h-8 text-emerald-500" />
              <span className="text-slate-800">Seo<span className="text-emerald-500 font-light ml-1">Cipher</span></span>
            </div>
            
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
              {mode === 'login' && 'ยินดีต้อนรับกลับมา!'}
              {mode === 'signup' && 'เริ่มต้นใช้งานฟรี'}
              {mode === 'magic' && 'เข้าสู่ระบบรวดเร็ว'}
            </h2>
            <p className="text-slate-500 text-base mb-8">
              {mode === 'login' && 'เข้าสู่ระบบเพื่อสร้างบทความของคุณต่อ'}
              {mode === 'signup' && 'สมัครสมาชิกและสัมผัสความสามารถของ AI'}
              {mode === 'magic' && 'รับลิงก์วิเศษเพื่อเข้าสู่ระบบโดยไม่ต้องใช้รหัสผ่าน'}
            </p>

            <form onSubmit={handleEmailAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-slate-700">อีเมล (Email)</Label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-slate-50/50 border-slate-200 text-slate-900 focus-visible:ring-emerald-500 rounded-2xl placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>
              </div>

              {mode !== 'magic' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="font-semibold text-slate-700">รหัสผ่าน (Password)</Label>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-12 bg-slate-50/50 border-slate-200 text-slate-900 focus-visible:ring-emerald-500 rounded-2xl placeholder:text-slate-400 font-medium"
                      required
                    />
                  </div>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 font-medium">{error}</div>
                  </motion.div>
                )}
                {message && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="p-4 text-sm text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-100 font-medium">{message}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-12 rounded-2xl shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 mt-2" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                {mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'signup' ? 'สมัครสมาชิก' : 'ส่งลิงก์เข้าสู่ระบบ'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-xs font-semibold uppercase">
                <span className="bg-white px-4 text-slate-400">หรือ</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold rounded-2xl shadow-sm transition-all" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              เข้าสู่ระบบด้วย Google
            </Button>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 text-sm">
              {mode === 'login' ? (
                <>
                  <button type="button" onClick={() => setMode('signup')} className="text-slate-500 hover:text-emerald-600 font-medium transition-colors">สร้างบัญชีใหม่</button>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <button type="button" onClick={() => setMode('magic')} className="text-slate-500 hover:text-emerald-600 font-medium transition-colors">ใช้ Magic Link</button>
                </>
              ) : mode === 'signup' ? (
                <button type="button" onClick={() => setMode('login')} className="text-slate-500 hover:text-emerald-600 font-medium transition-colors">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</button>
              ) : (
                <button type="button" onClick={() => setMode('login')} className="text-slate-500 hover:text-emerald-600 font-medium transition-colors">กลับไปยังหน้าเข้าสู่ระบบ</button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
