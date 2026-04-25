import { Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScoreCard({ score, accuracy, timeTaken }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-12"
    >
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Simple ring representing score out of 100 */}
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
            <motion.circle 
              cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent"
              strokeDasharray={440}
              initial={{ strokeDashoffset: 440 }}
              animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-primary"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-bold">{score}%</span>
            <span className="text-sm text-gray-400">Score</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-6 w-full">
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <Target className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-gray-400 text-sm">Accuracy</p>
          <p className="text-2xl font-bold">{accuracy}%</p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <div className="w-6 h-6 text-orange-500 mb-2 font-bold flex items-center">⏱</div>
          <p className="text-gray-400 text-sm">Time Taken</p>
          <p className="text-2xl font-bold">{timeTaken}</p>
        </div>
      </div>
    </motion.div>
  );
}
