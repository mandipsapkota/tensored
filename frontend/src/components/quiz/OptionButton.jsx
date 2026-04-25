import { motion } from 'framer-motion';

export default function OptionButton({ text, index, isSelected, isSubmitted, isCorrect, onClick }) {
  let styleClass = 'border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-gray-300';
  
  if (isSelected) styleClass = 'border-primary bg-primary/10 text-white';
  
  if (isSubmitted) {
    if (isCorrect) styleClass = 'border-green-500 bg-green-500/20 text-green-400';
    else if (isSelected && !isCorrect) styleClass = 'border-red-500 bg-red-500/20 text-red-400';
    else styleClass = 'border-gray-800 opacity-50 text-gray-500';
  }

  return (
    <motion.button
      whileHover={!isSubmitted ? { scale: 1.02 } : {}}
      whileTap={!isSubmitted ? { scale: 0.98 } : {}}
      onClick={() => !isSubmitted && onClick(index)}
      className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-colors ${styleClass}`}
      disabled={isSubmitted}
    >
      <div className="flex items-center gap-4">
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-inherit text-sm font-bold">
          {String.fromCharCode(65 + index)}
        </span>
        <span className="text-lg font-medium">{text}</span>
      </div>
    </motion.button>
  );
}
