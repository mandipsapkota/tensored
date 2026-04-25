import { useState, useRef } from 'react';
import { MOCK_ANIMATION_SCRIPT } from './data/mockScenes';
import AnimationPlayer from './components/AnimationPlayer';
import SceneController from './components/SceneController';

export default function App() {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const scenes = MOCK_ANIMATION_SCRIPT;
  const totalDuration = scenes.reduce((acc, s) => acc + (Number(s.duration) || 5), 0);
  const currentScene = scenes[currentSceneIndex] || scenes[0];

  const handleProgress = (time, sceneIndex) => {
    setCurrentTime(time);
    setCurrentSceneIndex(sceneIndex);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.seek(time);
    }
  };

  const handleTogglePlay = () => {
    if (!isPlaying && currentTime >= totalDuration) {
      handleSeek(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
        Animax Video Engine Test
      </h1>
      
      <div className="w-full max-w-4xl flex flex-col bg-surface border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <AnimationPlayer 
          ref={playerRef}
          scenes={scenes}
          isPlaying={isPlaying} 
          onProgress={handleProgress}
          onEnded={handleEnded}
        />
        
        {/* Subtitle / Sub-caption area */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 text-center min-h-[80px] flex items-center justify-center">
          <p className="text-lg text-gray-200 font-medium">
            {currentScene?.text || ''}
          </p>
        </div>

        <SceneController 
          isPlaying={isPlaying} 
          togglePlay={handleTogglePlay}
          currentTime={currentTime}
          totalTime={totalDuration}
          onSeek={handleSeek}
        />
      </div>
      
      <div className="mt-8 text-gray-500 text-sm text-center">
        This is a standalone testing harness for the Animax AI canvas animation renderer.<br />
        It runs fully independent of the main app routing and backend.
      </div>
    </div>
  );
}
