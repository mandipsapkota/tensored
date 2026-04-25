import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, LogOut } from 'lucide-react';
import useStore from '../../store/useStore';

export default function Navbar() {
  const { user, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Landing and Auth pages get a minimal transparent navbar
  if (location.pathname === '/' || location.pathname === '/auth') {
    return (
      <nav className="fixed top-0 w-full bg-transparent backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Animax
          </Link>
          <div className="flex gap-4">
            {user ? (
              <Link to="/dashboard" className="px-5 py-2 rounded-full bg-primary hover:bg-blue-600 text-white font-medium transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link to="/auth" className="px-5 py-2 rounded-full bg-primary hover:bg-blue-600 text-white font-medium transition-colors">
                Sign in with Google
              </Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // App pages get the full navigation bar
  return (
    <nav className="fixed top-0 w-full bg-surface/90 backdrop-blur-md border-b border-gray-800 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Animax
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/chat" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> AI Tutor
          </Link>

          {/* User profile section */}
          <div className="flex items-center gap-3 border-l border-gray-700 pl-6 ml-2">
            {user?.profile_picture_url ? (
              <img 
                src={user.profile_picture_url} 
                alt={user.first_name || user.name} 
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-sm font-bold">
                {(user?.first_name?.[0] || user?.name?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-gray-300 hidden md:inline">
              {user?.first_name || user?.name || 'Guest'}
            </span>
            <button 
              onClick={handleLogout} 
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
