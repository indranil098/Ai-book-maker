
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, PenTool, Globe, Layers, Twitter, Github, MessageSquare } from 'lucide-react';
import { ViewState } from '../types';

interface LandingProps {
  onStart: () => void;
  onNavigate: (view: ViewState) => void;
}

const ScrollTicker: React.FC = () => (
  <div className="w-full bg-stone-900 text-stone-300 py-4 md:py-6 overflow-hidden relative z-20 border-y border-stone-800">
     <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="flex whitespace-nowrap gap-12 md:gap-24 items-center"
     >
        {[...Array(6)].map((_, i) => (
           <div key={i} className="flex items-center gap-12 md:gap-24 opacity-80">
              <span className="text-[10px] md:text-sm font-mono uppercase tracking-[0.3em]">Digital Alchemy</span>
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-saffron-500"></span>
              <span className="text-[10px] md:text-sm font-mono uppercase tracking-[0.3em]">Neural Prose</span>
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-saffron-500"></span>
              <span className="text-[10px] md:text-sm font-mono uppercase tracking-[0.3em]">Infinite Worlds</span>
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-saffron-500"></span>
           </div>
        ))}
     </motion.div>
  </div>
);

const HeroVisual: React.FC = () => (
    <div className="relative w-full max-w-[20rem] md:max-w-[30rem] aspect-square flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[1px] border-stone-900/10 dark:border-stone-100/10 rounded-[40%]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-[20%] bg-gradient-to-tr from-saffron-500/20 to-purple-500/10 rounded-full blur-3xl" />
        
        <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-40 h-56 md:w-64 md:h-96 bg-stone-900 dark:bg-stone-800 rounded-r-2xl rounded-l-md shadow-2xl flex flex-col items-center justify-center overflow-hidden z-20 border-l-4 border-stone-800"
        >
             <div className="absolute inset-0 bg-stone-800" />
             <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600&auto=format&fit=crop" alt="AI Visualization" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
             <div className="absolute inset-0 bg-gradient-to-b from-stone-800/30 to-stone-950/90" />
             <div className="relative z-10 p-4 md:p-6 text-center flex flex-col items-center">
                <Sparkles className="text-saffron-400 mb-4" size={20} />
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-2">Novelia</h3>
                <div className="h-0.5 w-6 bg-saffron-500 rounded-full mb-3" />
                <p className="text-stone-300 text-[8px] md:text-[10px] uppercase tracking-[0.2em]">Neural Engine</p>
             </div>
        </motion.div>
    </div>
);

const Footer: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => (
  <footer className="bg-stone-950 text-stone-400 pt-24 pb-12 px-6 relative overflow-hidden border-t border-stone-900">
      {/* Background Typography Watermark */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
          <h1 className="text-[15rem] md:text-[25rem] font-serif font-black text-white leading-none tracking-tighter">
              NOVELIA
          </h1>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
              
              {/* Column 1: Brand & Purpose */}
              <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(ViewState.LANDING)}>
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 p-2 border border-white/10">
                        <img 
                            src="https://github.com/indranil122/image/blob/main/ChatGPT%20Image%20Dec%204,%202025,%2012_50_02%20AM-Photoroom.png?raw=true" 
                            alt="Logo" 
                            className="w-full h-full object-contain" 
                        />
                      </div>
                      <span className="font-serif font-bold text-2xl text-stone-100">Novelia<span className="text-saffron-500">.</span></span>
                  </div>
                  <p className="text-stone-500 text-sm leading-relaxed pr-4 max-w-md">
                      Redefining the relationship between author and intelligence. We build the tools for the next golden age of literature.
                  </p>
                  <div className="flex gap-4">
                      <a href="#" className="p-2 bg-stone-900 rounded-lg hover:text-saffron-400 transition-colors"><Twitter size={18} /></a>
                      <a href="#" className="p-2 bg-stone-900 rounded-lg hover:text-saffron-400 transition-colors"><Github size={18} /></a>
                      <a href="#" className="p-2 bg-stone-900 rounded-lg hover:text-saffron-400 transition-colors"><MessageSquare size={18} /></a>
                  </div>
              </div>

              {/* Column 2: Studio Actions */}
              <div className="flex flex-col md:items-end gap-6 justify-center">
                  <h4 className="text-stone-200 font-mono text-xs uppercase tracking-[0.2em] font-bold">Studio Access</h4>
                  <button onClick={() => onNavigate(ViewState.WIZARD)} className="flex items-center gap-2 text-xl font-serif font-bold text-white hover:text-saffron-400 transition-colors group">
                     Enter Our Studio 
                     <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-12 border-t border-stone-900 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-stone-600">
                      © {new Date().getFullYear()} Novelia Intelligence Inc.
                  </p>
                  <div className="flex gap-6">
                      <button onClick={() => onNavigate(ViewState.PRIVACY)} className="text-[10px] font-mono uppercase tracking-widest hover:text-stone-100 transition-colors">Privacy</button>
                      <button onClick={() => onNavigate(ViewState.TERMS)} className="text-[10px] font-mono uppercase tracking-widest hover:text-stone-100 transition-colors">Terms</button>
                  </div>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono uppercase tracking-widest">Neural Systems Online</span>
              </div>
          </div>
      </div>
  </footer>
);

