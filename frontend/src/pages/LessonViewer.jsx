import LessonPlayer from '../components/LessonPlayer';
import QuizComponent from '../components/QuizComponent';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LessonViewer() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-6 pt-24 space-y-12 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Understanding Recursion</h1>
        <button 
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-gray-800 border border-gray-700 rounded-xl transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Ask AI
        </button>
      </div>

      <LessonPlayer title="Recursion Explained" placeholderType="animation" />
      
      <div className="pt-8 border-t border-gray-800">
        <QuizComponent 
          question="What is the key characteristic of a recursive function?"
          options={[
            "It runs infinitely.",
            "It calls itself until it reaches a base case.",
            "It uses multiple external libraries.",
            "It cannot be written in JavaScript."
          ]}
          correctAnswerIndex={1}
        />
      </div>
    </div>
  );
}
