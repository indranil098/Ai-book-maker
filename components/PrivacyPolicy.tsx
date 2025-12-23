
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Server, ChevronLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
      <motion.button 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white mb-12 transition-colors font-bold uppercase tracking-widest text-xs"
      >
        <ChevronLeft size={16} /> Back to Studio
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="prose prose-stone dark:prose-invert max-w-none"
      >
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-saffron-500/10 rounded-2xl flex items-center justify-center text-saffron-600">
                <Shield size={24} />
            </div>
            <h1 className="font-serif text-5xl font-bold mb-0">Privacy Policy</h1>
        </div>

        <p className="lead text-xl text-stone-500 mb-12">
          Your creative output is personal. This policy outlines how Novelia AI handles your data in our decentralized book-building environment.
        </p>

        <section className="mb-12">
          <h2 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Server className="text-stone-400" size={24} /> 1. Data Sovereignty
          </h2>
          <p>
            Unlike traditional platforms, <strong>Novelia AI does not store your book content on central servers</strong>. All your stories, characters, and outlines are stored locally within your browser's persistent storage (IndexedDB/LocalStorage).
          </p>
          <p>
            This means you have full control. If you clear your browser data or use a different device without exporting your work, your books will not be accessible. We recommend using our <strong>Export</strong> feature frequently.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Eye className="text-stone-400" size={24} /> 2. AI & Data Processing
          </h2>
          <p>
            When you generate content, we transmit your prompts to the <strong>Google Gemini API</strong>. This data is used solely to provide the creative assistance you request. 
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not use your generated stories to train our models.</li>
            <li>We do not share your book metadata with third-party advertisers.</li>
            <li>Content generation is subject to Google's Privacy Policy.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-3xl font-bold flex items-center gap-3">
            <Lock className="text-stone-400" size={24} /> 3. Security
          </h2>
          <p>
            Because your data lives in your browser, its security depends on your device's security. We use standard web encryption protocols for all API communications.
          </p>
        </section>

        <footer className="pt-12 border-t border-stone-200 dark:border-stone-800 text-stone-400 text-sm italic">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </footer>
      </motion.div>
    </div>
  );
};
