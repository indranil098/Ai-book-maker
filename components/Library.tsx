import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book as BookModel, ViewState } from '../types';
import { Plus, BookOpen, Edit3, Trash2, AlertTriangle, Sparkles, Book } from 'lucide-react';

interface LibraryProps {
  books: BookModel[];
  onSelectBook: (bookId: string, view: ViewState.EDITOR | ViewState.READER) => void;
  onDeleteBook: (bookId: string) => void;
  onCreateNew: () => void;
}

const BookCard: React.FC<{ book: BookModel, onSelect: (view: ViewState.EDITOR | ViewState.READER) => void, onDelete: () => void, delay: number }> = ({ book, onSelect, onDelete, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: delay * 0.05, type: "spring", stiffness: 100 }}
      className="group relative w-full"
    >
      <div className="relative aspect-[2/3] mb-5 perspective-1000 w-full">
        <motion.div
           whileHover={{ y: -10, rotateX: 5, rotateY: 5, scale: 1.02 }}
           transition={{ type: "spring", stiffness: 400, damping: 30 }}
           className="w-full h-full rounded-lg overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:shadow-saffron-500/20 transition-all duration-500 bg-stone-800 relative z-10 cursor-pointer"
           onClick={() => onSelect(ViewState.READER)}
        >
            {book.coverImage ? (
                <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-800 p-4 text-center">
                    <Book className="w-12 h-12 text-stone-300 mb-2" />
                    <span className="text-xs text-stone-400 font-serif">{book.title}</span>
                </div>
            )}
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                 <button className="w-full py-2 bg-white text-stone-900 font-bold text-sm rounded-lg shadow-lg">Read Now</button>
            </div>
        </motion.div>
        
        {/* Decorative elements behind */}
        <div className="absolute top-2 left-2 w-full h-full border border-stone-200 dark:border-stone-700 rounded-lg -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500" />
      </div>

      <div className="space-y-1">
        <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 leading-tight truncate cursor-pointer hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors" onClick={() => onSelect(ViewState.READER)}>
            {book.title}
        </h3>
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">by {book.author}</p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
         <button onClick={() => onSelect(ViewState.EDITOR)} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
            <Edit3 size={12} /> Edit
         </button>
         <span className="text-stone-300">|</span>
         <button onClick={onDelete} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-red-500 transition-colors">
            <Trash2 size={12} /> Delete
         </button>
      </div>
    </motion.div>
  );
};

export const Library: React.FC<LibraryProps> = ({ books, onSelectBook, onDeleteBook, onCreateNew }) => {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleDelete = (bookId: string) => {
        onDeleteBook(bookId);
        setConfirmDeleteId(null);
    }
    
    return (
        <div className="min-h-[80vh] px-4 md:px-8 lg:px-12 pb-20 w-full">
            <AnimatePresence>
                {confirmDeleteId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center border border-stone-100 dark:border-stone-800">
                           <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6 shadow-sm">
                              <AlertTriangle size={28} />
                           </div>
                           <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-white mb-3">Delete this book?</h3>
                           <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
                             "{books.find(b=>b.id === confirmDeleteId)?.title}" will be lost forever. Like a story never told.
                           </p>
                           <div className="flex gap-3">
                               <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">Keep It</button>
                               <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all">Delete</button>
                           </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                    <div>
                        <motion.h1 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="font-serif text-5xl md:text-7xl font-bold text-stone-900 dark:text-white mb-4 tracking-tight"
                        >
                          Library
                        </motion.h1>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-3 text-stone-500 dark:text-stone-400"
                        >
                           <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-bold uppercase tracking-wider">{books.length} Books</span>
                           <span className="h-1 w-1 rounded-full bg-stone-300 dark:bg-stone-700" />
                           <span className="text-sm">Your personal collection</span>
                        </motion.div>
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onCreateNew} 
                      className="group relative px-8 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full font-bold text-lg shadow-xl shadow-stone-900/10 hover:shadow-2xl transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-saffron-500/0 group-hover:bg-saffron-500/10 transition-colors" />
                        <span className="relative flex items-center gap-3">
                           <Sparkles size={20} className="text-saffron-500 group-hover:rotate-12 transition-transform" /> 
                           Create New
                        </span>
                    </motion.button>
                </div>

                {books.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-8 gap-y-16 w-full">
                        <AnimatePresence>
                        {books.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((book, index) => (
                            <BookCard 
                                key={book.id} 
                                book={book}
                                onSelect={(view) => onSelectBook(book.id, view)}
                                onDelete={() => setConfirmDeleteId(book.id)}
                                delay={index}
                            />
                        ))}
                        </AnimatePresence>
                        
                        {/* Add New Ghost Card */}
                        <motion.div
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             transition={{ delay: 0.5 }}
                             onClick={onCreateNew}
                             className="aspect-[2/3] w-full rounded-lg border-2 border-dashed border-stone-200 dark:border-stone-800 hover:border-saffron-400 dark:hover:border-saffron-500 group cursor-pointer flex flex-col items-center justify-center gap-4 transition-colors mb-5"
                        >
                             <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-900 group-hover:bg-saffron-50 dark:group-hover:bg-saffron-900/20 flex items-center justify-center transition-colors">
                                <Plus size={24} className="text-stone-400 group-hover:text-saffron-500 transition-colors" />
                             </div>
                             <span className="font-serif font-bold text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">Write Another</span>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 text-center"
                    >
                        <div className="w-24 h-24 bg-gradient-to-tr from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 rounded-full flex items-center justify-center mb-8 shadow-inner">
                            <BookOpen size={40} className="text-stone-400" />
                        </div>
                        <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white mb-3">Your library awaits</h2>
                        <p className="text-stone-500 dark:text-stone-400 max-w-md mb-8 leading-relaxed">
                            The shelves are empty, but your imagination is full. Let's start writing your first masterpiece.
                        </p>
                        <button onClick={onCreateNew} className="px-8 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full font-bold hover:bg-saffron-500 dark:hover:bg-saffron-400 transition-colors shadow-lg">
                           Start Writing
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};