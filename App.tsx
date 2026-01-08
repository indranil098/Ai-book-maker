import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { Landing } from './components/Landing';
import { BookWizard } from './components/BookWizard';
import { Editor } from './components/Editor';
import { Reader } from './components/Reader';
import { Library } from './components/Library';
import { Auth } from './components/Auth';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { ViewState, Book, User } from './types';
import { authService } from './services/authService';
import { databaseService } from './services/databaseService';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<ViewState>(ViewState.LANDING);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth Session
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Load books from cloud
        const cloudBooks = await databaseService.getBooks(currentUser.id);
        setBooks(cloudBooks);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const handleAuthSuccess = async (u: User) => {
    setUser(u);
    setView(ViewState.LIBRARY);
    const cloudBooks = await databaseService.getBooks(u.id);
    setBooks(cloudBooks);
  };

  const handleBookCreated = async (book: Book) => {
    if (user) {
      await databaseService.saveBook(user.id, book);
    }
    setBooks(prev => [...prev, book]);
    setActiveBookId(book.id);
    setView(ViewState.EDITOR);
  };

  const handleBookUpdate = async (updatedBook: Book) => {
    if (user) {
      await databaseService.updateBook(user.id, updatedBook.id, updatedBook);
    }
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
  };
  
  const handleSelectBook = (bookId: string, targetView: ViewState.EDITOR | ViewState.READER) => {
    setActiveBookId(bookId);
    setView(targetView);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (user) {
      await databaseService.deleteBook(user.id, bookId);
    }
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (activeBookId === bookId) setActiveBookId(null);
  };

  const activeBook = books.find(b => b.id === activeBookId);

  const renderView = () => {
    if (!user && (currentView === ViewState.WIZARD || currentView === ViewState.LIBRARY || currentView === ViewState.EDITOR)) {
       return <Auth onAuthSuccess={handleAuthSuccess} />;
    }

    switch (currentView) {
      case ViewState.LANDING:
        return <Landing onStart={() => setView(user ? ViewState.WIZARD : ViewState.LOGIN)} onNavigate={(v) => setView(v)} />;
      case ViewState.LOGIN:
      case ViewState.SIGNUP:
        return <Auth onAuthSuccess={handleAuthSuccess} />;
      case ViewState.WIZARD:
        return <BookWizard onBookCreated={handleBookCreated} />;
      case ViewState.LIBRARY:
        return <Library books={books} onSelectBook={handleSelectBook} onDeleteBook={handleDeleteBook} onCreateNew={() => setView(ViewState.WIZARD)} />;
      case ViewState.EDITOR:
        return activeBook ? <Editor book={activeBook} onUpdateBook={handleBookUpdate} onViewLibrary={() => setView(ViewState.LIBRARY)} /> : <div className="p-12 text-center text-stone-500">No book selected.</div>;
      case ViewState.READER:
        return activeBook ? <Reader book={activeBook} /> : <div className="p-12 text-center text-stone-500">No book selected.</div>;
      case ViewState.PRIVACY:
        return <PrivacyPolicy onBack={() => setView(ViewState.LANDING)} />;
      case ViewState.TERMS:
        return <TermsOfService onBack={() => setView(ViewState.LANDING)} />;
      default:
        return <Landing onStart={() => setView(ViewState.WIZARD)} onNavigate={(v) => setView(v)} />;
    }
  };

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-ivory dark:bg-stone-950 font-serif text-stone-400">Restoring Studio...</div>;

  return (
    <AppShell currentView={currentView} setView={setView}>
      <AnimatePresence mode="wait">
        <motion.div key={currentView} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full">
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
};

export default App;
