import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-saffron-400/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white/70 dark:bg-stone-900/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/40 dark:border-stone-800 overflow-hidden"
      >
        <div className="p-10 md:p-16 text-center">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="w-20 h-20 bg-stone-900 dark:bg-white rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-500"
          >
             <img 
                src="https://github.com/indranil122/image/blob/main/ChatGPT%20Image%20Dec%204,%202025,%2012_50_02%20AM-Photoroom.png?raw=true" 
                alt="Logo" 
                className="w-12 h-12 object-contain invert dark:invert-0" 
            />
          </motion.div>

          <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 dark:text-white mb-4 leading-tight">
            The Studio Awaits
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-lg mb-10 max-w-sm mx-auto leading-relaxed">
            Your creative legacy begins here. Sign in with your Google account to access your library and start writing.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-lg rounded-2xl transition-all mb-6 flex items-center justify-center gap-4 shadow-xl hover:shadow-saffron-500/20 active:scale-95 group relative overflow-hidden"
          >
            {loading ? (
               <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                <span>Continue with Google</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {error && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/10 p-4 rounded-xl"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <div className="mt-12 pt-8 border-t border-stone-100 dark:border-stone-800">
             <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-mono uppercase tracking-widest">
                <Sparkles size={14} className="text-saffron-500" />
                Neural Prose v3.0 Powered
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
