import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { MOCK_PERFORMANCE } from '../api/mockData';
import AnimationPlayer from '../components/learning/AnimationPlayer';
import SceneController from '../components/learning/SceneController';
import { Send, Bot, User, BrainCircuit, Trophy, Target, Clock, Loader2, Play } from 'lucide-react';

const getHistoryFromSession = (data) => {
  if (data?.animation_data?.history) return data.animation_data.history;
  if (data?.animation_data?.scenes) {
    return [{ mode: 'animate', prompt: `${data.title} - ${data.description}`, scenes: data.animation_data.scenes }];
  }
  if (Array.isArray(data?.animation_data)) {
    return [{ mode: 'animate', prompt: `${data.title} - ${data.description}`, scenes: data.animation_data }];
  }
  return [];
};

const getInitialAssistantMessage = (mode) => (
  mode === 'text'
    ? 'Welcome to your learning session! Choose Text to get tutor-style replies, or Animate for visual lessons.'
    : 'Welcome to your learning session! Choose Animate for visual lessons, or Text for tutor-style replies.'
);

const buildMessagesFromHistory = (history) => {
  const messages = [];
  history.forEach((item, index) => {
    const entryMode = item.mode || (item.scenes ? 'animate' : 'text');
    const promptText = item.prompt || 'Prompt';

    if (entryMode === 'animate') {
      messages.push({ role: 'user', text: promptText, historyIndex: index, mode: 'animate' });
      messages.push({ role: 'ai', text: 'Animation ready. You can play it from this message.' });
      return;
    }

    messages.push({ role: 'user', text: promptText, mode: 'text' });
    messages.push({ role: 'ai', text: item.response || 'No text response was returned for this prompt.', mode: 'text' });
  });

  return messages;
};

