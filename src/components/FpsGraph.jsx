import { useEffect, useRef } from 'react';

const MAX_BARS = 60;

export default function FpsGraph({ samples }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * ratio;
    const height = canvas.clientHeight * ratio;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const recent = (samples || []).slice(-MAX_BARS);
    if (recent.length === 0) return undefined;
    const maxFps = Math.max(60, ...recent);
    const barWidth = width / MAX_BARS;

    recent.forEach((fps, index) => {
      const barHeight = Math.min((fps / maxFps) * height * 0.92, height);
      const x = index * barWidth;
      const color = fps > 50 ? '#51cf66' : fps > 30 ? '#ffa500' : '#ff6b6b';
      ctx.fillStyle = color;
      ctx.fillRect(x + barWidth * 0.12, height - barHeight, barWidth * 0.76, barHeight);
    });

    const line60 = height - Math.min((60 / maxFps) * height * 0.92, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([4 * ratio, 4 * ratio]);
    ctx.beginPath();
    ctx.moveTo(0, line60);
    ctx.lineTo(width, line60);
    ctx.stroke();

    return undefined;
  }, [samples]);

  return (
    <section className="graph-section">
      <h2>FPS en direct</h2>
      <canvas ref={canvasRef} className="fps-graph" />
    </section>
  );
}
