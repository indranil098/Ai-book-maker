import React, { useState, useRef } from 'react';
import { Book as BookType, Chapter } from '../types';
import { geminiService } from '../services/geminiService';
import { epubService } from '../services/epubService';
import { pdfService } from '../services/pdfService';
import { markdownService } from '../services/markdownService';
import { Eye, Download, PenLine, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Wand2, Loader2, Save, Library, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorProps {
  book: BookType;
  onUpdateBook: (updatedBook: BookType) => void;
  onViewLibrary: () => void;
}

export const Editor: React.FC<EditorProps> = ({ book, onUpdateBook, onViewLibrary }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChapter = book.chapters[activeChapterIndex];

  const handleContentChange = (newContent: string) => {
    const updatedChapters = [...book.chapters];
    updatedChapters[activeChapterIndex] = {
      ...updatedChapters[activeChapterIndex],
      content: newContent
    };
    onUpdateBook({ ...book, chapters: updatedChapters });
  };
  
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (target.selectionStart !== target.selectionEnd) {
      setSelectionRange({ start: target.selectionStart, end: target.selectionEnd });
    } else {
      setSelectionRange(null);
    }
  };

  const generateContent = async () => {
    if (!activeChapter) return;
    setIsGenerating(true);
    try {
      const prevChapterSummary = activeChapterIndex > 0 ? book.chapters[activeChapterIndex - 1].summary : undefined;
      const content = await geminiService.generateChapterContent(book.title, activeChapter, prevChapterSummary);
      
      if (!content || content.length < 50) {
          throw new Error("Content generation returned empty.");
      }
      handleContentChange(content);
      const updatedChapters = [...book.chapters];
      updatedChapters[activeChapterIndex].isGenerated = true;
      onUpdateBook({ ...book, chapters: updatedChapters });

    } catch (error) {
      console.error(error);
      alert("Failed to generate content.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = async () => {
    if (!selectionRange || !activeChapter.content) return;
    const textToRewrite = activeChapter.content.substring(selectionRange.start, selectionRange.end);
    if (!textToRewrite.trim()) return;

    setIsRewriting(true);
    try {
      const rewrittenText = await geminiService.rewriteText(
        textToRewrite, 
        rewriteInstruction || "Improve readability and flow",
        `${book.title} - ${book.genre}`
      );
      const before = activeChapter.content.substring(0, selectionRange.start);
      const after = activeChapter.content.substring(selectionRange.end);
      handleContentChange(before + rewrittenText + after);
      setShowRewriteModal(false);
      setSelectionRange(null);
      setRewriteInstruction("");
    } catch (error) {
      console.error(error);
      alert("Failed to rewrite.");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleExport = async (type: 'pdf' | 'epub') => {
    setIsExporting(true);
    try { 
        if(type === 'pdf') pdfService.generatePdf(book);
        else await epubService.generateEpub(book);
    } 
    catch(e) { console.error(e); alert("Export failed."); } 
    finally { setIsExporting(false); }
  };

  if (!activeChapter) return <div className="p-20 text-center text-stone-500">No content.</div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] relative">
      {/* Background Rewrite Modal */}
      <AnimatePresence>
        {showRewriteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-stone-100 dark:border-stone-800"
            >
                <h3 className="font-serif font-bold text-lg mb-4 text-stone-900 dark:text-white">AI Rewrite</h3>
                <textarea 
                  value={rewriteInstruction}
                  onChange={(e) => setRewriteInstruction(e.target.value)}
                  placeholder="How should I change this text? (e.g. 'Make it more ominous')"
                  className="w-full h-32 p-4 bg-stone-50 dark:bg-stone-800 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-saffron-500/50 mb-4 text-stone-900 dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowRewriteModal(false)} className="px-4 py-2 text-stone-500 hover:text-stone-900 text-sm font-bold">Cancel</button>
                  <button onClick={handleRewrite} disabled={isRewriting} className="px-6 py-2 bg-saffron-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-saffron-500/20 flex items-center gap-2">
                    {isRewriting ? <Loader2 className="animate-spin" size={14} /> : "Rewrite"}
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
       <AnimatePresence initial={false}>
        {!isFocusMode && showSidebar && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }} 
            animate={{ width: 300, opacity: 1 }} 
            exit={{ width: 0, opacity: 0 }} 
            transition={{ ease: "easeInOut", duration: 0.3 }}
            className="flex-shrink-0 bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl border-r border-white/20 dark:border-white/5 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-stone-200/30 dark:border-stone-800/30">
               <button 
                onClick={onViewLibrary}
                className="flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white mb-3 transition-colors uppercase tracking-wider"
               >
                 <ChevronLeft size={14} /> Back to Library
               </button>
               <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white leading-tight mb-1">{book.title}</h3>
               <p className="text-xs font-bold uppercase tracking-widest text-stone-400">{book.chapters.length} Chapters</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {book.chapters.map((chapter, idx) => (
                    <button
                        key={chapter.id}
                        onClick={() => setActiveChapterIndex(idx)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all group ${activeChapterIndex === idx ? 'bg-white dark:bg-stone-800 shadow-sm text-stone-900 dark:text-white font-semibold' : 'text-stone-500 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-800/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono w-5 ${activeChapterIndex === idx ? 'text-saffron-500' : 'text-stone-300'}`}>{(idx+1).toString().padStart(2, '0')}</span>
                            <span className="truncate flex-1">{chapter.title}</span>
                            {chapter.content && chapter.content.length > 50 && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                        </div>
                    </button>
                ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden bg-white/20 dark:bg-stone-950/20 backdrop-blur-sm">
        {/* Floating Toolbar */}
        {!isFocusMode && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-stone-900/90 dark:bg-stone-800/90 backdrop-blur-md rounded-full text-stone-400 shadow-2xl scale-90 md:scale-100">
               <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Toggle Sidebar">
                  {showSidebar ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18} />}
               </button>
               <div className="w-px h-4 bg-white/10 mx-1" />
               <button onClick={onViewLibrary} className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Go to Library"><Library size={18}/></button>
               <button onClick={() => setIsPreview(!isPreview)} className={`p-2 rounded-full transition-colors ${isPreview ? 'text-saffron-400 bg-white/10' : 'hover:text-white hover:bg-white/10'}`} title="Preview Mode"><Eye size={18}/></button>
               <button onClick={() => setShowRewriteModal(true)} disabled={!selectionRange} className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30" title="Rewrite Selection"><PenLine size={18}/></button>
               <div className="w-px h-4 bg-white/10 mx-1" />
               <button onClick={() => handleExport('pdf')} disabled={isExporting} className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Export PDF"><Download size={18}/></button>
               <button onClick={() => setIsFocusMode(true)} className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Focus Mode"><Maximize2 size={18}/></button>
           </div>
        )}

        {isFocusMode && (
            <button onClick={() => setIsFocusMode(false)} className="fixed top-6 right-6 z-50 p-3 bg-black/10 hover:bg-black/20 text-stone-400 hover:text-stone-900 rounded-full backdrop-blur-md transition-colors">
                <Minimize2 size={20} />
            </button>
        )}
        
        {/* Writing Surface */}
        <div className={`flex-1 overflow-y-auto transition-all duration-500 ${isFocusMode ? 'bg-ivory dark:bg-stone-950' : ''}`}>
             <div className="max-w-3xl mx-auto px-8 py-24 min-h-full">
                <h1 className="font-serif text-4xl font-bold text-stone-900 dark:text-white mb-8 text-center">{activeChapter.title}</h1>
                
                {(!activeChapter.content || activeChapter.content.length < 20) ? (
                     <div className="flex flex-col items-center justify-center py-20 opacity-50 hover:opacity-100 transition-opacity">
                        <p className="text-stone-500 dark:text-stone-400 italic mb-6">The page is blank. Let the AI begin the story.</p>
                        <button onClick={generateContent} disabled={isGenerating} className="px-6 py-3 bg-stone-200 dark:bg-stone-800 hover:bg-saffron-500 hover:text-white dark:hover:bg-saffron-500 text-stone-600 dark:text-stone-300 rounded-full font-bold transition-all flex items-center gap-2">
                             {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                             Generate Content
                        </button>
                     </div>
                ) : isPreview ? (
                    <div className="prose prose-lg prose-stone dark:prose-invert max-w-none font-serif leading-loose" dangerouslySetInnerHTML={{ __html: markdownService.parse(activeChapter.content) }} />
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={activeChapter.content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        onSelect={handleSelect}
                        className="w-full h-[calc(100vh-20rem)] resize-none bg-transparent outline-none font-serif text-lg md:text-xl leading-loose text-stone-800 dark:text-stone-200 placeholder:text-stone-300"
                        placeholder="Start writing..."
                        spellCheck={false}
                    />
                )}
             </div>
        </div>
      </main>
    </div>
  );
};