export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Layout State
  const [phase, setPhase] = useState('video'); // 'video', 'quiz', 'analysis'

  // Chat State
  const [messages, setMessages] = useState([
    { role: 'ai', text: getInitialAssistantMessage(location.state?.mode || 'animate') }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseMode, setResponseMode] = useState(location.state?.mode || 'animate');

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [scenes, setScenes] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  const totalDuration = scenes.reduce((acc, s) => acc + (Number(s.duration) || 5), 0);
  const [videoEnded, setVideoEnded] = useState(false);

  const initialTitle = location.state?.title;
  const initialDescription = location.state?.description;
  const initialMode = location.state?.mode || 'animate';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Unlock Speech Synthesis globally on first interaction to bypass browser auto-play blocks
  useEffect(() => {
    const unlockAudio = () => {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Handle generating a new session
  useEffect(() => {
    if (id === 'new' && initialTitle && initialDescription && messages.length === 1 && !isPlaying && currentTime === 0) {
      const initialPrompt = `**Title**: ${initialTitle}\n**Description**: ${initialDescription}`;
      
      setMessages(prev => [...prev, { role: 'user', text: initialPrompt, mode: initialMode }]);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: initialMode === 'animate'
          ? 'Generating your animated lesson now...'
          : 'Generating your tutor-style text response now...'
      }]);
      setIsGenerating(true);
      
      const createSession = async () => {
        try {
          const token = localStorage.getItem('animax_token');
          const res = await fetch('http://localhost:8000/api/lessons/sessions/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: initialTitle, description: initialDescription, mode: initialMode })
          });
          
          if (res.ok) {
            const data = await res.json();
            setMessages(prev => [...prev, {
              role: 'ai',
              text: 'Session created successfully! Loading your session now.'
            }]);
            navigate(`/session/${data.id}`, { replace: true, state: { mode: initialMode } });
          } else {
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, there was an error generating the session.' }]);
            setIsGenerating(false);
          }
        } catch (err) {
          setMessages(prev => [...prev, { role: 'ai', text: 'Network error while generating the session.' }]);
          setIsGenerating(false);
        }
      };
      
      createSession();
    }
  }, [id, initialTitle, initialDescription, initialMode, messages.length, isPlaying, currentTime, navigate]);

  // Handle loading an existing session
  useEffect(() => {
    if (id !== 'new') {
      const loadSession = async () => {
        try {
          const token = localStorage.getItem('animax_token');
          const res = await fetch(`http://localhost:8000/api/lessons/sessions/${id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setSessionData(data);
            const historyData = getHistoryFromSession(data);
            const preferredMode = data?.animation_data?.default_mode || historyData[historyData.length - 1]?.mode || 'animate';
            setResponseMode(preferredMode);
            
            if (historyData.length > 0) {
              setMessages(buildMessagesFromHistory(historyData));

              const lastAnimated = [...historyData].reverse().find((item) => (item.mode || (item.scenes ? 'animate' : 'text')) === 'animate' && Array.isArray(item.scenes));
              if (lastAnimated) {
                setScenes(lastAnimated.scenes);
                setIsPlaying(true);
              } else {
                setScenes([]);
                setIsPlaying(false);
              }
            } else {
              setMessages([{ role: 'ai', text: getInitialAssistantMessage(preferredMode) }]);
              setScenes([]);
              setIsPlaying(false);
            }
            
            setIsGenerating(false);
            setPhase('video');
            setVideoEnded(false);
            if (playerRef.current) playerRef.current.seek(0);
          }
        } catch (err) {
          console.error("Failed to load session", err);
        }
      };
      loadSession();
    }
  }, [id]);

  const [showCaptions, setShowCaptions] = useState(true);
  const [volume, setVolume] = useState(1);

  // ---------- CHAT LOGIC ----------
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const prompt = chatInput.trim();
    setChatInput('');
    setIsGenerating(true);
    setMessages(prev => [...prev, { role: 'user', text: prompt, mode: responseMode }]);
    setMessages(prev => [...prev, {
      role: 'ai',
      text: responseMode === 'animate'
        ? 'Generating new animation for your request...'
        : 'Generating text response for your request...'
    }]);
    
    try {
      const token = localStorage.getItem('animax_token');
      const res = await fetch(`http://localhost:8000/api/lessons/sessions/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, mode: responseMode })
      });
      if (res.ok) {
        const data = await res.json();
        setSessionData(data);
        const historyData = getHistoryFromSession(data);
        
        if (historyData.length > 0) {
          const newIndex = historyData.length - 1;
          const newEntry = historyData[newIndex];
          const entryMode = newEntry.mode || (newEntry.scenes ? 'animate' : 'text');
          
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length >= 2) {
              if (entryMode === 'animate') {
                updated[updated.length - 2] = { ...updated[updated.length - 2], historyIndex: newIndex, mode: 'animate' };
                updated[updated.length - 1] = { role: 'ai', text: 'New animation generated! Playing now.' };
              } else {
                updated[updated.length - 2] = { ...updated[updated.length - 2], mode: 'text' };
                updated[updated.length - 1] = { role: 'ai', text: newEntry.response || 'No response received.', mode: 'text' };
              }
            }
            return updated;
          });

          if (entryMode === 'animate') {
            setScenes(newEntry.scenes || []);
            setIsPlaying(true);
            setPhase('video');
            setVideoEnded(false);
            if (playerRef.current) {
              playerRef.current.seek(0);
            }
          } else {
            setIsPlaying(false);
          }
        }

        setIsGenerating(false);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: 'Error while generating a response.' }]);
        setIsGenerating(false);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: 'Network error.' }]);
      setIsGenerating(false);
    }
  };

  const handlePlaySegment = (index) => {
    let historyData = [];
    if (sessionData && sessionData.animation_data && sessionData.animation_data.history) {
      historyData = sessionData.animation_data.history;
    } else if (sessionData && sessionData.animation_data) {
      // Fallback for legacy before format migration
      if (sessionData.animation_data.scenes) historyData = [{ scenes: sessionData.animation_data.scenes }];
      else if (Array.isArray(sessionData.animation_data)) historyData = [{ scenes: sessionData.animation_data }];
    }
    
    if (historyData[index]) {
      const item = historyData[index];
      if (!Array.isArray(item.scenes)) return;

      setScenes(item.scenes);
      setIsPlaying(true);
      setPhase('video');
      setVideoEnded(false);
      if (playerRef.current) playerRef.current.seek(0);
    }
  };

  // ---------- VIDEO LOGIC ----------
  const handleProgress = (time) => {
    setCurrentTime(time);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setVideoEnded(true);
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
    if (playerRef.current) playerRef.current.seek(time);
  };

  const handleTogglePlay = () => {
    if (!isPlaying && currentTime >= totalDuration) {
      handleSeek(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen pt-16 bg-background">
      
      {/* LEFT PANEL: CHAT APP */}
      <div className="lg:w-1/2 w-full h-full border-r border-gray-800 flex flex-col bg-surface/50">
        <div className="p-4 border-b border-gray-800 bg-surface flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-primary w-6 h-6" /> AI Tutor
          </h2>
          <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-900 rounded-full border border-gray-800">
            Session Active
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-primary/20 text-primary' : 'bg-gray-700 text-gray-300'}`}>
                {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 rounded-tl-sm shadow-md'}`}>
                {msg.role === 'ai' && msg.mode === 'text' ? (
                  <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap break-words prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-code:text-blue-200">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
                {msg.historyIndex !== undefined && msg.mode === 'animate' && (
                  <button
                    onClick={() => handlePlaySegment(msg.historyIndex)}
                    className={`mt-3 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      msg.role === 'user' 
                        ? 'text-blue-100 hover:text-white bg-black/20 hover:bg-black/30' 
                        : 'text-primary hover:text-blue-400 bg-primary/10 hover:bg-primary/20'
                    }`}
                  >
                    <Play className="w-3 h-3" /> Play Video
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        <form onSubmit={handleSendChat} className="p-4 border-t border-gray-800 bg-surface">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Response Mode</span>
            <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setResponseMode('animate')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  responseMode === 'animate' ? 'bg-primary/20 text-primary' : 'bg-gray-900 text-gray-300'
                }`}
                disabled={isGenerating}
              >
                Animate
              </button>
              <button
                type="button"
                onClick={() => setResponseMode('text')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  responseMode === 'text' ? 'bg-primary/20 text-primary' : 'bg-gray-900 text-gray-300'
                }`}
                disabled={isGenerating}
              >
                Text
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={responseMode === 'animate' ? 'Prompt to animate (e.g. Explain Quantum Entanglement)' : 'Ask a text question (e.g. Explain Quantum Entanglement simply)'}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary text-text shadow-inner"
              disabled={isGenerating}
            />
            <button type="submit" disabled={isGenerating} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-white hover:bg-primary rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-primary">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PANEL: VIDEO (TOP) & QUIZ/ANALYSIS (BOTTOM) */}
      <div className="lg:w-1/2 w-full h-full flex flex-col">
        
        {/* TOP PANEL: VIDEO PLAYER */}
        <div 
          className={`flex flex-col bg-gray-950 border-b border-gray-800 relative min-h-0 transition-all duration-500 ease-in-out ${
            phase === 'video' ? 'flex-[3]' : 'flex-[1]'
          }`}
        >
          <div className="flex-1 relative min-h-0">
            <AnimationPlayer 
              ref={playerRef}
              scenes={scenes}
              isPlaying={isPlaying} 
              onProgress={handleProgress}
              onEnded={handleEnded}
              showCaptions={showCaptions}
              volume={volume}
            />
            {/* Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-gray-400 font-medium animate-pulse">
                    {responseMode === 'animate' ? 'Generating animation...' : 'Generating text response...'}
                  </p>
                </div>
              </div>
            )}
            {/* Dark overlay if video hasn't started */}
            {!isPlaying && currentTime === 0 && !videoEnded && !isGenerating && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-10">
                <div className="text-center">
                  <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-400 font-medium">No active animation yet. Switch to Animate mode to generate one.</p>
                </div>
              </div>
            )}
          </div>
          <SceneController 
            isPlaying={isPlaying} 
            togglePlay={handleTogglePlay}
            currentTime={currentTime}
            totalTime={totalDuration}
            onSeek={handleSeek}
            showCaptions={showCaptions}
            setShowCaptions={setShowCaptions}
            volume={volume}
            setVolume={setVolume}
          />
        </div>

        {/* BOTTOM PANEL: QUIZ OR ANALYSIS */}
        <div 
          className={`flex flex-col bg-surface overflow-y-auto transition-all duration-500 ease-in-out ${
            phase === 'video' ? 'flex-[1]' : 'flex-[3]'
          }`}
        >
          {phase === 'video' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0 overflow-y-auto">
              <BrainCircuit className="w-12 h-12 text-primary mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Lesson Context</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-sm">
                {isGenerating 
                  ? "Your video is currently being generated by the AI..." 
                  : "Watch the video above completely. (Quiz generation is disabled for now)."}
              </p>
              <button 
                onClick={() => setPhase('analysis')}
                disabled={!videoEnded || isGenerating}
                className="px-8 py-3 bg-primary hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-full font-bold transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none flex items-center gap-2"
              >
                {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : videoEnded ? "View Summary" : "Finish Video to Unlock"}
              </button>
            </div>
          )}

          {/* Quiz phase removed completely */}

          {phase === 'analysis' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 text-primary rounded-full mb-4 ring-4 ring-primary/10">
                  <Trophy className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Performance Analysis</h1>
                <p className="text-gray-400">Here's how you did on the topic.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Score</p>
                    <p className="text-2xl font-bold">{MOCK_PERFORMANCE.score}%</p>
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Time Taken</p>
                    <p className="text-xl font-bold">{MOCK_PERFORMANCE.timeTaken}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-primary"/> AI Feedback</h3>
                <div className="space-y-3">
                  {MOCK_PERFORMANCE.aiFeedback.map((fb, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${fb.type === 'positive' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                      {fb.message}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  setPhase('video');
                  setMessages(prev => [...prev, { role: 'ai', text: 'What would you like to learn next?' }]);
                }}
                className="w-full py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-colors text-lg"
              >
                Prompt Again to Learn More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
