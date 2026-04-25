import { useState } from 'react';
import { Search } from 'lucide-react';

export default function TopicInputBox({ onSubmit }) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-11 pr-4 py-4 bg-surface border border-gray-700 rounded-full text-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-lg text-lg"
        placeholder="E.g., Explain recursion like I'm 5..."
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <button
        type="submit"
        className="absolute inset-y-2 right-2 px-6 bg-primary hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
      >
        Learn
      </button>
    </form>
  );
}
