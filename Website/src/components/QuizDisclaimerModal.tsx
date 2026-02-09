import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Monitor, Eye, Hand, Camera } from 'lucide-react';

interface QuizDisclaimerModalProps {
  open: boolean;
  onAccept: (stream: MediaStream | null) => void;
  onCancel: () => void;
}

export const QuizDisclaimerModal = ({ open, onAccept, onCancel }: QuizDisclaimerModalProps) => {
  const handleAcceptClick = () => {
    // Simply accept disclaimer - camera will be requested in QuizInterface useEffect
    console.log('Disclaimer accepted - camera will be requested when quiz starts');
    onAccept(null);
  };

  const handleCancel = () => {
    console.log('Disclaimer cancelled');
    onCancel();
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && open) {
        handleCancel();
      }
    }}>
      <AlertDialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Quiz Proctoring Agreement
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base mt-2">
            Please read and accept the conditions before proceeding with the quiz.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto pr-4 space-y-4 py-4">
          {/* Camera Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold text-sm">Camera Access Required</h4>
              </div>
              
              <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-gray-700">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Camera className="h-8 w-8" />
                  <p className="text-sm text-center">Camera will be initialized when you start the quiz</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                ℹ️ After accepting these terms, you'll be asked to grant camera access. Camera is required to proceed with the quiz.
              </p>
            </div>
          </div>

          {/* Proctoring Guidelines */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex gap-3">
              <Monitor className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Fullscreen Mode Required</h4>
                <p className="text-sm text-muted-foreground">
                  The quiz must be taken in fullscreen mode. Exiting fullscreen will trigger a warning and may result in quiz termination.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
            <div className="flex gap-3">
              <Eye className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Tab Switching Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Switching tabs or minimizing the browser window is strictly monitored. A 10-second countdown will appear, allowing you to return to the quiz.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 border border-muted rounded-lg p-4">
            <div className="flex gap-3">
              <Hand className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Continuous Monitoring</h4>
                <p className="text-sm text-muted-foreground">
                  Live camera feed is required and will be monitored throughout the quiz. Your face must be visible at all times.
                </p>
                <p className="text-xs font-semibold text-destructive mt-2">
                  ⚠ Quiz cannot start without active camera stream
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">
              By clicking "I Understand & Accept", you agree to these proctoring conditions and acknowledge that violations may result in quiz disqualification.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Go Back
          </AlertDialogCancel>
          <Button 
            onClick={handleAcceptClick} 
            className="gradient-primary"
          >
            I Understand & Accept
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
