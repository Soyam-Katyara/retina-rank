import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InteractionLockScreenProps {
  show: boolean;
  reason: 'tab-switch' | 'fullscreen-exit' | 'time-limit';
}

export const InteractionLockScreen = ({ show, reason }: InteractionLockScreenProps) => {
  const navigate = useNavigate();

  if (!show) return null;

  const messages = {
    'tab-switch': {
      title: 'Quiz Submitted - Proctoring Violation',
      description: 'You did not return to the quiz within the allowed time. Your attempt has been automatically submitted. Further interaction is not permitted.',
      details: 'Switching tabs or minimizing the quiz window is not allowed. Your quiz has been submitted with your current progress.',
    },
    'fullscreen-exit': {
      title: 'Quiz Terminated - Fullscreen Violation',
      description: 'You exited fullscreen mode, which violates the quiz rules. Your attempt has been terminated.',
      details: 'Fullscreen mode is mandatory for this proctored assessment. Please contact support if you believe this was a mistake.',
    },
    'time-limit': {
      title: 'Quiz Time Limit Exceeded',
      description: 'The time allocated for this quiz has expired. Your attempt has been automatically submitted.',
      details: 'Your quiz was submitted with your current progress at the time limit.',
    },
  };

  const config = messages[reason];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-none">
      <div className="bg-card border-2 border-destructive rounded-2xl shadow-2xl p-8 max-w-md mx-4 pointer-events-auto">
        <div className="flex flex-col items-center text-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-destructive" />
          </div>

          {/* Alert Icon */}
          <AlertTriangle className="h-8 w-8 text-destructive mb-6" />

          {/* Title */}
          <h2 className="text-2xl font-bold text-destructive mb-3">
            {config.title}
          </h2>

          {/* Main Description */}
          <p className="text-base text-foreground font-medium mb-4">
            {config.description}
          </p>

          {/* Details */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6 text-sm text-muted-foreground">
            {config.details}
          </div>

          {/* Additional Info */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm">
            <p className="font-semibold text-foreground mb-2">What happens next?</p>
            <ul className="text-muted-foreground space-y-1 text-left">
              <li>✓ Your quiz has been submitted with your current progress</li>
              <li>✓ Your score and results will be reviewed</li>
              <li>✓ This incident may be flagged in your record</li>
            </ul>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="w-full py-6 text-base font-semibold border-2"
          >
            Go to Dashboard
          </Button>

          {/* Support Note */}
          <p className="text-xs text-muted-foreground mt-6">
            If you believe this is an error, please contact support with your quiz ID and timestamp.
          </p>
        </div>
      </div>
    </div>
  );
};
