import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, PenTool, Globe, Fingerprint, Layers, Book } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

// --- MICRO COMPONENTS ---

const ScrollTicker: React.FC = () => (
  <div className="w-full bg-stone-900 text-stone-300 py-6 overflow-hidden relative z-20 border-y border-stone-800">
     <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="flex whitespace-nowrap gap-24 items-center"
     >
        {[...Array(6)].map((_, i) => (
           <div key={i} className="flex items-center gap-24 opacity-80">
              <span className="text-sm font-mono uppercase tracking-[0.3em]">Digital Alchemy</span>
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-500"></span>
              <span className="text-sm font-mono uppercase tracking-[0.3em]">Neural Prose</span>
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-500"></span>
              <span className="text-sm font-mono uppercase tracking-[0.3em]">Infinite Worlds</span>
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-500"></span>
           </div>
        ))}
     </motion.div>
  </div>
);

const HeroVisual: React.FC = () => (
    <div className="relative w-full max-w-[30rem] aspect-square flex items-center justify-center">
        {/* Rotating Rings */}
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[1px] border-stone-900/10 dark:border-stone-100/10 rounded-[40%]"
        />
        <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute inset-8 border-[1px] border-stone-900/10 dark:border-stone-100/10 rounded-[38%] rotate-12"
        />
        <motion.div 
            animate={{ rotate: 180 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute inset-16 border-[1px] border-stone-900/10 dark:border-stone-100/10 rounded-[35%] -rotate-12"
        />

        {/* Dynamic Glow */}
        <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
             transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
             className="absolute inset-[20%] bg-gradient-to-tr from-saffron-500/20 to-purple-500/10 rounded-full blur-3xl"
        />
        
        {/* Floating Book Element - Made more distinct */}
        <motion.div
            animate={{ y: [-10, 10, -10], rotate: [0, 1, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-56 h-80 md:w-64 md:h-96 bg-stone-900 dark:bg-stone-800 rounded-r-2xl rounded-l-md shadow-2xl flex flex-col items-center justify-center overflow-hidden z-20 border-l-4 border-stone-800"
        >
             {/* Texture/Image - Ensure Fallback Color */}
             <div className="absolute inset-0 bg-stone-800" />
             <img 
                src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600&auto=format&fit=crop" 
                alt="AI Visualization" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-stone-800/30 to-stone-950/90" />
             
             {/* Content on Book */}
             <div className="relative z-10 p-6 text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20 shadow-lg">
                    <Sparkles className="text-saffron-400 fill-saffron-400/20" size={24} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2 tracking-wide drop-shadow-md">Novelia</h3>
                <div className="h-0.5 w-8 bg-saffron-500 rounded-full mb-3" />
                <p className="text-stone-300 text-[10px] uppercase tracking-[0.2em] font-medium">Neural Engine</p>
             </div>
             
             {/* Spine Highlight */}
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-white/20 to-transparent" />
        </motion.div>

        {/* Floating Particles */}
        <motion.div 
           animate={{ y: [-20, -40], opacity: [0, 1, 0] }}
           transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
           className="absolute top-10 right-10 text-saffron-500"
        >
           <Sparkles size={20} />
        </motion.div>
        <motion.div 
           animate={{ y: [20, 40], opacity: [0, 1, 0] }}
           transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
           className="absolute bottom-20 left-10 text-stone-400"
        >
           <Book size={24} />
        </motion.div>
    </div>
);

const Footer: React.FC = () => (
  <footer className="bg-stone-950 text-stone-400 py-16 border-t border-stone-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Left Side: Brand Identity */}
          <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 p-1.5 border border-white/10">
                    <img 
                        src="https://github.com/indranil122/image/blob/main/ChatGPT%20Image%20Dec%204,%202025,%2012_50_02%20AM-Photoroom.png?raw=true" 
                        alt="Novelia Logo" 
                        className="w-full h-full object-contain" 
                    />
                  </div>
                  <span className="font-serif font-bold text-3xl text-stone-200 tracking-tight">Novelia.</span>
              </div>
              <span className="hidden md:block h-5 w-px bg-stone-800" />
              <p className="text-xs font-mono text-stone-600 uppercase tracking-[0.2em]">
                  AI Book Studio
              </p>
          </div>

          {/* Right Side: Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-8">
              <p className="text-xs font-mono text-stone-600 uppercase tracking-widest">
                  © {new Date().getFullYear()} Novelia Intelligence
              </p>
          </div>
      </div>
      
      {/* Subtle Background Glow in Footer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-stone-800 to-transparent opacity-50" />
  </footer>
);

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, -150]);
  
  return (
    <div ref={containerRef} className="w-full min-h-screen overflow-x-hidden selection:bg-saffron-500 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 md:pt-0 overflow-hidden">
         {/* Background Elements */}
         <div className="absolute top-0 right-0 p-12 opacity-10 hidden md:block">
            <Fingerprint size={200} strokeWidth={0.5} className="text-stone-300 dark:text-stone-700" />
         </div>

         {/* Grid Container - Adjusted Breakpoints to show visual on MD screens */}
         <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
             
             {/* Text Block */}
             <div className="order-2 md:order-1 relative">
                 <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-8"
                 >
                    <div className="flex items-center gap-4">
                        <span className="h-px w-12 bg-saffron-500"></span>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-stone-500">Intelligence v3.0</span>
                    </div>

                    <h1 className="font-serif text-[5rem] md:text-[6rem] lg:text-[8rem] font-bold leading-[0.9] text-stone-900 dark:text-stone-100 tracking-tight">
                        UN<br/>WRITTEN
                    </h1>

                    <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 max-w-md leading-relaxed border-l-2 border-stone-200 dark:border-stone-800 pl-6 mt-2">
                        The silence of a blank page ends here. Co-author your legacy with an adaptive neural engine designed for the art of storytelling.
                    </p>

                    <div className="flex flex-wrap gap-6 pt-8">
                        <button 
                            onClick={onStart}
                            className="px-10 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-saffron-500 hover:text-white transition-all duration-300 flex items-center gap-4 group shadow-2xl"
                        >
                            <span>Initialize Studio</span>
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                 </motion.div>
             </div>

             {/* Hero Visual - Visible on MD+, Removed Opacity Scroll Effect to ensure visibility */}
             <div className="order-1 md:order-2 hidden md:flex items-center justify-center relative pointer-events-none">
                <motion.div style={{ y }} className="relative z-10 w-full flex justify-center">
                    <HeroVisual />
                </motion.div>
                
                {/* Background Character - Darkened for visibility */}
                <div className="absolute right-[-2rem] top-1/2 -translate-y-1/2 text-[20rem] lg:text-[30rem] font-serif font-black text-stone-200 dark:text-stone-800 opacity-80 select-none -z-10 leading-none overflow-visible mix-blend-multiply dark:mix-blend-screen">
                    &
                </div>
             </div>
         </div>
      </section>

      <ScrollTicker />

      {/* --- FEATURE GRID --- */}
      <section className="py-40 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
              <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
                  <h2 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 dark:text-white leading-[0.9]">
                      The <br/><span className="text-stone-300 dark:text-stone-700 italic">Architecture</span>
                  </h2>
                  <p className="max-w-xs text-stone-400 text-xs font-mono text-right tracking-widest uppercase">
                      // Core Modules <br/>
                      Optimized for Creativity
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Card 1 */}
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl p-10 border border-stone-200 dark:border-stone-800 rounded-sm hover:border-saffron-500/30 transition-colors group"
                  >
                      <Layers className="w-12 h-12 text-stone-900 dark:text-stone-100 mb-8 stroke-1" />
                      <h3 className="text-3xl font-serif font-bold mb-4 text-stone-900 dark:text-white">Structural<br/>Ideation</h3>
                      <p className="text-stone-500 text-sm leading-relaxed mb-8">
                          Generate comprehensive chapter outlines, character arcs, and world-building constraints instantly.
                      </p>
                      <div className="h-0.5 w-12 bg-stone-200 dark:bg-stone-800 group-hover:bg-saffron-500 group-hover:w-full transition-all duration-700" />
                  </motion.div>

                  {/* Card 2 */}
                  <motion.div 
                    whileHover={{ y: -10 }}
                    transition={{ delay: 0.1 }}
                    className="bg-stone-900 dark:bg-stone-100 p-10 border border-stone-900 rounded-sm relative overflow-hidden group text-white dark:text-stone-900"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Fingerprint size={150} />
                      </div>
                      <PenTool className="w-12 h-12 mb-8 stroke-1 relative z-10" />
                      <h3 className="text-3xl font-serif font-bold mb-4 relative z-10">Adaptive<br/>Prose</h3>
                      <p className="opacity-70 text-sm leading-relaxed mb-8 relative z-10">
                          Our neural engine mimics your tone. From gothic noir to crisp non-fiction, it adapts to your voice.
                      </p>
                      <div className="h-0.5 w-12 bg-white/20 dark:bg-black/20 group-hover:bg-saffron-500 group-hover:w-full transition-all duration-700 relative z-10" />
                  </motion.div>

                  {/* Card 3 */}
                  <motion.div 
                    whileHover={{ y: -10 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/50 dark:bg-stone-900/50 backdrop-blur-xl p-10 border border-stone-200 dark:border-stone-800 rounded-sm hover:border-saffron-500/30 transition-colors group"
                  >
                      <Globe className="w-12 h-12 text-stone-900 dark:text-stone-100 mb-8 stroke-1" />
                      <h3 className="text-3xl font-serif font-bold mb-4 text-stone-900 dark:text-white">Universal<br/>Export</h3>
                      <p className="text-stone-500 text-sm leading-relaxed mb-8">
                          Publish-ready formats at your fingertips. Seamless PDF and EPUB generation for all major readers.
                      </p>
                      <div className="h-0.5 w-12 bg-stone-200 dark:bg-stone-800 group-hover:bg-saffron-500 group-hover:w-full transition-all duration-700" />
                  </motion.div>
              </div>
          </div>
      </section>

      {/* --- STATEMENT SECTION --- */}
      <section className="py-32 bg-stone-900 text-stone-100 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                    <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" className="text-white" fill="currentColor" />
                    </pattern>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
                </svg>
          </div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
              <Sparkles className="w-16 h-16 text-saffron-500 mx-auto mb-12 animate-pulse" />
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight">
                  "The most advanced tool isn't the one that writes for you.<br/> It's the one that helps you write."
              </h2>
              <button 
                onClick={onStart}
                className="mt-12 px-12 py-5 border border-stone-700 rounded-full hover:bg-saffron-500 hover:text-white hover:border-saffron-500 transition-all duration-300 font-bold tracking-widest uppercase text-xs"
              >
                  Start Your Masterpiece
              </button>
          </div>
      </section>

      {/* --- MODERN MINIMAL FOOTER --- */}
      <Footer />

    </div>
  );
};