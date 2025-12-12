import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, ImageIcon, AlertTriangle, Wand2, ChevronDown } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Book as BookType, GenerationParams, Chapter } from '../types';

interface BookWizardProps {
  onBookCreated: (book: BookType) => void;
}

export const BookWizard: React.FC<BookWizardProps> = ({ onBookCreated }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState('');
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [generatedBook, setGeneratedBook] = useState<BookType | null>(null);
  const [liveCover, setLiveCover] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<GenerationParams>({
    title: '',
    genre: 'Dark Romance',
    tone: 'Gothic & Mysterious',
    audience: 'Adult',
    prompt: '',
  });

  const handleChange = (field: keyof GenerationParams, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setStatus('generating');
    setErrorDetails('');
    setProgressStep('Conjuring visual essence...');
    setProgressPercent(5);

    try {
      const coverPromise = geminiService.generateBookCover(
        formData.title,
        formData.genre,
        formData.tone
      ).then(url => {
        if(url) setLiveCover(url);
        return url;
      });

      setProgressStep('Architecting narrative structure...');
      setProgressPercent(15);
      
      const partialBook = await geminiService.generateBookStructure(
        formData.title,
        formData.genre,
        formData.tone,
        formData.audience,
        formData.prompt
      );

      if (!partialBook.chapters) {
        throw new Error("Failed to generate chapters");
      }

      const fullyWrittenChapters: Chapter[] = [];
      const totalChapters = partialBook.chapters.length;

      for (let i = 0; i < totalChapters; i++) {
        const chapter = partialBook.chapters[i];
        
        const percent = 20 + Math.floor(((i) / totalChapters) * 70);
        setProgressPercent(percent);
        setProgressStep(`Weaving Chapter ${i + 1}: ${chapter.title}`);
        
        const prevSummary = i > 0 ? partialBook.chapters[i - 1].summary : undefined;
        
        const content = await geminiService.generateChapterContent(
          partialBook.title || formData.title,
          chapter,
          prevSummary
        );

        fullyWrittenChapters.push({
          ...chapter,
          content: content,
          isGenerated: true
        });
      }

      setProgressStep('Binding pages & finalizing ink...');
      setProgressPercent(95);
      
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
        coverImage: coverImage || liveCover || `https://picsum.photos/seed/${Date.now()}/600/900`
      };

      setGeneratedBook(newBook);
      setProgressPercent(100);
      setStatus('complete');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      
      const msg = e.message || e.toString();
      if (msg.includes("API Key is not configured") || msg.includes("AUTH_ERROR")) {
        setErrorDetails("The application's API Key is missing or invalid.");
      } else if (msg.includes("QUOTA") || msg.includes("429")) {
        setErrorDetails("The application's API quota has been exceeded.");
      } else {
        setErrorDetails("An unexpected error occurred during generation.");
      }
    }
  };

  // Error State
  if (status === 'error') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
           <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-100 dark:border-red-900/50">
              <AlertTriangle size={36} />
           </div>
           <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white mb-3">The Spell Failed</h2>
           <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-md leading-relaxed">{errorDetails}</p>
           
           <button onClick={() => setStatus('idle')} className="px-8 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full font-bold hover:bg-stone-800 transition-colors shadow-lg">
              Try Again
           </button>
        </div>
     );
  }

  // Generating State
  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative">
         {/* Background Pulse */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-[500px] h-[500px] bg-saffron-500/10 rounded-full blur-[120px] animate-pulse" />
         </div>

         <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
             {/* Cover Preview */}
             <div className="flex justify-center md:justify-end">
                <div className="relative w-64 aspect-[3/4] rounded-lg shadow-2xl shadow-saffron-500/10 overflow-hidden bg-stone-900 border border-stone-800">
                    <AnimatePresence mode="wait">
                       {liveCover ? (
                         <motion.img 
                           key="cover"
                           initial={{ opacity: 0, scale: 1.1 }}
                           animate={{ opacity: 1, scale: 1 }}
                           src={liveCover} 
                           alt="Generated Cover"
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <motion.div 
                            key="placeholder"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-full h-full flex flex-col items-center justify-center text-stone-600 gap-4 p-6"
                         >
                            <Sparkles size={32} className="text-saffron-500" />
                            <span className="text-xs font-serif text-center uppercase tracking-widest">Designing<br/>Cover Art</span>
                         </motion.div>
                       )}
                     </AnimatePresence>
                     {/* Gloss Effect */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                </div>
             </div>

             {/* Status Text */}
             <div className="text-center md:text-left">
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 dark:text-white mb-6 tracking-tight">
                    Forging Story
                </h2>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                            <span>Progress</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <div className="h-1 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-saffron-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ ease: "circOut" }}
                            />
                        </div>
                    </div>

                    <motion.div
                        key={progressStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-stone-600 dark:text-stone-300 font-medium"
                    >
                        <Wand2 size={18} className="text-saffron-500 animate-pulse" />
                        {progressStep}
                    </motion.div>
                </div>
             </div>
         </div>
      </div>
    );
  }

  // Complete State
  if (status === 'complete' && generatedBook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="relative w-full max-w-5xl bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl rounded-[3rem] p-8 md:p-16 shadow-2xl border border-white/50 dark:border-stone-800 flex flex-col md:flex-row gap-12 items-center"
        >
          {/* Book Display */}
          <div className="w-64 md:w-80 shrink-0 perspective-1000">
             <motion.div 
               initial={{ rotateY: -20, opacity: 0 }}
               animate={{ rotateY: 0, opacity: 1 }}
               transition={{ delay: 0.2, duration: 0.8 }}
               className="aspect-[3/4] rounded-xl shadow-2xl shadow-black/20 overflow-hidden relative"
             >
                <img src={generatedBook.coverImage} className="w-full h-full object-cover" />
                {/* Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 pointer-events-none" />
             </motion.div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-8">
             <div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    <CheckCircle2 size={14} /> Complete
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="font-serif text-5xl md:text-6xl font-bold text-stone-900 dark:text-white leading-[1.1] mb-2">
                    {generatedBook.title}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-xl text-stone-500 dark:text-stone-400 font-serif italic">
                    A {generatedBook.genre} by {generatedBook.author}
                </motion.p>
             </div>

             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
                 <button onClick={() => onBookCreated(generatedBook)} className="px-10 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full font-bold text-lg hover:bg-saffron-500 dark:hover:bg-saffron-400 hover:text-white transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2">
                    Start Reading <ArrowRight size={20} />
                 </button>
             </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Form View
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-stone-900 dark:text-white mb-6">Create a New Story</h1>
        <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
           Describe your vision, and our AI Master Author will weave the plot, characters, and cover art into existence.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl border border-white/60 dark:border-stone-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl"
      >
          <div className="space-y-10">
            {/* Title Input */}
            <div className="group">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 ml-2 group-focus-within:text-saffron-500 transition-colors">Book Title</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. The Last Alchemist"
                    className="w-full bg-transparent border-b-2 border-stone-200 dark:border-stone-800 focus:border-saffron-500 px-2 py-4 text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-stone-700 outline-none transition-colors"
                />
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 ml-2">Genre</label>
                    <div className="relative">
                        <select
                            value={formData.genre}
                            onChange={(e) => handleChange('genre', e.target.value)}
                            className="w-full appearance-none bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-2xl px-6 py-4 text-lg font-medium text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all cursor-pointer hover:bg-white dark:hover:bg-stone-800"
                        >
                             <option>Dark Romance</option>
                            <option>Science Fiction</option>
                            <option>Cyberpunk</option>
                            <option>High Fantasy</option>
                            <option>Cozy Mystery</option>
                            <option>Psychological Thriller</option>
                            <option>Romance</option>
                            <option>Non-Fiction</option>
                            <option>Horror</option>
                            <option>Historical Fiction</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
                    </div>
                </div>
                <div className="relative group">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 ml-2">Tone</label>
                    <div className="relative">
                         <select
                            value={formData.tone}
                            onChange={(e) => handleChange('tone', e.target.value)}
                            className="w-full appearance-none bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-2xl px-6 py-4 text-lg font-medium text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all cursor-pointer hover:bg-white dark:hover:bg-stone-800"
                        >
                            <option>Gothic & Mysterious</option>
                            <option>Adventurous & Epic</option>
                            <option>Dark & Gritty</option>
                            <option>Whimsical & Magical</option>
                            <option>Witty & Humorous</option>
                            <option>Intellectual & Academic</option>
                            <option>Romantic & Emotional</option>
                        </select>
                         <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
                    </div>
                </div>
            </div>

            {/* Prompt Area */}
            <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 ml-2">Story Premise (Optional)</label>
                <textarea
                    value={formData.prompt}
                    onChange={(e) => handleChange('prompt', e.target.value)}
                    placeholder="Describe the main conflict, characters, or specific scenes..."
                    rows={4}
                    className="w-full bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-2xl px-6 py-4 text-lg text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-stone-600 outline-none focus:ring-2 focus:ring-saffron-500/50 transition-all resize-none"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={!formData.title}
                className="w-full py-5 bg-stone-900 dark:bg-white hover:bg-saffron-500 dark:hover:bg-saffron-400 text-white dark:text-stone-900 font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-saffron-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform active:scale-[0.98]"
            >
                <Sparkles size={24} className={formData.title ? "animate-pulse text-saffron-400 dark:text-saffron-600" : "text-stone-500"} />
                <span>Generate Masterpiece</span>
            </button>
          </div>
      </motion.div>
    </div>
  );
};