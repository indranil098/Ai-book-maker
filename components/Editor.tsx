
import React, { useState, useRef, useEffect } from 'react';
import { Book as BookType, Chapter } from '../types';
import { geminiService } from '../services/geminiService';
import { epubService } from '../services/epubService';
import { pdfService } from '../services/pdfService';
import { markdownService } from '../services/markdownService';
import { Eye, Download, PenLine, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Wand2, Loader2, Library, ChevronLeft, Menu } from 'lucide-react';
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
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 1024);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-hide sidebar on mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setShowSidebar(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const content = await geminiService.generateChapterContent(book.title, activeChapter, book.style, book.perspective, prevChapterSummary);
      handleContentChange(content);
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
    setIsRewriting(true);
    try {
      const rewrittenText = await geminiService.rewriteText(textToRewrite, rewriteInstruction, book.title);
      const before = activeChapter.content.substring(0, selectionRange.start);
      const after = activeChapter.content.substring(selectionRange.end);
      handleContentChange(before + rewrittenText + after);
      setShowRewriteModal(false);
      setSelectionRange(null);
    } catch (error) {
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
    } finally { setIsExporting(false); }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
            <button onClick={onViewLibrary} className="flex items-center gap-2 text-[10px] font-bold text-stone-400 hover:text-stone-900 uppercase tracking-widest mb-3">
                <ChevronLeft size={14} /> Library
            </button>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white truncate">{book.title}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{book.chapters.length} Chapters</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {book.chapters.map((chapter, idx) => (
                <button
                    key={chapter.id}
                    onClick={() => {
                        setActiveChapterIndex(idx);
                        if (window.innerWidth < 1024) setShowSidebar(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${activeChapterIndex === idx ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white font-bold' : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/50'}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-stone-300">{(idx+1).toString().padStart(2, '0')}</span>
                        <span className="truncate flex-1">{chapter.title}</span>
                    </div>
                </button>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] md:h-[calc(100vh-7rem)] overflow-hidden relative bg-ivory dark:bg-stone-950">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
            <motion.div 
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                className="fixed inset-y-0 left-0 z-[60] w-[85%] max-w-sm shadow-2xl lg:relative lg:inset-auto lg:z-0 lg:w-80 lg:shadow-none"
            >
                {sidebarContent}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {showSidebar && window.innerWidth < 1024 && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowSidebar(false)}
                className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm lg:hidden"
            />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Responsive Toolbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-3 md:p-4 bg-ivory/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
                <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg lg:hidden">
                    <Menu size={18} />
                </button>
                <div className="hidden lg:flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-1.5 hover:bg-white dark:hover:bg-stone-700 rounded transition-colors">
                        {showSidebar ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16} />}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
                <button onClick={() => setIsPreview(!isPreview)} className={`p-2 rounded-lg ${isPreview ? 'bg-saffron-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                    <Eye size={18} />
                </button>
                <button onClick={() => setShowRewriteModal(true)} disabled={!selectionRange} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg disabled:opacity-30">
                    <PenLine size={18} />
                </button>
                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-1" />
                <button onClick={() => handleExport('pdf')} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                    <Download size={18} />
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 md:px-12 py-10 md:py-20">
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 dark:text-white mb-6 text-center">{activeChapter.title}</h1>
                
                {!activeChapter.content ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-stone-400 italic mb-6">The page is blank.</p>
                        <button onClick={generateContent} disabled={isGenerating} className="px-8 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full font-bold flex items-center gap-2 shadow-xl">
                            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                            Begin Writing
                        </button>
                    </div>
                ) : isPreview ? (
                    <div className="prose prose-stone dark:prose-invert prose-base md:prose-lg max-w-none font-serif leading-relaxed md:leading-loose" dangerouslySetInnerHTML={{ __html: markdownService.parse(activeChapter.content) }} />
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={activeChapter.content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        onSelect={handleSelect}
                        className="w-full h-screen resize-none bg-transparent outline-none font-serif text-lg md:text-xl leading-relaxed md:leading-loose text-stone-800 dark:text-stone-200"
                        placeholder="Start your story..."
                        spellCheck={false}
                    />
                )}
            </div>
        </div>
      </main>

      {/* Rewrite Modal */}
      <AnimatePresence>
        {showRewriteModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-stone-900/30 backdrop-blur-sm p-0 md:p-4">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white dark:bg-stone-900 w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl border-t md:border border-stone-100 dark:border-stone-800">
                <h3 className="font-serif font-bold text-xl mb-4 text-stone-900 dark:text-white">AI Edit</h3>
                <textarea value={rewriteInstruction} onChange={e => setRewriteInstruction(e.target.value)} className="w-full h-32 p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl mb-4 outline-none text-stone-900 dark:text-white" placeholder="Rewrite instruction..." />
                <div className="flex gap-2">
                    <button onClick={() => setShowRewriteModal(false)} className="flex-1 py-4 font-bold text-stone-400">Cancel</button>
                    <button onClick={handleRewrite} className="flex-1 py-4 bg-saffron-500 text-white font-bold rounded-2xl shadow-lg">Apply</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
