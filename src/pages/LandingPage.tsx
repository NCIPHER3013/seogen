import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Bot, ArrowRight, LayoutDashboard, Search, BarChart3, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const }
    }
  };

  const features = [
    {
      icon: <Bot className="w-6 h-6 text-emerald-600" />,
      title: "AI Content Generation",
      description: "สร้างบทความคุณภาพสูง ดึงดูดสายตา พร้อมรูปภาพประกอบโดยอัตโนมัติภายในไม่กี่นาที"
    },
    {
      icon: <Search className="w-6 h-6 text-emerald-600" />,
      title: "SEO Optimized",
      description: "รองรับการทำ SEO แบบเจาะลึก พร้อมแนะนำ Keyword ที่จะทำให้เว็บของคุณติดหน้าแรก"
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-600" />,
      title: "Auto-Blogs & Campaigns",
      description: "ตั้งค่าแคมเปญให้ AI โพสต์บทความลงเว็บไซต์ของคุณอัตโนมัติ ประหยัดเวลาทำงาน 100%"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-emerald-600" />,
      title: "Smart Analytics",
      description: "ติดตามผลลัพธ์และสถิติการเข้าชมอย่างละเอียด เพื่อปรับปรุงกลยุทธ์ได้อย่างแม่นยำ"
    }
  ];

  return (
    <div className="min-h-screen font-sans text-slate-900 overflow-x-hidden selection:bg-emerald-500/20">
      
      {/* Decorative Background Gradients (SVG Animated Light Waves) */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none bg-slate-50" style={{ zIndex: -1 }}>
        <svg className="absolute w-full h-full opacity-60" preserveAspectRatio="none" viewBox="0 0 1440 800">
          <defs>
            <linearGradient id="wave-grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#84cc16" />
            </linearGradient>
            <linearGradient id="wave-grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="20" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background subtle fill wave */}
          <motion.path
            fill="url(#wave-grad2)"
            opacity="0.15"
            d="M 0 400 C 320 600 600 200 1000 450 C 1200 550 1440 300 1440 300 L 1440 800 L 0 800 Z"
            animate={{ 
              opacity: [0.15, 0.3, 0.15],
              d: [
                "M 0 400 C 320 600 600 200 1000 450 C 1200 550 1440 300 1440 300 L 1440 800 L 0 800 Z",
                "M 0 450 C 320 500 600 300 1000 400 C 1200 600 1440 350 1440 350 L 1440 800 L 0 800 Z",
                "M 0 400 C 320 600 600 200 1000 450 C 1200 550 1440 300 1440 300 L 1440 800 L 0 800 Z"
              ]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Thick glowing wave */}
          <motion.path
            fill="none"
            stroke="url(#wave-grad1)"
            strokeWidth="15"
            filter="url(#glow)"
            opacity="0.6"
            d="M -100 500 C 300 700 600 200 1100 600 C 1300 750 1540 400 1540 400"
            animate={{ 
              opacity: [0.6, 1, 0.6],
              d: [
                "M -100 500 C 300 700 600 200 1100 600 C 1300 750 1540 400 1540 400",
                "M -100 550 C 350 650 550 300 1050 550 C 1350 650 1540 450 1540 450",
                "M -100 500 C 300 700 600 200 1100 600 C 1300 750 1540 400 1540 400"
              ]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Thin bright wave */}
          <motion.path
            fill="none"
            stroke="url(#wave-grad2)"
            strokeWidth="4"
            filter="url(#glow)"
            opacity="0.8"
            d="M -100 300 C 200 500 700 300 1000 500 C 1200 600 1540 200 1540 200"
            animate={{ 
              opacity: [0.8, 1, 0.8],
              d: [
                "M -100 300 C 200 500 700 300 1000 500 C 1200 600 1540 200 1540 200",
                "M -100 350 C 250 450 650 400 950 450 C 1250 550 1540 250 1540 250",
                "M -100 300 C 200 500 700 300 1000 500 C 1200 600 1540 200 1540 200"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Seo<span className="text-emerald-500 font-light ml-1">Cipher</span></span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-500 font-semibold rounded-full px-6 transition-all shadow-md">
                  แดชบอร์ด <LayoutDashboard className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
                  ลงชื่อเข้าใช้ (Sign In)
                </Link>
                <Link to="/login">
                  <Button className="bg-emerald-600 text-white hover:bg-emerald-500 font-semibold rounded-full px-6 transition-all shadow-md">
                    เริ่มต้นใช้งาน <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 sm:pt-40 lg:pt-52">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium">
              <Sparkles className="w-4 h-4" /> แพลตฟอร์มสร้างบทความ AI อันดับ 1
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl"
          >
            ปั้นเว็บไซต์ให้ติดหน้าแรก ด้วยพลังของ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-400">AI</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed"
          >
            ยกระดับการทำ SEO ของคุณแบบไม่ต้องเหนื่อย สร้างบทความที่มีคุณภาพ ค้นหาคีย์เวิร์ด และจัดการแคมเปญอัตโนมัติครบจบในที่เดียว
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button size="lg" className="h-14 px-8 border-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
                  ไปยังแดชบอร์ด <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="lg" className="h-14 px-8 border-0 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
                    ทดลองใช้งานฟรี <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-14 px-8 border-slate-300 bg-white/50 hover:bg-white text-slate-800 rounded-full text-lg font-medium backdrop-blur-sm">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

        </div>
      </main>

      {/* Visual App Preview (Mock) */}
      <motion.section 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-6 relative pb-24"
      >
        <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/50 bg-white/80 p-2 sm:p-4 backdrop-blur-xl shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden aspect-video flex flex-col relative group">
            {/* Mock Header */}
            <div className="h-12 border-b border-slate-200 flex items-center px-4 gap-2 bg-white">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="ml-4 h-6 bg-slate-100 rounded-md w-48 border border-slate-200" />
            </div>
            {/* Mock Body */}
            <div className="flex-1 flex p-6 gap-6 relative">
              <div className="w-48 hidden sm:flex flex-col gap-3">
                <div className="h-8 bg-white shadow-sm border border-slate-100 rounded-lg w-full" />
                <div className="h-8 bg-slate-200/50 rounded-lg w-full" />
                <div className="h-8 bg-slate-200/50 rounded-lg w-full" />
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="h-32 bg-white border border-slate-100 rounded-xl w-full shadow-sm" />
                <div className="h-64 bg-slate-200/50 rounded-xl w-full border border-slate-100" />
              </div>
              
              {/* Overlay Gradient for mystery */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent pointer-events-none" />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/10 backdrop-blur-sm">
               <Link to={isLoggedIn ? "/dashboard" : "/login"}>
                  <Button className="bg-emerald-600 border-0 hover:bg-emerald-500 text-white rounded-full px-6 shadow-lg shadow-emerald-600/30">
                    {isLoggedIn ? 'ไปที่แอปพลิเคชัน' : 'ดูตัวอย่างระบบจริง'}
                  </Button>
               </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-24 bg-white/50 border-t border-slate-200/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">ฟีเจอร์เด่นที่จะช่วยคุณ</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">ครบครันด้วยเครื่องมือที่ออกแบบมาเพื่อช่วยให้นักการตลาดและเจ้าของธุรกิจทำงานง่ายขึ้น</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, idx) => (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-lg hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 transform translate-x-4 -translate-y-4">
                  {feature.icon}
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-20 text-center relative z-10 overflow-hidden border-t border-slate-200/50 bg-slate-100/50">
        <div className="max-w-3xl mx-auto px-6 relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            {isLoggedIn ? 'ระบบพร้อมใช้งานแล้ว' : 'พร้อมที่จะเติบโตไปกับเราหรือยัง?'}
          </h2>
          <p className="text-slate-600 mb-8 text-lg">
            {isLoggedIn ? 'กลับไปที่แดชบอร์ดเพื่อเริ่มต้นการสร้างบทความได้ทันที' : 'เริ่มต้นใช้งานฟรีวันนี้ ไม่มีค่าใช้จ่ายแอบแฝง'}
          </p>
          <Link to={isLoggedIn ? "/dashboard" : "/login"}>
            <Button size="lg" className="h-14 px-10 bg-emerald-600 text-white hover:bg-emerald-500 border-0 rounded-full text-lg font-bold shadow-lg shadow-emerald-600/20">
              {isLoggedIn ? 'ไปยังแดชบอร์ด' : 'สมัครสมาชิกฟรี'}
            </Button>
          </Link>
        </div>
      </footer>
      
    </div>
  );
}

