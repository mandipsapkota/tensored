import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Send } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleStartSession = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    if (user) {
      navigate('/session/new', { state: { title, description } });
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-surface relative overflow-hidden">
      <div className="text-center max-w-4xl z-10 animate-fade-in-up">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary/80 pb-4">
          Animate your learning
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
          Generate AI-driven interactive video lessons and quizzes instantly. Provide a title and description to start!
        </p>
        
        <form onSubmit={handleStartSession} className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col gap-4">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session Title (e.g., Quantum Entanglement)"
              className="w-full bg-gray-950/90 border border-gray-800 text-text rounded-2xl py-4 pl-6 pr-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-2xl backdrop-blur-sm"
              required
            />
            <div className="relative flex items-end">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of what you want to learn..."
                className="w-full bg-gray-950/90 border border-gray-800 text-text rounded-2xl py-4 pl-6 pr-20 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-2xl backdrop-blur-sm min-h-[120px] resize-none"
                required
              />
              <button 
                type="submit"
                className="absolute right-3 bottom-3 p-4 bg-primary hover:bg-blue-600 text-white rounded-xl transition-colors"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Decorative background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
    </div>
  );
}
