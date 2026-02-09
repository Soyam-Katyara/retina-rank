import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface TabSwitchWarningProps {
  show: boolean;
  countdown: number;
  onReturn: () => void;
  onTimeoutComplete: () => void;
}

export const TabSwitchWarning = ({ show, countdown, onReturn, onTimeoutComplete }: TabSwitchWarningProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  useEffect(() => {
    if (countdown === 0 && show) {
      onTimeoutComplete();
    }
  }, [countdown, show, onTimeoutComplete]);

  if (!isVisible) return null;

  const progress = ((10 - countdown) / 10) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border-2 border-destructive rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-pulse">
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-6 animate-pulse">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-destructive mb-3">
            Return to Quiz!
          </h2>

          {/* Message */}
          <p className="text-muted-foreground mb-8">
            You've left the quiz window. Return within {countdown} seconds or your attempt will be automatically submitted/terminated.
          </p>

          {/* Countdown Display */}
          <div className="mb-8">
            <div className="text-6xl font-bold text-destructive tabular-nums">
              {countdown}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              seconds remaining
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-r from-destructive to-orange-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Return Button */}
          <button
            onClick={onReturn}
            className="w-full px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="h-5 w-5" />
            Return to Quiz
          </button>

          {/* Warning Text */}
          <p className="text-xs text-destructive mt-6 italic">
            ⚠️ Leaving again will result in automatic quiz submission and interaction lock.
          </p>
        </div>
      </div>
    </div>
  );
};
