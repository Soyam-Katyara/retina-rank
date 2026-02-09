import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ViolationWarningModalProps {
  open: boolean;
  onConfirm: () => void;
}

export const ViolationWarningModal = ({
  open,
  onConfirm,
}: ViolationWarningModalProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm">
        <div className="flex items-center justify-center gap-3 py-6">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
          <div className="text-center flex-1">
            <p className="text-lg font-semibold text-foreground">
              Quiz Violation Detected
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your account has been flagged. This incident will be recorded.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="w-full"
          >
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
