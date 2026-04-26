import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Plus, Video, PlayCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('animate');
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('animax_token');
        const res = await fetch('http://localhost:8000/api/lessons/sessions/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    navigate('/session/new', { state: { title, description, mode } });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pt-24 pb-24 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.first_name || user?.name || 'Learner'}!</h1>
          <p className="text-gray-400 text-lg">Ready to start a new learning session?</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-1"
        >
          <Plus className="w-6 h-6" /> Start New Session
        </button>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Video className="w-6 h-6 text-primary" /> Previous Sessions
        </h2>
        
        {isLoading ? (
          <div className="text-gray-400">Loading your sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-400">You haven't generated any sessions yet. Click the button above to start!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                onClick={() => navigate(`/session/${session.id}`)}
                className="bg-surface border border-gray-800 rounded-3xl p-6 hover:border-gray-600 transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-gray-400">
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {session.title}
                </h3>
                
                <div className="mt-auto pt-6 flex justify-between items-end border-t border-gray-800/50">
                  <span className="text-sm text-gray-500">Replay Animation</span>
                  <span className="text-primary font-bold">Watch</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-gray-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Create New Session</h2>
            <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Session Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics: Laws of Motion"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-text"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Detailed Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What specifically do you want to learn? The more details, the better the AI animation!"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-text min-h-[120px] resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Initial Response Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('animate')}
                    className={`py-3 rounded-xl border font-semibold transition-colors ${
                      mode === 'animate'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    Animate
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('text')}
                    className={`py-3 rounded-xl border font-semibold transition-colors ${
                      mode === 'text'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    Text
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-colors mt-4"
              >
                Create Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
