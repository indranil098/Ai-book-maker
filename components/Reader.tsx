
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Book as BookType, ChatMessage, Character } from '../types';
import { geminiService } from '../services/geminiService';
import { markdownService } from '../services/markdownService';
import { Play, Pause, MessageSquare, X, Send, Volume2, Settings, ChevronLeft, ChevronRight, Check, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReaderProps {
  book: BookType;
}

// Available Gemini Voices
const GEMINI_VOICES = [
  { name: 'Kore', gender: 'Female', style: 'Soothing' },
  { name: 'Puck', gender: 'Male', style: 'Soft' },
  { name: 'Charon', gender: 'Male', style: 'Deep' },
  { name: 'Fenrir', gender: 'Male', style: 'Intense' },
  { name: 'Zephyr', gender: 'Female', style: 'Calm' }
];

// Audio decoding helper functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const Reader: React.FC<ReaderProps> = ({ book }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Audio State
  const [selectedVoice, setSelectedVoice] = useState(GEMINI_VOICES[0]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const activeChapter = book.chapters[activeChapterIndex];

  // Initialize Audio Context
  useEffect(() => {
    return () => {
       stopAudio();
       if (audioContextRef.current) {
         audioContextRef.current.close();
       }
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  const playAudio = async () => {
    if (!activeChapter.content) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    setIsLoadingAudio(true);
    setIsPlaying(true);

    try {
        // Prepare text - Strip HTML tags and limit length for optimal generation if needed
        const html = markdownService.parse(activeChapter.content);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        let textToRead = tempDiv.textContent || tempDiv.innerText || '';
        
        // Basic truncation to avoid hitting huge limits, though 2.5 flash handles large context well.
        // For a smoother UX, we might split by paragraphs, but for this "Audiobook" feature, 
        // we'll send the full chapter text (assuming < 10k chars usually).
        textToRead = textToRead.substring(0, 10000); 

        const base64Audio = await geminiService.generateSpeech(textToRead, selectedVoice.name);
        
        if (!base64Audio) throw new Error("No audio generated");

        if (!isPlaying) return; // If user stopped while loading

        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            audioContextRef.current,
            24000,
            1
        );

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
            setIsPlaying(false);
        };

        audioSourceRef.current = source;
        source.start();
        setIsLoadingAudio(false);

    } catch (error) {
        console.error("Audio playback error:", error);
        stopAudio();
        alert("Could not generate audio for this chapter.");
    }
  };

  const togglePlay = () => {
    if (isPlaying || isLoadingAudio) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  // Stop audio when changing chapters
  useEffect(() => {
    stopAudio();
  }, [activeChapterIndex]);

  const handleAskBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    try {
      const answer = await geminiService.askBook(userMsg.text, activeChapter.content || '', book.chapters.map(c => c.summary).join('\n'));
      const modelMsg: ChatMessage = { role: 'model', text: answer, timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);
    } finally {
      setIsThinking(false);
    }
  };
  
  const processedContent = useMemo(() => {
    if (!activeChapter.content) return '';
    let html = markdownService.parse(activeChapter.content);
    const sortedCharacters = [...book.characters].sort((a, b) => b.name.length - a.name.length);
    sortedCharacters.forEach(character => {
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
      if (character) setSelectedCharacter(character);
    }
  };


  if (!activeChapter) {
     return <div className="p-12 text-center text-stone-500 dark:text-stone-400">The library is empty. Create a book first.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-white/50 dark:bg-stone-950/50 backdrop-blur-xl relative overflow-hidden transition-colors duration-300">
      <style>{`
        .character-highlight {
          color: #D97706; text-decoration: underline; text-decoration-style: dotted;
          text-decoration-color: rgba(217, 119, 6, 0.5); cursor: pointer; transition: all 0.2s ease-in-out;
        }
        .dark .character-highlight { color: #FBBF24; text-decoration-color: rgba(251, 191, 36, 0.5); }
        .character-highlight:hover { background-color: rgba(251, 191, 36, 0.15); text-decoration: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d6d3d1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #44403c; }
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

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4"
               onClick={() => setShowSettings(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-sm border border-stone-100 dark:border-stone-800 overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                 <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-900/50">
                    <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={20} className="text-saffron-500" />
                        Audiobook Settings
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"><X size={20} /></button>
                 </div>
                 
                 <div className="p-6 space-y-6">
                    {/* Voice Selection */}
                    <div className="space-y-3">
                        <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Narrator Voice</span>
                        <div className="grid gap-2">
                            {GEMINI_VOICES.map((voice) => (
                                <button 
                                    key={voice.name}
                                    onClick={() => setSelectedVoice(voice)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all group ${selectedVoice.name === voice.name ? 'bg-saffron-50 dark:bg-saffron-900/20 text-saffron-700 dark:text-saffron-400 border border-saffron-200 dark:border-saffron-800 shadow-sm' : 'bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold">{voice.name}</span>
                                        <span className="text-[10px] opacity-60 font-normal">{voice.gender} • {voice.style}</span>
                                    </div>
                                    {selectedVoice.name === voice.name && (
                                        <div className="w-5 h-5 bg-saffron-500 rounded-full flex items-center justify-center text-white shrink-0">
                                            <Check size={12} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${showChat ? 'mr-0 md:mr-96 hidden md:block' : 'mr-0'}`}>
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
          <button onClick={() => setShowSettings(true)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${showSettings ? 'bg-stone-800 text-white' : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`} title="Audio Settings">
            <Settings size={20} />
          </button>
          <button onClick={togglePlay} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isPlaying || isLoadingAudio ? 'bg-saffron-500 text-white scale-110' : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white'}`} title={isPlaying ? "Pause Audiobook" : "Play Audiobook"}>
            {isLoadingAudio ? <Loader2 size={20} className="animate-spin" /> : isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${showChat ? 'bg-stone-800 text-white' : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300'}`}>
            <MessageSquare size={20} />
          </button>
        </div>

        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="absolute top-0 right-0 w-full md:w-96 h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl z-40 flex flex-col"
            >
              <div className="h-16 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between px-6 bg-stone-50 dark:bg-stone-900">
                <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2"><MessageSquare size={16} className="text-saffron-500"/> Ask the Book</span>
                <button onClick={() => setShowChat(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-900/50">
                {messages.length === 0 && <div className="text-center text-stone-400 dark:text-stone-500 mt-10 text-sm px-8"><p>I am the spirit of "{book.title}".</p><p className="mt-2">Ask me about characters, plot points, or hidden meanings.</p></div>}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-br-none' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-bl-none shadow-sm'}`}>{msg.text}</div>
                  </div>
                ))}
                {isThinking && <div className="flex justify-start"><div className="bg-white dark:bg-stone-800 border p-3 rounded-2xl rounded-bl-none shadow-sm"><div className="flex gap-1"><span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div></div></div>}
              </div>
              <form onSubmit={handleAskBook} className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
                <div className="relative">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." className="w-full pl-4 pr-12 py-3 bg-stone-100 dark:bg-stone-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400/50" />
                  <button type="submit" disabled={!input.trim() || isThinking} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-saffron-500 disabled:opacity-50"><Send size={14} /></button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
