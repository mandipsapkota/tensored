import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import api from '../api/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_SCRIPT_ID = 'google-gsi-script';

export default function AuthPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const login = useStore((state) => state.login);
  const handleGoogleResponseRef = useRef(null);

  // If already logged in, go to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      const res = await api.post('/api/auth/google/', {
        credential: response.credential,
      });

      const { token, user: profile } = res.data;

      // Save JWT and user data to Zustand store (also persists to localStorage)
      login({ ...profile, token });

      navigate('/dashboard');
    } catch (err) {
      console.error('Google auth failed:', err.response?.data || err.message);
      alert('Authentication failed. Please try again.');
    }
  }, [login, navigate]);

  useEffect(() => {
    handleGoogleResponseRef.current = handleGoogleResponse;
  }, [handleGoogleResponse]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initAndRenderGoogleBtn = () => {
      if (!window.google) return;

      if (!window.__animaxGoogleInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (handleGoogleResponseRef.current) {
              handleGoogleResponseRef.current(response);
            }
          },
        });
        window.__animaxGoogleInitialized = true;
      }

      const buttonRoot = document.getElementById('google-signin-btn');
      if (!buttonRoot || buttonRoot.childElementCount > 0) return;

      window.google.accounts.id.renderButton(buttonRoot, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'pill',
      });
    };

    if (window.google) {
      initAndRenderGoogleBtn();
    } else {
      let script = document.getElementById(GOOGLE_SCRIPT_ID);
      if (!script) {
        script = document.createElement('script');
        script.id = GOOGLE_SCRIPT_ID;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
      script.addEventListener('load', initAndRenderGoogleBtn, { once: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        {/* Branding */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Animax
          </h1>
          <p className="text-gray-400 text-lg">
            Sign in to start your AI-powered learning journey.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface border border-gray-800 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Welcome</h2>
          <p className="text-gray-400 mb-10">Continue with your Google account</p>

          {/* Google Sign-In button */}
          <div className="flex justify-center mb-8">
            {GOOGLE_CLIENT_ID ? (
              <div id="google-signin-btn"></div>
            ) : (
              <div className="text-center">
                <p className="text-orange-400 text-sm mb-4">
                  Google Client ID not configured.
                </p>
                <p className="text-gray-500 text-xs mb-6">
                  Set <code className="bg-gray-800 px-2 py-1 rounded">VITE_GOOGLE_CLIENT_ID</code> in
                  your <code className="bg-gray-800 px-2 py-1 rounded">.env</code> file.
                </p>
                {/* Dev bypass */}
                <button
                  onClick={() => {
                    login({ id: 1, name: 'Dev User', email: 'dev@animax.com', first_name: 'Dev', last_name: 'User', profile_picture_url: null, has_openai_key: false });
                    navigate('/dashboard');
                  }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700"
                >
                  Continue as Dev User →
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-xs">
            By continuing, you agree to Animax's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
