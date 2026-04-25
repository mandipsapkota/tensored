import { useEffect, useRef, useMemo, forwardRef, useImperativeHandle, useState } from 'react';

const AnimationPlayer = forwardRef(({ scenes, isPlaying, onProgress, onEnded, showCaptions, volume }, ref) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const globalTimeRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastProgressRef = useRef(0);
  const isEndedRef = useRef(false);

  // Captions state
  const [caption, setCaption] = useState('');

  // Pre-compile scene functions and calculate start/end times
  const compiledScenes = useMemo(() => {
    let t = 0;
    return [...(scenes || [])]
      .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0))
      .map((s) => {
      const start = t;
      const duration = Number(s.duration) || 5;
      t += duration;
      let drawFn = null;
      try {
        if (s.canvas_code) {
          // Include 'W', 'H', and 'progress' for AI-generated code, while keeping 'time' and 'canvas' for mock code
          drawFn = new Function('ctx', 'time', 'canvas', 'W', 'H', 'progress', s.canvas_code);
        }
      } catch (e) {
        console.error('Failed to compile scene:', e);
      }
      return { ...s, start, end: t, duration, draw: drawFn };
    });
  }, [scenes]);

  const totalDuration = compiledScenes.length > 0 ? compiledScenes[compiledScenes.length - 1].end : 0;

  const activeSceneIndexRef = useRef(-1);
  const voicesRef = useRef([]);
  const narrationTokenRef = useRef(0);
  const activeAudioRef = useRef(null);

  const clampVolume = (v) => Math.max(0, Math.min(1, Number(v) || 0));

  const stopNarration = () => {
    narrationTokenRef.current += 1;
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const chooseVoice = () => {
    const voices = voicesRef.current;
    if (!voices.length) return null;

    const preferred = [
      'Samantha',
      'Victoria',
      'Google UK English Female',
      'Google US English',
      'Zira'
    ];

    for (const key of preferred) {
      const match = voices.find((v) => v.name.includes(key));
      if (match) return match;
    }

    const enVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
    return enVoice || voices[0] || null;
  };

  const speakScene = (sceneText) => {
    if (!window.speechSynthesis || !sceneText) return;

    const token = ++narrationTokenRef.current;
    const utterance = new SpeechSynthesisUtterance(sceneText);
    const selectedVoice = chooseVoice();
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = clampVolume(volume);

    // Avoid browser race conditions where cancel + speak in same tick can drop speech.
    window.speechSynthesis.cancel();
    setTimeout(() => {
      if (token !== narrationTokenRef.current || !window.speechSynthesis) return;
      window.speechSynthesis.speak(utterance);
      window._activeUtterance = utterance;
    }, 30);
  };

  const playSceneAudio = (sceneAudio, sceneText) => {
    if (!sceneAudio) {
      speakScene(sceneText);
      return;
    }

    const token = ++narrationTokenRef.current;
    const src = sceneAudio.startsWith('data:audio') ? sceneAudio : `data:audio/mp3;base64,${sceneAudio}`;
    const audio = new Audio(src);
    audio.volume = clampVolume(volume);
    activeAudioRef.current = audio;

    audio.play().catch(() => {
      if (token !== narrationTokenRef.current) return;
      activeAudioRef.current = null;
      speakScene(sceneText);
    });
  };

  // Stop speaking if volume drops to 0 or is muted, but it's easier to just pass volume to utterance
  // If volume changes mid-speech, window.speechSynthesis doesn't update dynamically well
  // We can cancel and restart if volume changes drastically, but for now we just apply on next utterance.
  useEffect(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.volume = clampVolume(volume);
    }
    if (volume === 0) {
      stopNarration();
    }
  }, [volume]);

  // Audio Sync Logic
  useEffect(() => {
    // When playback stops, stop speaking
    if (!isPlaying) {
      stopNarration();
      // Reset active index so it speaks again if we resume
      activeSceneIndexRef.current = -1;
    } else {
      // Force one scene-change pass when play starts so first scene narration always triggers.
      activeSceneIndexRef.current = -1;
    }
    // Ensure voices are loaded ahead of time
    if (window.speechSynthesis) {
      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [isPlaying]);

  useEffect(() => {
    // Clean up speech on unmount
    return () => {
      stopNarration();
    };
  }, []);

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

    // AUDIO & CAPTION SYNC: If the scene has changed and we are playing, update caption and speak
    if (activeIndex !== activeSceneIndexRef.current) {
      activeSceneIndexRef.current = activeIndex;
      
      // Set caption
      if (scene.text) {
        setCaption(scene.text);
      } else {
        setCaption('');
      }

      // Play audio if playing
      if (isPlaying && (scene.text || scene.audio) && volume > 0) {
        stopNarration();
        playSceneAudio(scene.audio, scene.text);
      }
    }

    if (scene.draw) {
      try {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
        
        const W = canvas.width;
        const H = canvas.height;
        const progress = Math.min(1, Math.max(0, sceneTime / scene.duration));
        
        scene.draw(ctx, sceneTime, canvas, W, H, progress);
        
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
      
      // Force audio to re-trigger on seek by resetting the active index tracker
      activeSceneIndexRef.current = -1;
      
      const activeIndex = drawFrame(globalTimeRef.current);
      if (onProgress) {
        onProgress(globalTimeRef.current, activeIndex);
      }
    }
  }));

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      const bounds = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(1, Math.floor(bounds.height));

      if (canvas.width !== width) {
        canvas.width = width;
      }
      if (canvas.height !== height) {
        canvas.height = height;
      }

      drawFrame(globalTimeRef.current);
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [compiledScenes]);

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
    <div ref={containerRef} className="relative w-full h-full bg-gray-950 overflow-hidden group">
      <canvas
        ref={canvasRef}
        className="h-full w-full block"
      />
      
      {/* Captions Overlay */}
      {showCaptions && caption && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-8 pointer-events-none transition-opacity duration-300 opacity-100">
          <div className="bg-black/60 backdrop-blur-md text-white/90 px-6 py-3 rounded-2xl text-center text-lg md:text-xl font-medium shadow-2xl max-w-3xl border border-white/10">
            {caption}
          </div>
        </div>
      )}
    </div>
  );
});

AnimationPlayer.displayName = 'AnimationPlayer';
export default AnimationPlayer;
