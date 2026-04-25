import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function QuizComponent({ question, options, correctAnswerIndex }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setIsSubmitted(true);
    }
  };

  const isCorrect = selectedOption === correctAnswerIndex;

  return (
    <div className="bg-surface rounded-2xl p-8 border border-gray-800 max-w-2xl mx-auto w-full shadow-lg">
      <h3 className="text-xl font-semibold mb-6">Knowledge Check</h3>
      <p className="text-lg mb-6">{question || 'What is the main concept discussed in this lesson?'}</p>
      
      <div className="space-y-3 mb-8">
        {(options || ['Option A', 'Option B', 'Option C', 'Option D']).map((option, idx) => (
          <button
            key={idx}
            onClick={() => !isSubmitted && setSelectedOption(idx)}
            className={`w-full text-left px-6 py-4 rounded-xl border transition-all ${
              isSubmitted
                ? idx === correctAnswerIndex
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : selectedOption === idx
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-gray-700 opacity-50'
                : selectedOption === idx
                ? 'border-primary bg-primary/10'
                : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800'
            }`}
            disabled={isSubmitted}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {isSubmitted && idx === correctAnswerIndex && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {isSubmitted && selectedOption === idx && idx !== correctAnswerIndex && <XCircle className="w-5 h-5 text-red-500" />}
            </div>
          </button>
        ))}
      </div>

      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedOption === null}
          className="w-full py-4 bg-primary hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-xl font-medium transition-colors"
        >
          Submit Answer
        </button>
      ) : (
        <div className={`p-4 rounded-xl text-center font-medium ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isCorrect ? 'Excellent! You got it right.' : 'Not quite. Review the lesson and try again.'}
        </div>
      )}
    </div>
  );
}
