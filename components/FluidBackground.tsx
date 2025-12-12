import React, { useEffect, useRef } from 'react';

const FluidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;

    // --- LIGHT MODE CONFIG (Watercolor/Pastel) ---
    const config = {
      orbCount: 8,
      minSize: 300,
      maxSize: 700,
      speed: 0.25,
      colors: [
        { r: 167, g: 139, b: 250 }, // Soft Violet
        { r: 96, g: 165, b: 250 },  // Sky Blue
        { r: 244, g: 114, b: 182 }, // Rose Pink
        { r: 45, g: 212, b: 191 },  // Teal/Cyan
        { r: 251, g: 146, b: 60 },  // Orange/Peach pop
        { r: 192, g: 132, b: 252 }  // Lavender
      ]
    };

    // --- ORB CLASS ---
    class Orb {
      x: number;
      y: number;
      radius: number;
      angle: number; 
      t: number;
      rgb: { r: number, g: number, b: number };
      currentRadius: number;

      constructor() {
        this.radius = Math.random() * (config.maxSize - config.minSize) + config.minSize;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        
        // Random starting angle for organic movement
        this.angle = Math.random() * Math.PI * 2;

        this.t = Math.random() * Math.PI * 2;
        this.rgb = config.colors[Math.floor(Math.random() * config.colors.length)];
        this.currentRadius = this.radius;
      }

      update() {
        // Organic Wandering Logic
        // Slowly change angle for curved paths
        this.angle += (Math.random() - 0.5) * 0.05;
        
        const vx = Math.cos(this.angle) * config.speed;
        const vy = Math.sin(this.angle) * config.speed;

        this.x += vx;
        this.y += vy;

        // Soft Boundary Check (Wrap around/Turn back)
        const margin = 200;
        if (this.x < -margin) { 
          this.x = -margin; 
          this.angle = 0 + (Math.random() - 0.5); 
        }
        if (this.x > width + margin) { 
          this.x = width + margin; 
          this.angle = Math.PI + (Math.random() - 0.5); 
        }
        if (this.y < -margin) { 
          this.y = -margin; 
          this.angle = Math.PI/2 + (Math.random() - 0.5); 
        }
        if (this.y > height + margin) { 
          this.y = height + margin; 
          this.angle = -Math.PI/2 + (Math.random() - 0.5); 
        }

        // Gentle Breathing
        this.t += 0.005;
        this.currentRadius = this.radius + Math.sin(this.t) * (this.radius * 0.1);
      }

      draw() {
        if (!ctx) return;

        // Light Mode: Multiply Blend (Watercolor effect)
        ctx.globalCompositeOperation = 'multiply';

        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.currentRadius
        );
        
        // Soft opacity
        let alpha = 0.5;

        gradient.addColorStop(0, `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`); // Fade to white (transparent in multiply)

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let orbs: Orb[] = [];

    const initOrbs = () => {
      orbs = [];
      for (let i = 0; i < config.orbCount; i++) {
        orbs.push(new Orb());
      }
    };

    const animate = () => {
      // Clear canvas (rely on white background CSS)
      ctx.clearRect(0, 0, width, height); 

      orbs.forEach(orb => {
        orb.update();
        orb.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initOrbs();
    };

    window.addEventListener('resize', handleResize);

    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // SVG Data URI for Noise (Light Mode)
  const noiseImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none bg-white">
       <style>{`
        @keyframes noiseShift {
            0% { transform: translate(0, 0); }
            100% { transform: translate(1%, 1%); }
        }
      `}</style>

      <canvas
        ref={canvasRef}
        id="canvas-container"
        className="absolute top-0 left-0 w-full h-full"
        style={{
          filter: 'blur(80px) saturate(180%) contrast(120%)',
          transform: 'scale(1.2)',
          opacity: 1
        }}
      />
      
      {/* Light Mode Specific Overlays */}
      <div 
          className="noise-overlay"
          style={{
              position: 'fixed',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              pointerEvents: 'none',
              zIndex: 20,
              backgroundImage: noiseImage,
              animation: 'noiseShift 0.5s infinite linear',
              mixBlendMode: 'multiply'
          }}
      />
      <div
          className="vignette"
          style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.7) 100%)'
          }}
      />
    </div>
  );
};

export default FluidBackground;