import { useEffect, useRef } from 'react';

export default function Starfield() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let frame;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 0.35 + 0.08,
      opacity: Math.random() * 0.55 + 0.2,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const onMouseMove = (event) => {
      mouseRef.current = {
        x: (event.clientX / width - 0.5) * 18,
        y: (event.clientY / height - 0.5) * 18,
      };
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#050810');
      gradient.addColorStop(0.5, '#08101f');
      gradient.addColorStop(1, '#050810');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = 'rgba(0, 245, 255, 0.06)';
      context.lineWidth = 1;
      for (let x = -80; x < width + 80; x += 64) {
        context.beginPath();
        context.moveTo(x + mouseRef.current.x, 0);
        context.lineTo(x - 120 + mouseRef.current.x, height);
        context.stroke();
      }

      stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height + 4) {
          star.y = -4;
          star.x = Math.random() * width;
        }
        context.beginPath();
        context.fillStyle = `rgba(226, 240, 255, ${star.opacity})`;
        context.arc(star.x + mouseRef.current.x * star.speed, star.y + mouseRef.current.y * star.speed, star.radius, 0, Math.PI * 2);
        context.fill();
      });

      frame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" aria-hidden="true" />;
}
