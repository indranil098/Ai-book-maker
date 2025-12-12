
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { Landing } from './components/Landing';
import { BookWizard } from './components/BookWizard';
import { Editor } from './components/Editor';
import { Reader } from './components/Reader';
import { Library } from './components/Library';
import { ViewState, Book } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, BookOpen } from 'lucide-react';

const IntroSplash: React.FC = () => {
  return (
    <motion.div
      key="intro-splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FDFCF8] dark:bg-[#0c0a09]"
    >
        {/* Background Gradients for Splash */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    rotate: [0, 90, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-500/10 rounded-full blur-[100px]" 
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2],
                    rotate: [0, -60, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-500/10 rounded-full blur-[100px]" 
            />
        </div>

        <div className="relative z-10 flex flex-col items-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 1, type: "spring", bounce: 0.5 }}
                className="w-24 h-24 mb-8 rounded-2xl bg-stone-900 dark:bg-white shadow-2xl flex items-center justify-center"
            >
                <BookOpen size={48} className="text-white dark:text-stone-900" />
            </motion.div>

            <div className="overflow-hidden">
                <motion.h1
                    initial={{ y: 50, opacity: 0, filter: "blur(10px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="font-serif text-5xl md:text-7xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-4 text-center"
                >
                    Novelia AI
                    <span className="text-saffron-500">.</span>
                </motion.h1>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="flex items-center gap-2 text-stone-500 dark:text-stone-400 font-mono text-xs uppercase tracking-[0.3em]"
            >
                <Sparkles size={12} className="text-saffron-500" />
                <span>The Unwritten Awaits</span>
                <Sparkles size={12} className="text-saffron-500" />
            </motion.div>
        </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.LANDING);
  const [showIntro, setShowIntro] = useState(true);
  
  // State management for multiple books
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  useEffect(() => {
    // Intro timer
    const timer = setTimeout(() => {
        setShowIntro(false);
    }, 2800); // Intro duration
    return () => clearTimeout(timer);
  }, []);

  // Load books from localStorage on initial render
  useEffect(() => {
    try {
      const savedBooks = localStorage.getItem('novelia-books');
      if (savedBooks) {
        // Parse and revive dates
        const parsedBooks = JSON.parse(savedBooks).map((book: any) => ({
            ...book,
            createdAt: new Date(book.createdAt)
        }));
        setBooks(parsedBooks);
      }
    } catch (error) {
        console.error("Failed to load books from localStorage", error);
        setBooks([]);
    }
  }, []);

  // Save books to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('novelia-books', JSON.stringify(books));
    } catch (error) {
      console.error("Failed to save books to localStorage", error);
    }
  }, [books]);

  // Enforce light mode cleanup on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('novelia-theme', 'light');
  }, []);

  const handleStart = () => {
    setView(ViewState.WIZARD);
  };

  const handleBookCreated = (book: Book) => {
    setBooks(prev => [...prev, book]);
    setActiveBookId(book.id);
    setView(ViewState.EDITOR);
  };

  const handleBookUpdate = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
  };
  
  const handleSelectBook = (bookId: string, targetView: ViewState.EDITOR | ViewState.READER) => {
    setActiveBookId(bookId);
    setView(targetView);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (activeBookId === bookId) {
      setActiveBookId(null);
    }
  };

  const activeBook = books.find(b => b.id === activeBookId);

  const renderView = () => {
    switch (currentView) {
      case ViewState.LANDING:
        return <Landing onStart={handleStart} />;
      case ViewState.WIZARD:
        return <BookWizard onBookCreated={handleBookCreated} />;
      case ViewState.LIBRARY:
        return <Library books={books} onSelectBook={handleSelectBook} onDeleteBook={handleDeleteBook} onCreateNew={handleStart} />;
      case ViewState.EDITOR:
        return activeBook 
          ? <Editor 
              book={activeBook} 
              onUpdateBook={handleBookUpdate} 
              onViewLibrary={() => setView(ViewState.LIBRARY)} 
            /> 
          : <div className="p-12 text-center text-stone-500 font-serif italic">No book selected. Please go to your library.</div>;
      case ViewState.READER:
        return activeBook 
          ? <Reader book={activeBook} /> 
          : <div className="p-12 text-center text-stone-500 font-serif italic">No book selected to read.</div>;
      default:
        return <Landing onStart={handleStart} />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && <IntroSplash />}
      </AnimatePresence>
      
      <AppShell 
        currentView={currentView} 
        setView={setView} 
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </>
  );
};

export default App;
