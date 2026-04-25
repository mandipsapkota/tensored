import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WeakAreaList({ feedback }) {
  return (
    <div className="space-y-4">
      {feedback.map((item, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`flex items-start gap-4 p-5 rounded-2xl border ${
            item.type === 'positive' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
          }`}
        >
          {item.type === 'positive' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
          <div>
            <p className="font-medium leading-relaxed">{item.message}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
