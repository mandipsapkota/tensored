import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function SceneController({ isPlaying, togglePlay, currentTime, totalTime, onSeek }) {
  return (
    <div className="flex flex-col bg-surface border-t border-gray-800 p-4">
      {/* Video Scrubber */}
      <div className="flex items-center gap-4 mb-3">
        <span className="text-xs text-gray-400 font-medium w-10 text-right">{formatTime(currentTime || 0)}</span>
        <input 
          type="range" 
          min="0" 
          max={totalTime || 100} 
          step="0.1"
          value={currentTime || 0}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="text-xs text-gray-400 font-medium w-10">{formatTime(totalTime || 0)}</span>
      </div>
      
      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-6">
        <button 
          onClick={() => onSeek(Math.max(0, currentTime - 5))} 
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Rewind 5s"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        
        <button 
          onClick={togglePlay}
          className="p-3 bg-primary hover:bg-blue-600 text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/30"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>
        
        <button 
          onClick={() => onSeek(Math.min(totalTime, currentTime + 5))}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Forward 5s"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
