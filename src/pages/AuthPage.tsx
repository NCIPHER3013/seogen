import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Mail, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && window.location.pathname === '/') {
        navigate('/dashboard');
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
        setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (เข้าสู่ระบบด้วย Google ล้มเหลวเนื่องจากเชื่อมต่อ Supabase ไม่ได้)');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center items-start p-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-slate-900 z-0"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full"></div>
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-2 font-bold text-3xl mb-12">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <span>z.ai<span className="text-purple-400 font-light ml-2">SEO Studio</span></span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">ยกระดับการทำ SEO <br/>คอนเทนต์ของคุณ</h1>
          <p className="text-xl text-slate-300 leading-relaxed font-light">
            สร้างบทความคุณภาพสูงที่ติดอันดับดีๆ หารูปภาพประกอบ และอัปโหลดลงบนเว็บไซต์ของคุณได้อัตโนมัติภายในไม่กี่นาที
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-[#fafafa]">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[1.25rem] shadow-[0px_4px_24px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex lg:hidden items-center justify-center gap-2 font-bold text-2xl mb-8 text-slate-900">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span>z.ai<span className="text-purple-600 font-light ml-2">SEO Studio</span></span>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2 text-slate-900 tracking-tight">
            {mode === 'login' && 'ยินดีต้อนรับกลับมา'}
            {mode === 'signup' && 'สร้างบัญชีผู้ใช้ใหม่'}
            {mode === 'magic' && 'เข้าสู่ระบบด้วย Magic Link'}
          </h2>
          <p className="text-center text-slate-500 text-sm mb-8 font-light">
            {mode === 'login' && 'กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบของคุณ'}
            {mode === 'signup' && 'สมัครสมาชิกเพื่อเริ่มสร้างบทความ SEO ด้วย AI'}
            {mode === 'magic' && 'เราจะส่งลิงก์เพื่อล็อคอินเข้าสู่ระบบไปยังอีเมลของคุณ'}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-slate-700">อีเมล (Email address)</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-purple-500 rounded-xl"
                  required
                />
              </div>
            </div>

            {mode !== 'magic' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-medium text-slate-700">รหัสผ่าน (Password)</Label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-purple-500 rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}
            {message && <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100">{message}</div>}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'signup' ? 'สมัครสมาชิก' : 'ส่งลิงก์'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">หรือติตต่อเข้าใช้งานด้วย</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full mb-6" onClick={handleGoogleLogin} disabled={loading}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                <button type="button" onClick={() => setMode('signup')} className="hover:text-blue-600 font-medium">ยังไม่มีบัญชี?</button>
                <span className="hidden sm:inline text-slate-300">|</span>
                <button type="button" onClick={() => setMode('magic')} className="hover:text-blue-600 font-medium">เข้าสู่ระบบด้วย Magic Link</button>
              </>
            ) : mode === 'signup' ? (
              <>
                <button type="button" onClick={() => setMode('login')} className="hover:text-blue-600 font-medium">มีบัญชีอยู่แล้ว?</button>
              </>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="hover:text-blue-600 font-medium">กลับไปยังหน้าเข้าสู่ระบบ</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
