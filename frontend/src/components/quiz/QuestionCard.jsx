import { motion } from 'framer-motion';
import OptionButton from './OptionButton';

export default function QuestionCard({ question, options, selectedOption, onSelect, isSubmitted, correctAnswerIndex }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl max-w-3xl mx-auto w-full"
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
        {question}
      </h2>
      
      <div className="space-y-4">
        {options.map((option, idx) => (
          <OptionButton
            key={idx}
            index={idx}
            text={option}
            isSelected={selectedOption === idx}
            isSubmitted={isSubmitted}
            isCorrect={idx === correctAnswerIndex}
            onClick={onSelect}
          />
        ))}
      </div>
    </motion.div>
  );
}
