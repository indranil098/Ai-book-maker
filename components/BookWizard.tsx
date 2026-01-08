import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Wand2, ChevronRight, Book, Feather, Palette, Type as TypeIcon } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Book as BookType, GenerationParams, Chapter } from '../types';

interface BookWizardProps {
  onBookCreated: (book: BookType) => void;
}

const GENRES = ["Comedy", "Fantasy", "Sci-Fi", "Romance", "Mystery", "Thriller", "Horror", "Historical Fiction", "Drama", "Self-Help"];
const TONES = ["Funny & Witty", "Lighthearted & Fun", "Emotional & Heartfelt", "Dark & Gritty", "Suspenseful & Tense", "Inspiring & Uplifting", "Whimsical & Magical"];
const STYLES = ["Simple & Direct", "Witty & Humorous", "Cinematic & Visual", "Descriptive & Flowery", "Fast-paced & Action"];
const PACING = ["Steady & Balanced", "Fast-paced", "Slow Burn"];

export const BookWizard: React.FC<BookWizardProps> = ({ onBookCreated }) => {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [liveCover, setLiveCover] = useState<string | null>(null);
  const [generatedBook, setGeneratedBook] = useState<BookType | null>(null);
  
  const [formData, setFormData] = useState<GenerationParams>({
    title: '',
    genre: 'Fantasy',
    tone: 'Whimsical & Magical',
    audience: 'Adult',
    writingStyle: 'Cinematic & Visual',
    perspective: 'Third Person Limited',
    pacing: 'Steady & Balanced',
    prompt: '',
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleGenerate = async () => {
    setStatus('generating');
    setProgressStep('Conjuring visual essence...');
    setProgressPercent(5);

    try {
      const coverPromise = geminiService.generateBookCover(formData.title, formData.genre, formData.tone)
        .then(url => { if(url) setLiveCover(url); return url; });

      const partialBook = await geminiService.generateBookStructure(
        formData.title, formData.genre, formData.tone, formData.audience, formData.pacing, formData.prompt
      );

      const fullyWrittenChapters: Chapter[] = [];
      const totalChapters = partialBook.chapters?.length || 0;

      for (let i = 0; i < totalChapters; i++) {
        const ch = partialBook.chapters![i];
        setProgressPercent(20 + Math.floor((i / totalChapters) * 70));
        setProgressStep(`Weaving Chapter ${i + 1}: ${ch.title}`);
        
        const content = await geminiService.generateChapterContent(
          formData.title, ch, formData.writingStyle, formData.perspective
        );

        fullyWrittenChapters.push({ ...ch, content, isGenerated: true });
      }

      const coverImage = await coverPromise;
      const newBook: BookType = {
        id: crypto.randomUUID(),
        title: partialBook.title || formData.title,
        author: partialBook.author || 'AI & You',
        genre: formData.genre,
        tone: formData.tone,
        targetAudience: formData.audience,
        chapters: fullyWrittenChapters,
        characters: partialBook.characters || [],
        createdAt: new Date(),
        coverImage: coverImage || `https://picsum.photos/seed/${Date.now()}/600/900`,
        style: formData.writingStyle,
        perspective: formData.perspective,
        pacing: formData.pacing
      };

      setGeneratedBook(newBook);
      setStatus('complete');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="w-full max-w-lg space-y-12">
           <div className="relative aspect-[3/4] w-64 mx-auto rounded-3xl overflow-hidden shadow-2xl bg-stone-900 border border-stone-800">
              {liveCover ? (
                <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={liveCover} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <Wand2 className="text-saffron-500 animate-spin" size={40} />
                  <span className="text-[10px] uppercase tracking-widest text-stone-500">Painting cover...</span>
                </div>
              )}
           </div>
           <div className="text-center space-y-4">
              <h2 className="font-serif text-3xl font-bold dark:text-white">{progressStep}</h2>
              <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${progressPercent}%` }} className="h-full bg-saffron-500" />
              </div>
              <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">{progressPercent}% Narrative Sync</p>
           </div>
        </div>
      </div>
    );
  }

  if (status === 'complete' && generatedBook) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-2xl p-12 rounded-[3rem] border border-white/50 dark:border-stone-800 shadow-2xl text-center max-w-2xl">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="font-serif text-4xl font-bold mb-2 dark:text-white">{generatedBook.title}</h2>
                <p className="text-stone-500 italic mb-8">A {generatedBook.genre} Masterpiece is Born.</p>
                <button onClick={() => onBookCreated(generatedBook)} className="px-12 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full font-bold text-xl shadow-xl hover:bg-saffron-500 dark:hover:bg-saffron-400 hover:text-white transition-all flex items-center justify-center gap-3 mx-auto">
                    Open Studio <ArrowRight size={20} />
                </button>
            </motion.div>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* Progress Dots */}
      <div className="flex justify-center gap-3 mb-12">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-saffron-500' : 'w-2 bg-stone-200 dark:bg-stone-800'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "circOut" }}
          className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-2xl p-10 md:p-16 rounded-[3rem] border border-white/50 dark:border-stone-800 shadow-xl"
        >
          {step === 1 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 text-saffron-500">
                <Book size={24} />
                <span className="text-xs font-mono uppercase tracking-[0.3em]">Phase 01: Conception</span>
              </div>
              <h1 className="font-serif text-5xl font-bold dark:text-white">What shall we name your story?</h1>
              <input 
                autoFocus
                type="text"
                placeholder="The Chronicles of..."
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-transparent border-b-2 border-stone-200 dark:border-stone-700 py-6 text-4xl font-serif font-bold focus:border-saffron-500 outline-none transition-colors dark:text-white placeholder:text-stone-300"
              />
              <textarea 
                placeholder="A brief seed of an idea... (Optional)"
                value={formData.prompt}
                onChange={e => setFormData({...formData, prompt: e.target.value})}
                className="w-full bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl h-32 outline-none focus:ring-2 focus:ring-saffron-500/20 text-lg dark:text-white"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10">
              <div className="flex items-center gap-4 text-saffron-500">
                <Palette size={24} />
                <span className="text-xs font-mono uppercase tracking-[0.3em]">Phase 02: Atmosphere</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Genre</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(g => (
                      <button key={g} onClick={() => setFormData({...formData, genre: g})} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.genre === g ? 'bg-saffron-500 text-white shadow-lg' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map(t => (
                      <button key={t} onClick={() => setFormData({...formData, tone: t})} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.tone === t ? 'bg-purple-500 text-white shadow-lg' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10">
              <div className="flex items-center gap-4 text-saffron-500">
                <TypeIcon size={24} />
                <span className="text-xs font-mono uppercase tracking-[0.3em]">Phase 03: Architecture</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Writing Style</label>
                    <select value={formData.writingStyle} onChange={e => setFormData({...formData, writingStyle: e.target.value})} className="w-full p-4 bg-stone-100 dark:bg-stone-800 rounded-xl outline-none dark:text-white">
                      {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Perspective</label>
                    <select value={formData.perspective} onChange={e => setFormData({...formData, perspective: e.target.value})} className="w-full p-4 bg-stone-100 dark:bg-stone-800 rounded-xl outline-none dark:text-white">
                      <option value="First Person (I)">First Person (I)</option>
                      <option value="Third Person Limited">Third Person Limited</option>
                      <option value="Third Person Omniscient">Third Person Omniscient</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Pacing</label>
                    <div className="space-y-3">
                        {PACING.map(p => (
                            <button key={p} onClick={() => setFormData({...formData, pacing: p})} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${formData.pacing === p ? 'border-saffron-500 bg-saffron-500/10 text-saffron-600' : 'border-transparent bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-8">
              <div className="w-20 h-20 bg-saffron-500/10 rounded-full flex items-center justify-center text-saffron-500 mx-auto animate-bounce">
                <Feather size={32} />
              </div>
              <h1 className="font-serif text-5xl font-bold dark:text-white">Ready to materialize?</h1>
              <p className="text-stone-500 dark:text-stone-400 text-lg max-w-sm mx-auto">
                We're about to weave "{formData.title}" into existence. This ritual takes a moment of focus.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono uppercase tracking-widest text-stone-400 pt-8 border-t border-stone-100 dark:border-stone-800">
                <div>{formData.genre} // {formData.tone}</div>
                <div>{formData.writingStyle} // {formData.pacing}</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-16 flex justify-between items-center">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 text-stone-400 hover:text-stone-900 dark:hover:text-white font-bold transition-colors">
                <ArrowLeft size={18} /> Previous
              </button>
            ) : <div />}
            
            {step < 4 ? (
              <button 
                onClick={nextStep} 
                disabled={step === 1 && !formData.title}
                className="px-10 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full font-bold flex items-center gap-3 shadow-xl hover:bg-saffron-500 hover:text-white transition-all disabled:opacity-30"
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleGenerate} 
                className="px-12 py-5 bg-saffron-500 text-white rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
              >
                <Sparkles size={24} /> Materialize Story
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
