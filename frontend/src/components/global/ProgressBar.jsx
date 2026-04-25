export default function ProgressBar({ progress, color = 'bg-primary' }) {
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
      <div 
        className={`${color} h-1.5 rounded-full transition-all duration-500 ease-out`} 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}