export const Landing: React.FC<LandingProps> = ({ onStart, onNavigate }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, -150]);
  
  return (
    <div ref={containerRef} className="w-full min-h-screen overflow-x-hidden selection:bg-saffron-500 selection:text-white bg-ivory dark:bg-stone-950">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center px-6 pt-24 md:pt-0 overflow-hidden">
         <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
             
             <div className="order-2 md:order-1">
                 <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <span className="h-px w-8 md:w-12 bg-saffron-500"></span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">Intelligence v3.0</span>
                    </div>

                    <h1 className="font-serif text-6xl sm:text-7xl md:text-[7rem] lg:text-[9rem] font-bold leading-[0.85] text-stone-900 dark:text-stone-100 tracking-tighter">
                        UN<br/>WRITTEN
                    </h1>

                    <p className="text-base md:text-xl text-stone-600 dark:text-stone-400 max-w-sm leading-relaxed border-l-2 border-stone-200 dark:border-stone-800 pl-5">
                        The silence of a blank page ends here. Co-author your legacy with an adaptive neural engine.
                    </p>

                    <div className="flex pt-4 md:pt-8">
                        <button onClick={onStart} className="w-full md:w-auto px-10 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm tracking-widest uppercase rounded-full hover:bg-saffron-500 hover:text-white transition-all flex items-center justify-center gap-4 group shadow-xl">
                            <span>Initialize Studio</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                 </motion.div>
             </div>

             <div className="order-1 md:order-2 flex items-center justify-center relative">
                <motion.div style={{ y: typeof window !== 'undefined' && window.innerWidth > 768 ? y : 0 }} className="relative z-10 w-full flex justify-center scale-90 md:scale-100">
                    <HeroVisual />
                </motion.div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[15rem] md:text-[30rem] font-serif font-black text-stone-200 dark:text-stone-900/50 opacity-40 select-none -z-10 leading-none">&</div>
             </div>
         </div>
      </section>

      <ScrollTicker />

      {/* --- FEATURE GRID --- */}
      <section className="py-20 md:py-40 px-6">
          <div className="max-w-7xl mx-auto">
              <div className="mb-12 md:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-stone-200 dark:border-stone-800 pb-8">
                  <h2 className="text-4xl md:text-7xl font-serif font-bold text-stone-900 dark:text-white leading-none">
                      The Architecture
                  </h2>
                  <p className="text-stone-400 text-[10px] font-mono tracking-widest uppercase text-right">
                      // Optimized for Creativity <br/>
                      Core Creative Modules
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {[
                    { icon: Layers, title: "Structural Ideation", desc: "Generate comprehensive chapter outlines and character arcs instantly." },
                    { icon: PenTool, title: "Adaptive Prose", desc: "Our neural engine mimics your tone, from gothic noir to crisp non-fiction.", dark: true },
                    { icon: Globe, title: "Universal Export", desc: "Publish-ready formats at your fingertips. Seamless PDF and EPUB generation." }
                  ].map((feat, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5 }}
                        className={`p-8 md:p-10 border rounded-2xl transition-all shadow-sm hover:shadow-xl ${feat.dark ? 'bg-stone-900 text-white border-stone-800' : 'bg-white/50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800'}`}
                    >
                        <feat.icon className={`w-10 h-10 mb-6 stroke-1 ${feat.dark ? 'text-saffron-400' : 'text-stone-900 dark:text-white'}`} />
                        <h3 className="text-2xl font-serif font-bold mb-3">{feat.title}</h3>
                        <p className={`text-sm leading-relaxed ${feat.dark ? 'text-stone-400' : 'text-stone-500'}`}>{feat.desc}</p>
                    </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- REIMAGINED FOOTER --- */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
