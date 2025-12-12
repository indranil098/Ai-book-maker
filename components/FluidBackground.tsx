import React from 'react';

const FluidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[#FDFCF8] dark:bg-[#0c0a09] transition-colors duration-500">
      
      {/* Abstract blurred gradients using CSS - GPU Accelerated */}
      {/* HIDDEN ON MOBILE to prevent "moving particles" */}
      <div className="hidden md:block">
          <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[100px] animate-float-slow mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-saffron-200/30 dark:bg-saffron-900/10 rounded-full blur-[100px] animate-float-delayed mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute top-[40%] left-[30%] w-[60vw] h-[60vw] bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-[120px] animate-float-reverse mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Noise Texture for Texture/Grit */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-float-slow {
          animation: float 20s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 25s ease-in-out infinite reverse;
        }
        .animate-float-reverse {
          animation: float 30s ease-in-out infinite 5s;
        }
      `}</style>
    </div>
  );
};

export default FluidBackground;