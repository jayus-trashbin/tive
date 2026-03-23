import React, { useMemo } from 'react';
import { usePhysiology } from '../../hooks/usePhysiology';
import { AlertCircle } from 'lucide-react';

interface Props {
  targetWeight: number;
}

const PlateCalculator: React.FC<Props> = ({ targetWeight }) => {
  const { calculatePlates } = usePhysiology();
  
  // Uses default inventory defined in hook for now
  const { plates, remainingDelta } = useMemo(() => calculatePlates(targetWeight), [targetWeight, calculatePlates]);

  return (
    <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 mt-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-zinc-400 uppercase font-mono">Per Side Loading</span>
        <span className="text-xs text-brand-accent">Bar: 20kg</span>
      </div>
      
      {targetWeight < 20 ? (
        <p className="text-red-400 text-xs">Weight too low for bar</p>
      ) : (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
            {plates.length === 0 ? (
                <span className="text-zinc-500 text-sm italic">Empty Bar</span>
            ) : (
                plates.map((plate, idx) => (
                <div 
                    key={`${plate}-${idx}`} 
                    className={`
                    flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 text-[10px] font-bold shadow-md animate-in zoom-in duration-300
                    ${plate >= 20 ? 'border-red-600 bg-red-900/20 text-red-500' : ''}
                    ${plate === 15 ? 'border-yellow-600 bg-yellow-900/20 text-yellow-500' : ''}
                    ${plate === 10 ? 'border-green-600 bg-green-900/20 text-green-500' : ''}
                    ${plate < 10 ? 'border-zinc-500 bg-zinc-700 text-zinc-300' : ''}
                    `}
                >
                    {plate}
                </div>
                ))
            )}
            </div>
            
            {remainingDelta > 0.1 && (
                <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 p-2 rounded">
                    <AlertCircle size={14} />
                    <span>Missing {remainingDelta * 2}kg due to inventory limits</span>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PlateCalculator;
