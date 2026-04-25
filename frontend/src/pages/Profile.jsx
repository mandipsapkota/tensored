import { useState } from 'react';
import useStore from '../store/useStore';
import api from '../api/client';
import { Key, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const { user, login } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveApiKey = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/api/auth/me/', { openai_api_key: apiKey });
      const token = localStorage.getItem('animax_token');
      login({ ...user, ...res.data, token });
      setSaved(true);
      setApiKey('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save API key:', err);
      alert('Failed to save API key.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pt-24">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      {/* Profile Card */}
      <div className="bg-surface border border-gray-800 rounded-2xl p-8 mb-8 flex items-center gap-6">
        {user?.profile_picture_url ? (
          <img
            src={user.profile_picture_url}
            alt={user.first_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 shadow-lg"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-3xl font-bold shadow-lg">
            {(user?.first_name?.[0] || user?.name?.[0] || 'U').toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-semibold">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="text-gray-400 mt-1">{user?.email}</p>
          <div className="mt-4 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm inline-block font-medium">
            Google Account
          </div>
        </div>
      </div>

      {/* OpenAI API Key Section */}
      <div className="bg-surface border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">OpenAI API Key</h3>
        </div>

        {user?.has_openai_key && (
          <div className="flex items-center gap-2 mb-4 text-green-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>API key is saved and encrypted.</span>
          </div>
        )}

        <p className="text-gray-400 text-sm mb-4">
          Your key is encrypted with AES-256 and never stored in plaintext.
          It's only used server-side to call OpenAI for generating lessons.
        </p>

        <div className="flex gap-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={user?.has_openai_key ? '••••••••••••••••  (replace existing)' : 'sk-...'}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary text-text"
          />
          <button
            onClick={handleSaveApiKey}
            disabled={!apiKey.trim() || saving}
            className="px-6 py-3 bg-primary hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-medium transition-colors"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
