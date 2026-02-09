import { useEffect } from 'react';
import { AlertTriangle, Maximize } from 'lucide-react';

interface FullscreenWarningProps {
  show: boolean;
  countdown: number;
  onReturn: () => void;
  onTimeoutComplete: () => void;
}

export const FullscreenWarning = ({ 
  show, 
  countdown, 
  onReturn, 
  onTimeoutComplete 
}: FullscreenWarningProps) => {
  useEffect(() => {
    if (show && countdown <= 0) {
      onTimeoutComplete();
    }
  }, [show, countdown, onTimeoutComplete]);

  if (!show) return null;

  const countdownColor = 
    countdown <= 3 ? 'bg-destructive text-destructive-foreground' :
    countdown <= 5 ? 'bg-warning text-warning-foreground' :
    'bg-orange-500 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border-2 border-destructive rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl animate-pulse">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-destructive mb-3">
          Fullscreen Required!
        </h2>

        <p className="text-muted-foreground mb-6 text-sm">
          You exited fullscreen mode. Returning to fullscreen will resume your quiz.
        </p>

        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-3 font-medium">
            Auto-submit in:
          </p>
          <div className={`${countdownColor} rounded-lg py-4 text-center font-mono text-4xl font-bold transition-colors duration-300`}>
            {countdown}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            seconds remaining
          </p>
        </div>

        <button
          onClick={onReturn}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg"
        >
          <Maximize className="h-5 w-5" />
          Return to Fullscreen
        </button>

        <p className="text-xs text-muted-foreground mt-4">
          ⚠️ Failure to return to fullscreen will auto-submit your quiz
        </p>
      </div>
    </div>
  );
};
