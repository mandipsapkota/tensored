import { motion, AnimatePresence } from 'framer-motion';

export default function SubtitleBox({ text }) {
  return (
    <div className="p-6 bg-surface text-center min-h-[100px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-xl md:text-2xl font-medium text-gray-200"
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
