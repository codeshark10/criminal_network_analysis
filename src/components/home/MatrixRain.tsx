import React, { useEffect, useRef } from 'react';

const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const cols = Math.floor(w / 20) + 1;
    const ypos = Array(cols).fill(0).map(() => Math.random() * h);

    // Initial fill
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, w, h);

    const draw = () => {
      // Fade out previous frames
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, w, h);

      // Gold/accent color matching the theme
      ctx.fillStyle = 'rgba(201, 184, 106, 0.4)';
      ctx.font = '14px "Space Mono", monospace';

      for (let i = 0; i < cols; i++) {
        // Random 0 or 1
        const text = Math.random() > 0.5 ? '1' : '0';
        const x = i * 20;
        const y = ypos[i];
        
        ctx.fillText(text, x, y);
        
        // Reset randomly to top
        if (y > h && Math.random() > 0.95) {
          ypos[i] = 0;
        } else {
          ypos[i] = y + 20;
        }
      }
    };

    const interval = setInterval(draw, 50);

    const handleResize = () => {
      if (!canvas) return;
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      const newCols = Math.floor(w / 20) + 1;
      if (newCols > ypos.length) {
        ypos.push(...Array(newCols - ypos.length).fill(0));
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1, // Will sit under main content which has zIndex: 5+
        pointerEvents: 'none',
        opacity: 0.8, // Adjust as needed, the drawing uses 0.4 fillStyle opacity
      }}
    />
  );
};

export default MatrixRain;
