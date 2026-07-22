import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Bot, ArrowRight, LayoutDashboard, Search, BarChart3, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
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
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  const features = [
    {
      icon: <Bot className="w-6 h-6 text-purple-400" />,
      title: "AI Content Generation",
      description: "สร้างบทความคุณภาพสูง ดึงดูดสายตา พร้อมรูปภาพประกอบโดยอัตโนมัติภายในไม่กี่นาที"
    },
    {
      icon: <Search className="w-6 h-6 text-pink-400" />,
      title: "SEO Optimized",
      description: "รองรับการทำ SEO แบบเจาะลึก พร้อมแนะนำ Keyword ที่จะทำให้เว็บของคุณติดหน้าแรก"
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: "Auto-Blogs & Campaigns",
      description: "ตั้งค่าแคมเปญให้ AI โพสต์บทความลงเว็บไซต์ของคุณอัตโนมัติ ประหยัดเวลาทำงาน 100%"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
      title: "Smart Analytics",
      description: "ติดตามผลลัพธ์และสถิติการเข้าชมอย่างละเอียด เพื่อปรับปรุงกลยุทธ์ได้อย่างแม่นยำ"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 overflow-x-hidden selection:bg-purple-500/30">
      
      {/* Decorative Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">z.ai<span className="text-purple-400 font-light ml-1.5">SEO Studio</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
              ลงชื่อเข้าใช้ (Sign In)
            </Link>
            <Link to="/login">
              <Button className="bg-white text-slate-900 hover:bg-slate-200 font-semibold rounded-full px-6 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] border-0">
                เริ่มต้นใช้งาน <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
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
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium">
              <Sparkles className="w-4 h-4" /> แพลตฟอร์มสร้างบทความ AI อันดับ 1
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl"
          >
            ปั้นเว็บไซต์ให้ติดหน้าแรก ด้วยพลังของ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">AI</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed"
          >
            ยกระดับการทำ SEO ของคุณแบบไม่ต้องเหนื่อย สร้างบทความที่มีคุณภาพ ค้นหาคีย์เวิร์ด และจัดการแคมเปญอัตโนมัติครบจบในที่เดียว
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/login">
              <Button size="lg" className="h-14 px-8 border-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-full text-lg font-bold shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:scale-105">
                ทดลองใช้งานฟรี <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white rounded-full text-lg font-medium backdrop-blur-sm">
                เข้าสู่ระบบ
              </Button>
            </Link>
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
        <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/80 p-2 sm:p-4 backdrop-blur-xl shadow-2xl shadow-purple-900/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
          <div className="rounded-xl sm:rounded-2xl border border-white/5 bg-slate-950 overflow-hidden aspect-video flex flex-col relative group">
            {/* Mock Header */}
            <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-slate-900">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="ml-4 h-6 bg-slate-800 rounded-md w-48 border border-white/5" />
            </div>
            {/* Mock Body */}
            <div className="flex-1 flex p-6 gap-6 relative">
              <div className="w-48 hidden sm:flex flex-col gap-3">
                <div className="h-8 bg-slate-800 rounded-lg w-full" />
                <div className="h-8 bg-slate-800/50 rounded-lg w-full" />
                <div className="h-8 bg-slate-800/50 rounded-lg w-full" />
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="h-32 bg-slate-800/80 rounded-xl w-full border border-white/5" />
                <div className="h-64 bg-slate-800/50 rounded-xl w-full border border-white/5" />
              </div>
              
              {/* Overlay Gradient for mystery */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/60 backdrop-blur-sm">
               <Link to="/login">
                  <Button className="bg-purple-600 border-0 hover:bg-purple-500 text-white rounded-full px-6 shadow-lg">
                    ดูตัวอย่างระบบจริง
                  </Button>
               </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">ฟีเจอร์เด่นที่จะช่วยคุณ</h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">ครบครันด้วยเครื่องมือที่ออกแบบมาเพื่อช่วยให้นักการตลาดและเจ้าของธุรกิจทำงานง่ายขึ้น</p>
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
                className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-500 transform translate-x-4 -translate-y-4">
                  {feature.icon}
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-6 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-20 text-center relative z-10 overflow-hidden border-t border-white/5 bg-slate-950">
        <div className="absolute inset-0 bg-purple-600/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">พร้อมที่จะเติบโตไปกับเราหรือยัง?</h2>
          <p className="text-slate-400 mb-8 text-lg">เริ่มต้นใช้งานฟรีวันนี้ ไม่มีค่าใช้จ่ายแอบแฝง</p>
          <Link to="/login">
            <Button size="lg" className="h-14 px-10 bg-white text-slate-900 hover:bg-slate-200 border-0 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              สมัครสมาชิกฟรี
            </Button>
          </Link>
        </div>
      </footer>
      
    </div>
  );
}
