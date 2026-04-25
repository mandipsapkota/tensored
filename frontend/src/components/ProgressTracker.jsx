import { Trophy, Target, Flame } from 'lucide-react';

export default function ProgressTracker({ progress = 65, streak = 5, lessonsCompleted = 12 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-surface rounded-2xl p-6 border border-gray-800 shadow-lg flex items-center gap-4">
        <div className="p-4 bg-blue-500/20 rounded-xl">
          <Target className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm font-medium">Overall Progress</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-6 border border-gray-800 shadow-lg flex items-center gap-4">
        <div className="p-4 bg-orange-500/20 rounded-xl">
          <Flame className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm font-medium">Current Streak</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{streak}</span>
            <span className="text-gray-500 mb-1">days</span>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-6 border border-gray-800 shadow-lg flex items-center gap-4">
        <div className="p-4 bg-purple-500/20 rounded-xl">
          <Trophy className="w-8 h-8 text-purple-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm font-medium">Lessons Completed</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{lessonsCompleted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
