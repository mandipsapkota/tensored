import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/global/Navbar';
import AuthGuard from './components/global/AuthGuard';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import SessionPage from './pages/SessionPage';
import Profile from './pages/Profile';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-background text-text font-sans">
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected routes — require login */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/session/:id" element={<AuthGuard><SessionPage /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
