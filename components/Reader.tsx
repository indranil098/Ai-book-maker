
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Book as BookType, Character } from '../types';
import { markdownService } from '../services/markdownService';
import { Play, Pause, Volume2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReaderProps {
  book: BookType;
}

export const Reader: React.FC<ReaderProps> = ({ book }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    return () => { if (synthesisRef.current) synthesisRef.current.cancel(); };
  }, []);

  const activeChapter = book.chapters[activeChapterIndex];

  const togglePlay = () => {
    if (!synthesisRef.current) return;
    if (isPlaying) {
      synthesisRef.current.pause();
      setIsPlaying(false);
    } else {
      if (synthesisRef.current.paused) {
        synthesisRef.current.resume();
      } else {
        synthesisRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(activeChapter.content || activeChapter.summary);
        utterance.onend = () => setIsPlaying(false);
        synthesisRef.current.speak(utterance);
      }
      setIsPlaying(true);
    }
  };

  if (!activeChapter) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-7rem)] bg-ivory dark:bg-stone-950 overflow-hidden relative">
      
      {/* Progress Bar */}
      <div className="w-full h-1 bg-stone-100 dark:bg-stone-900">
        <motion.div 
            className="h-full bg-saffron-500"
            initial={{ width: 0 }}
            animate={{ width: `${((activeChapterIndex + 1) / book.chapters.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-16">
        <article className="max-w-2xl mx-auto">
            <header className="mb-10 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">{book.title}</span>
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 dark:text-white leading-tight">{activeChapter.title}</h1>
            </header>

            <div className="prose prose-stone dark:prose-invert prose-base md:prose-lg max-w-none font-serif leading-relaxed md:leading-loose text-stone-800 dark:text-stone-200">
                <div dangerouslySetInnerHTML={{ __html: markdownService.parse(activeChapter.content || '') }} />
            </div>
        </article>
      </div>

      {/* Floating Reading Controls */}
      <div className="fixed bottom-6 inset-x-4 flex justify-center pointer-events-none z-40">
        <div className="pointer-events-auto bg-stone-900/90 dark:bg-stone-800/90 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl flex items-center gap-2">
            <button 
                disabled={activeChapterIndex === 0}
                onClick={() => setActiveChapterIndex(i => i - 1)}
                className="p-3 text-white hover:text-saffron-400 disabled:opacity-30 transition-colors"
            >
                <ChevronLeft size={20} />
            </button>
            
            <div className="px-4 flex flex-col items-center">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">Chapter</span>
                <span className="text-white font-bold text-sm leading-none">{activeChapterIndex + 1} / {book.chapters.length}</span>
            </div>

            <button onClick={togglePlay} className="p-3 bg-saffron-500 text-white rounded-full hover:scale-105 transition-transform">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Volume2 size={20} />}
            </button>

            <button 
                disabled={activeChapterIndex === book.chapters.length - 1}
                onClick={() => setActiveChapterIndex(i => i + 1)}
                className="p-3 text-white hover:text-saffron-400 disabled:opacity-30 transition-colors"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};
