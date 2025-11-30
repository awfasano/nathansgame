import React, { useEffect, useRef } from 'react';

const Explosion: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
      type: 'fire' | 'smoke' | 'spark' | 'shockwave' | 'ember' | 'debris';
    }

    let particles: Particle[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 50;

    const createExplosion = () => {
      // Initial fireball core
      for (let i = 0; i < 150; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          life: 0,
          maxLife: 50 + Math.random() * 40,
          size: 25 + Math.random() * 40,
          color: '',
          type: 'fire'
        });
      }

      // Mushroom stem smoke
      for (let i = 0; i < 200; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * 60,
          y: cy,
          vx: (Math.random() - 0.5) * 3,
          vy: -4 - Math.random() * 7,
          life: 0,
          maxLife: 180 + Math.random() * 60,
          size: 20 + Math.random() * 35,
          color: '',
          type: 'smoke'
        });
      }

      // Shockwave
      particles.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 80,
        size: 0,
        color: 'white',
        type: 'shockwave'
      });

      // Sparks
      for (let i = 0; i < 300; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 20;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 60 + Math.random() * 40,
          size: 2 + Math.random() * 4,
          color: '#ffaa00',
          type: 'spark'
        });
      }

      // Embers (floating hot particles)
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x: cx + (Math.random() - 0.5) * 100,
          y: cy + (Math.random() - 0.5) * 100,
          vx: Math.cos(angle) * speed,
          vy: -1 - Math.random() * 3,
          life: 0,
          maxLife: 200 + Math.random() * 100,
          size: 3 + Math.random() * 5,
          color: '#ff6600',
          type: 'ember'
        });
      }

      // Debris
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 15;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          life: 0,
          maxLife: 100,
          size: 4 + Math.random() * 8,
          color: '#333',
          type: 'debris'
        });
      }
    };

    createExplosion();

    let startTime = Date.now();
    let animFrameId: number;
    
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const elapsed = Date.now() - startTime;
      
      // Flash effect
      if (elapsed < 150) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (elapsed < 800) {
        const flashAlpha = Math.max(0, 1 - ((elapsed - 150) / 650));
        ctx.fillStyle = `rgba(255, 200, 100, ${flashAlpha * 0.5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Sort by type for layering
      particles.sort((a, b) => {
        const order: { [key: string]: number } = { smoke: 0, fire: 1, ember: 2, debris: 3, spark: 4, shockwave: 5 };
        return (order[a.type] || 0) - (order[b.type] || 0);
      });

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // Physics by type
        switch (p.type) {
          case 'fire':
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.vy -= 0.08;
            p.size *= 0.97;
            break;
          case 'smoke':
            p.vx *= 0.97;
            p.vy *= 0.96;
            p.size += 0.3;
            break;
          case 'spark':
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.vy += 0.15;
            break;
          case 'ember':
            p.vx += (Math.random() - 0.5) * 0.3;
            p.vy *= 0.99;
            break;
          case 'debris':
            p.vy += 0.3;
            p.vx *= 0.98;
            break;
        }

        const lifeRatio = p.life / p.maxLife;

        if (lifeRatio >= 1) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();

        switch (p.type) {
          case 'fire': {
            const alpha = Math.max(0, 1 - lifeRatio);
            let color = '';
            if (lifeRatio < 0.1) color = `rgba(255, 255, 255, ${alpha})`;
            else if (lifeRatio < 0.25) color = `rgba(255, 255, 100, ${alpha})`;
            else if (lifeRatio < 0.5) color = `rgba(255, 150, 0, ${alpha})`;
            else if (lifeRatio < 0.75) color = `rgba(200, 50, 0, ${alpha})`;
            else color = `rgba(80, 40, 40, ${alpha * 0.5})`;
            
            ctx.fillStyle = color;
            ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'smoke': {
            const alpha = Math.max(0, (1 - lifeRatio) * 0.35);
            const grey = 20 + lifeRatio * 30;
            ctx.fillStyle = `rgba(${grey}, ${grey}, ${grey}, ${alpha})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'spark': {
            const alpha = 1 - lifeRatio;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 150, 50, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
            ctx.fillStyle = gradient;
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'ember': {
            const alpha = (1 - lifeRatio) * (0.5 + Math.sin(p.life * 0.3) * 0.3);
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
            ctx.fillStyle = gradient;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'debris': {
            const alpha = 1 - lifeRatio;
            ctx.fillStyle = `rgba(60, 50, 40, ${alpha})`;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            break;
          }
          case 'shockwave': {
            p.size += 30;
            const alpha = Math.max(0, 1 - (p.size / (canvas.width * 1.2)));
            ctx.strokeStyle = `rgba(255, 200, 150, ${alpha})`;
            ctx.lineWidth = 60 * alpha;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.stroke();
            break;
          }
        }
      }

      // Add mushroom cap particles
      if (elapsed < 2500 && elapsed % 8 === 0) {
        const riseHeight = Math.min(elapsed / 4, 350);
        for (let j = 0; j < 3; j++) {
          particles.push({
            x: cx + (Math.random() - 0.5) * 80,
            y: cy - riseHeight + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 4,
            vy: -0.5 - Math.random(),
            life: 0,
            maxLife: 200,
            size: 35 + Math.random() * 25,
            color: '',
            type: 'smoke'
          });
        }
      }

      if (particles.length > 0) {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default Explosion;
