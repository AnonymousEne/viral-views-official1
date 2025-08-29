import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  data: number[];
  color?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  height?: number;
  className?: string;
}

export default function WaveformVisualizer({ 
  data, 
  color = 'purple-500', 
  isPlaying = false,
  currentTime = 0,
  duration = 180,
  height = 60,
  className = ""
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Calculate bar width and spacing
    const barWidth = Math.max(1, (rect.width - data.length) / data.length);
    const barSpacing = 1;

    // Calculate progress
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = progress * rect.width;

    // Draw waveform bars
    data.forEach((value, index) => {
      const barHeight = (value / 100) * height * 0.8;
      const x = index * (barWidth + barSpacing);
      const y = (height - barHeight) / 2;

      // Choose color based on playback progress
      const isPast = x < progressX;
      let fillColor: string;

      switch (color) {
        case 'highlight-500':
          fillColor = isPast ? '#F59E0B' : 'rgba(245, 158, 11, 0.3)';
          break;
        case 'purple-500':
          fillColor = isPast ? '#8B5CF6' : 'rgba(139, 92, 246, 0.3)';
          break;
        case 'electric-500':
          fillColor = isPast ? '#3B82F6' : 'rgba(59, 130, 246, 0.3)';
          break;
        case 'success-500':
          fillColor = isPast ? '#10B981' : 'rgba(16, 185, 129, 0.3)';
          break;
        default:
          fillColor = isPast ? '#8B5CF6' : 'rgba(139, 92, 246, 0.3)';
      }

      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    // Draw playhead if playing
    if (isPlaying && progress > 0) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }

  }, [data, color, isPlaying, currentTime, duration, height]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger redraw by updating a dummy state or calling the effect dependencies
      const canvas = canvasRef.current;
      if (canvas) {
        // Force redraw by clearing and redrawing
        const event = new CustomEvent('redraw');
        canvas.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-dark-200 rounded overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ height: `${height}px` }}
      />
      
      {/* Fallback for non-canvas environments */}
      <div className="flex items-end justify-center h-full space-x-1 overflow-hidden md:hidden">
        {data.slice(0, 50).map((value, index) => {
          const barHeight = (value / 100) * height * 0.8;
          const isPast = isPlaying && (index / 50) < (currentTime / duration);
          
          let colorClass: string;
          switch (color) {
            case 'highlight-500':
              colorClass = isPast ? 'bg-highlight-500' : 'bg-highlight-500/30';
              break;
            case 'purple-500':
              colorClass = isPast ? 'bg-purple-500' : 'bg-purple-500/30';
              break;
            case 'electric-500':
              colorClass = isPast ? 'bg-electric-500' : 'bg-electric-500/30';
              break;
            case 'success-500':
              colorClass = isPast ? 'bg-success-500' : 'bg-success-500/30';
              break;
            default:
              colorClass = isPast ? 'bg-purple-500' : 'bg-purple-500/30';
          }

          return (
            <div
              key={index}
              className={`w-1 ${colorClass} transition-colors duration-150`}
              style={{ height: `${Math.max(2, barHeight)}px` }}
            />
          );
        })}
      </div>
    </div>
  );
}
