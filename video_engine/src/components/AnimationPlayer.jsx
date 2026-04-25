import { useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

const AnimationPlayer = forwardRef(({ scenes, isPlaying, onProgress, onEnded }, ref) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const globalTimeRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastProgressRef = useRef(0);
  const isEndedRef = useRef(false);

  // Pre-compile scene functions and calculate start/end times
  const compiledScenes = useMemo(() => {
    let t = 0;
    return (scenes || []).map(s => {
      const start = t;
      const duration = Number(s.duration) || 5;
      t += duration;
      let drawFn = null;
      try {
        if (s.canvas_code) {
          drawFn = new Function('ctx', 'time', 'canvas', s.canvas_code);
        }
      } catch (e) {
        console.error('Failed to compile scene:', e);
      }
      return { ...s, start, end: t, duration, draw: drawFn };
    });
  }, [scenes]);

  const totalDuration = compiledScenes.length > 0 ? compiledScenes[compiledScenes.length - 1].end : 0;

  const drawFrame = (time) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (compiledScenes.length === 0) {
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return 0;
    }

    // Determine the active scene
    let activeIndex = compiledScenes.findIndex(s => time >= s.start && time < s.end);
    if (activeIndex === -1) {
      activeIndex = time >= totalDuration ? compiledScenes.length - 1 : 0;
    }
    const scene = compiledScenes[activeIndex];
    const sceneTime = time - scene.start;

    if (scene.draw) {
      try {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
        scene.draw(ctx, sceneTime, canvas);
        ctx.restore();
      } catch (err) {
        console.error('Error drawing scene', err);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '600 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scene rendering error', canvas.width / 2, canvas.height / 2);
    }

    return activeIndex;
  };

  useImperativeHandle(ref, () => ({
    seek: (time) => {
      globalTimeRef.current = Math.max(0, Math.min(time, totalDuration));
      
      if (globalTimeRef.current >= totalDuration) {
        isEndedRef.current = true;
        if (onEnded) onEnded();
      } else {
        isEndedRef.current = false;
      }
      
      const activeIndex = drawFrame(globalTimeRef.current);
      if (onProgress) {
        onProgress(globalTimeRef.current, activeIndex);
      }
    }
  }));

  useEffect(() => {
    if (!isPlaying) {
      // Draw at least once when paused so the canvas isn't blank
      drawFrame(globalTimeRef.current);
      lastTickRef.current = 0; // Reset so resuming doesn't have a huge delta
      return;
    }

    const tick = (timestamp) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp;
      const delta = (timestamp - lastTickRef.current) / 1000;
      lastTickRef.current = timestamp;

      if (!isEndedRef.current) {
        globalTimeRef.current += delta;
      }

      if (globalTimeRef.current >= totalDuration) {
        globalTimeRef.current = totalDuration;
        if (!isEndedRef.current) {
          isEndedRef.current = true;
          if (onEnded) onEnded();
        }
      }

      const activeIndex = drawFrame(globalTimeRef.current);

      // Throttle progress updates to parent to avoid excessive React renders
      if (timestamp - lastProgressRef.current > 100) {
        lastProgressRef.current = timestamp;
        if (onProgress) onProgress(globalTimeRef.current, activeIndex);
      }

      if (isPlaying) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, compiledScenes, totalDuration]);

  return (
    <div className="relative aspect-video bg-gray-950 rounded-t-2xl overflow-hidden border-b border-gray-800">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="h-full w-full"
      />
    </div>
  );
});

AnimationPlayer.displayName = 'AnimationPlayer';
export default AnimationPlayer;
