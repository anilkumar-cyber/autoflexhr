import { FiCheck, FiX } from 'react-icons/fi';
import { STAGES, stageIndex } from './referralUtils';

export default function ReferralTimeline({ stage }) {
  const rejected = stage === 'Rejected';
  const current = stageIndex(stage);

  return (
    <div className="flex items-center overflow-x-auto pb-2">
      {STAGES.map((s, i) => {
        const done = !rejected && i <= current;
        const isCurrent = !rejected && i === current;
        return (
          <div key={s} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                done ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white dark:bg-surface-card-dark border-gray-300 dark:border-gray-600 text-gray-400'
              } ${isCurrent ? 'ring-4 ring-brand-100 dark:ring-brand-500/20' : ''}`}>
                {done ? <FiCheck className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[11px] font-medium whitespace-nowrap ${done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-0.5 w-8 md:w-12 mx-1 mb-5 ${i < current && !rejected ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        );
      })}
      {rejected && (
        <div className="flex flex-col items-center gap-1.5 ml-3 flex-shrink-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500 border-2 border-red-500 text-white">
            <FiX className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-medium text-red-600">Rejected</span>
        </div>
      )}
    </div>
  );
}
