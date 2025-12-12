
import React, { useState } from 'react';
import { Menu, X, Edit3, Library, Sparkles } from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import FluidBackground from './FluidBackground';

interface AppShellProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentView, setView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-900 selection:bg-saffron-400/30 transition-colors duration-500">
      
      <FluidBackground />

      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
        <motion.header 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="pointer-events-auto w-full max-w-5xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-stone-900/5 rounded-full px-2 py-2 grid grid-cols-[1fr_auto_1fr] items-center"
        >
            {/* Logo Section - Left Aligned */}
            <div 
                className="flex items-center gap-3 cursor-pointer pl-4 justify-self-start"
                onClick={() => handleNavClick(ViewState.LANDING)}
            >
                <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm opacity-90">
                <img 
                    src="https://github.com/indranil122/image/blob/main/ChatGPT%20Image%20Dec%204,%202025,%2012_50_02%20AM-Photoroom.png?raw=true" 
                    alt="Novelia AI Logo" 
                    className="w-full h-full object-contain" 
                />
                </div>
                <span className="font-serif font-bold text-xl tracking-tight text-stone-900 hidden sm:block">
                Novelia<span className="text-saffron-500">.</span>
                </span>
            </div>

            {/* Desktop Nav Pills - Center Aligned */}
            <nav className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-sm border border-white/10 p-1.5 rounded-full shadow-sm justify-self-center">
                {[
                { id: ViewState.WIZARD, label: 'Create', icon: Sparkles },
                { id: ViewState.LIBRARY, label: 'Library', icon: Library },
                ].map((item) => (
                <button 
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`
                    relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                    ${currentView === item.id 
                        ? 'text-stone-900 shadow-sm font-bold' 
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/20'}
                    `}
                >
                    {currentView === item.id && (
                    <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white/40 shadow-sm rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    )}
                    <item.icon size={14} className={currentView === item.id ? "text-saffron-600" : ""} />
                    {item.label}
                </button>
                ))}
            </nav>

            {/* Right Actions - Right Aligned */}
            <div className="flex items-center justify-self-end pr-2 gap-2">
                {/* Mobile Menu Toggle */}
                <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-3 text-stone-900 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors"
                >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>
        </motion.header>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-24 z-40 bg-white/80 backdrop-blur-xl rounded-3xl p-4 md:hidden border border-white/20 shadow-2xl origin-top"
          >
             <nav className="flex flex-col gap-2">
                <button onClick={() => handleNavClick(ViewState.WIZARD)} className="flex items-center gap-4 p-4 hover:bg-white/50 rounded-2xl transition-colors">
                  <div className="w-10 h-10 bg-saffron-100/50 text-saffron-600 rounded-xl flex items-center justify-center">
                    <Edit3 size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-stone-900">Create New Book</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleNavClick(ViewState.LIBRARY)} 
                  className="flex items-center gap-4 p-4 hover:bg-white/50 rounded-2xl transition-colors"
                >
                    <div className="w-10 h-10 bg-stone-100/50 text-stone-600 rounded-xl flex items-center justify-center">
                        <Library size={20} />
                    </div>
                   <span className="font-bold text-stone-900">My Library</span>
                </button>
             </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Spacer for Floating Header - Hidden on Landing to avoid gap */}
      {currentView !== ViewState.LANDING && <div className="h-28"></div>}

      {/* Main Content */}
      <main className="flex-grow relative w-full max-w-[1920px] mx-auto transition-opacity duration-300">
        {children}
      </main>
    </div>
  );
};
