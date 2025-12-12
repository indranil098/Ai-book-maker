
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Book as BookType, Character } from '../types';
import { markdownService } from '../services/markdownService';
import { Play, Pause, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReaderProps {
  book: BookType;
}

export const Reader: React.FC<ReaderProps> = ({ book }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  const activeChapter = book.chapters[activeChapterIndex];

  // Initialize and load TTS voices
  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length === 0) return;
      setVoices(available);
      
      const rankedVoices = [
        // Premium Natural Voices
        'Microsoft Zira - English (United States)',
        'Microsoft David - English (United States)',
        'Google US English', 
        'Google UK English Female',
        'Google UK English Male',
        'Samantha', // Apple
        'Alex',     // Apple
        'Daniel',   // Apple UK
        // Standard High Quality
        'Microsoft Zira Online (Natural) - English (United States)',
        'Microsoft Guy Online (Natural) - English (United States)',
      ];
      let bestVoice: SpeechSynthesisVoice | null = null;
      for (const name of rankedVoices) {
          const found = available.find(v => v.name === name && v.lang.startsWith('en'));
          if (found) { bestVoice = found; break; }
      }
      if (!bestVoice) {
          bestVoice = available.find(v => v.lang === 'en-US' && v.default) || available.find(v => v.lang.startsWith('en'));
      }
      if (bestVoice) setSelectedVoice(bestVoice);
    };
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
    return () => { if (synthesisRef.current) synthesisRef.current.cancel(); };
  }, []);

  // CRITICAL BUG FIX: Stop TTS when chapter changes
  useEffect(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsPlaying(false);
    }
  }, [activeChapterIndex]);


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
        
        // Use markdownService to get clean text for speech
        const html = markdownService.parse(activeChapter.content || activeChapter.summary);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const textToRead = tempDiv.textContent || tempDiv.innerText || '';

        const utterance = new SpeechSynthesisUtterance(textToRead);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = 0.95; // Slightly slower for audiobook pace
        utterance.pitch = 1.0; // Natural pitch
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (e) => { console.error("TTS Error:", e); setIsPlaying(false); };
        synthesisRef.current.speak(utterance);
      }
      setIsPlaying(true);
    }
  };
  
  const processedContent = useMemo(() => {
    if (!activeChapter.content) return '';
    let html = markdownService.parse(activeChapter.content);
    
    // Sort characters by name length, longest first, to avoid partial matches (e.g., matching "Ed" inside "Edward")
    const sortedCharacters = [...book.characters].sort((a, b) => b.name.length - a.name.length);

    sortedCharacters.forEach(character => {
      // This regex finds the character name as a whole word, not as part of another word.
      // It uses a negative lookbehind and lookahead to ensure it's not part of a larger alphanumeric sequence.
      const regex = new RegExp(`(?<!\\w)(${character.name})(?!\\w)`, 'gi');
      html = html.replace(regex, (match) => 
        `<span class="character-highlight" data-character-name="${character.name}">${match}</span>`
      );
    });

    return html;
  }, [activeChapter.content, book.characters]);

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('character-highlight')) {
      const charName = target.getAttribute('data-character-name');
      const character = book.characters.find(c => c.name === charName);
      if (character) {
        setSelectedCharacter(character);
      }
    }
  };


  if (!activeChapter) {
     return <div className="p-12 text-center text-stone-500 dark:text-stone-400">The library is empty. Create a book first.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-white/50 dark:bg-stone-950/50 backdrop-blur-xl relative overflow-hidden transition-colors duration-300">
      <style>{`
        .character-highlight {
          color: #D97706; /* saffron-600 */
          text-decoration: underline;
          text-decoration-style: dotted;
          text-decoration-color: rgba(217, 119, 6, 0.5);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .dark .character-highlight {
          color: #FBBF24; /* saffron-400 */
          text-decoration-color: rgba(251, 191, 36, 0.5);
        }
        .character-highlight:hover {
          background-color: rgba(251, 191, 36, 0.15);
          text-decoration: none;
        }
      `}</style>

      <div className="w-full h-1 bg-stone-200 dark:bg-stone-800 shrink-0">
         <motion.div 
           className="h-full bg-saffron-500"
           initial={{ width: 0 }}
           animate={{ width: `${((activeChapterIndex + 1) / book.chapters.length) * 100}%` }}
           transition={{ duration: 0.5, ease: "easeInOut" }}
         />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence>
          {selectedCharacter && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setSelectedCharacter(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-stone-100 dark:border-stone-800"
                onClick={e => e.stopPropagation()}
              >
                  <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white mb-1">{selectedCharacter.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-widest text-saffron-600 dark:text-saffron-400 mb-4 bg-saffron-50 dark:bg-saffron-900/20 px-3 py-1 rounded-full">{selectedCharacter.role}</span>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-sm mt-4">{selectedCharacter.description}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex-1 overflow-y-auto transition-all duration-300 mr-0`}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeChapterIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="max-w-3xl mx-auto min-h-full bg-ivory dark:bg-stone-950 shadow-2xl my-2 md:my-8 rounded-sm flex flex-col relative"
            >
              <div className="px-6 md:px-16 pt-12 pb-4">
                <span className="text-xs font-bold tracking-widest text-stone-400 dark:text-stone-600 uppercase mb-2 block truncate">{book.title}</span>
                <h1 className="font-serif text-3xl md:text-4xl text-stone-900 dark:text-stone-100">{activeChapter.title}</h1>
              </div>
              
              <div className="flex-1 px-6 md:px-16 py-6">
                {activeChapter.content ? (
                  <div
                    onClick={handleContentClick}
                    className="prose prose-lg prose-stone dark:prose-invert max-w-none font-serif leading-loose text-stone-800 dark:text-stone-300"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                  />
                ) : (
                  <div className="text-stone-400 italic text-center py-12">(Content not generated yet. Go to Editor.)</div>
                )}
              </div>

              <div className="px-6 md:px-16 pb-8 pt-4 flex justify-between text-stone-400 dark:text-stone-600 text-xs font-mono border-t border-stone-100 dark:border-stone-800 mt-8">
                <span>Page {activeChapterIndex + 1}</span>
                <span>{(activeChapter.content?.length || 0) / 500 | 0} min read</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-stone-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg z-30">
            <button disabled={activeChapterIndex === 0} onClick={() => setActiveChapterIndex(i => i - 1)} className="p-1 hover:text-saffron-400 disabled:opacity-30"><ChevronLeft size={20} /></button>
            <span className="text-sm font-medium px-2">{activeChapterIndex + 1} / {book.chapters.length}</span>
            <button disabled={activeChapterIndex === book.chapters.length - 1} onClick={() => setActiveChapterIndex(i => i + 1)} className="p-1 hover:text-saffron-400 disabled:opacity-30"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="absolute top-4 right-4 md:right-6 flex flex-col gap-3 z-20">
          <button onClick={togglePlay} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg ${isPlaying ? 'bg-saffron-500 text-white' : 'bg-white dark:bg-stone-800'}`} title={selectedVoice ? `Read with ${selectedVoice.name}` : 'Read Aloud'}>
            {isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
