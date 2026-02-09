import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { QuizQuestion } from '@/types/quiz';
import { ChevronLeft, ChevronRight, AlertTriangle, Camera, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { QuizDisclaimerModal } from '@/components/QuizDisclaimerModal';
import { TabSwitchWarning } from '@/components/TabSwitchWarning';
import { InteractionLockScreen } from '@/components/InteractionLockScreen';
import { WebcamPreview, WebcamPreviewHandle } from '@/components/WebcamPreview';
import { FullscreenWarning } from '@/components/FullscreenWarning';
import { useFocusTracker } from '@/hooks/useFocusTracker';
import { api } from '@/lib/api';
import { answersToBackendFormat } from '@/lib/quizTransformers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const QuizInterface = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Load quiz data from localStorage (stored by CreateQuiz)
  const storedQuizRaw = id ? localStorage.getItem(`quiz_data_${id}`) : null;
  const storedQuiz = storedQuizRaw ? JSON.parse(storedQuizRaw) : null;
  const quizQuestions: QuizQuestion[] = storedQuiz?.questions ?? [];
  const quizTitle: string = storedQuiz?.title ?? 'Quiz';
  const quizTimeLimit: number = (storedQuiz?.timeLimit ?? 15) * 60; // convert minutes → seconds
  const quizFormat: string = storedQuiz?.format ?? 'mixed';
  // Raw backend JSON + optional markdown kept for evaluation
  const rawBackendQuestions: any[] = storedQuiz?.rawBackendQuestions ?? [];
  const notesMarkdown: string | null = storedQuiz?.markdownContent ?? null;

  const webcamRef = useRef<WebcamPreviewHandle>(null);
  const tabSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const handleSubmitRef = useRef<() => void>(() => {});

  // Focus tracker
  const focusTracker = useFocusTracker();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeRemaining, setTimeRemaining] = useState(quizTimeLimit);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(10);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const fullscreenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [quizStartedAt, setQuizStartedAt] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [tabSwitchCountdown, setTabSwitchCountdown] = useState(10);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<'tab-switch' | 'fullscreen-exit' | 'time-limit'>('tab-switch');
  const [pageVisibility, setPageVisibility] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCameraError, setShowCameraError] = useState(false);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Guards — rendered AFTER all hooks to avoid violating rules of hooks
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-semibold mb-4">Quiz ID not found</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!storedQuiz || quizQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-6">
              No quiz data found. Please create a quiz first from the dashboard.
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safe page visibility initialization
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPageVisibility(!document.hidden);
    }
  }, []);

  // Request camera access AFTER disclaimer is accepted
  useEffect(() => {
    if (!disclaimerAccepted) return; // Wait for disclaimer acceptance
    
    let isMounted = true;
    let cameraRequested = false;

    const requestCamera = async () => {
      if (cameraRequested) return; // Prevent multiple requests
      cameraRequested = true;

      try {
        console.log('QuizInterface: Requesting camera access...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        console.log('QuizInterface: Camera stream received:', {
          id: stream.id,
          videoTracks: stream.getVideoTracks().length
        });

        if (!isMounted) {
          console.log('QuizInterface: Component unmounted, stopping stream');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Verify stream has active video tracks
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
          throw new Error('No video tracks available');
        }

        // Check if any tracks are ended
        if (videoTracks.some(track => track.readyState === 'ended')) {
          throw new Error('Video tracks are ended');
        }

        console.log('QuizInterface: Video tracks verified - storing stream');

        // Store stream for use throughout quiz
        cameraStreamRef.current = stream;
        setCameraStream(stream);

        // Start quiz after camera is ready
        setTimeout(() => {
          if (isMounted) {
            setHasStarted(true);
            toast.success('Quiz starting with live camera monitoring!');
            console.log('QuizInterface: Quiz started with camera');
          }
        }, 100);

      } catch (err: any) {
        if (!isMounted) return;

        console.error('QuizInterface: Camera request error:', err);
        
        let errorMessage = 'Camera access failed';
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please enable camera access in browser settings to proceed.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera device found. Please check your hardware.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is in use by another application. Please close it and try again.';
        }

        toast.error(errorMessage);
        setShowCameraError(true);
        
        // Reset disclaimer so user can try again
        setDisclaimerAccepted(false);
        setShowDisclaimer(false);
      }
    };

    // Start camera request after a small delay
    const timer = setTimeout(() => {
      requestCamera();
    }, 300);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [disclaimerAccepted]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        console.log('QuizInterface: Cleaning up camera stream on unmount');
        cameraStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.error('Error stopping track:', e);
          }
        });
        cameraStreamRef.current = null;
      }
    };
  }, []);

  // Start focus tracking when camera stream + MediaPipe model are both ready
  useEffect(() => {
    if (!hasStarted || !cameraStream || !focusTracker.isReady || focusTracker.isTracking) return;
    const videoEl = webcamRef.current?.getVideoElement();
    if (videoEl) {
      focusTracker.startTracking(videoEl);
    }
  }, [hasStarted, cameraStream, focusTracker.isReady]);

  // Update focus tracker when question changes
  useEffect(() => {
    if (focusTracker.isTracking) {
      focusTracker.setCurrentQuestion(currentIndex + 1);
    }
  }, [currentIndex, focusTracker.isTracking]);

  const currentQuestion = quizQuestions[currentIndex];

  const handleSubmit = useCallback(async () => {
    try {
      setIsEvaluating(true);

      // Stop focus tracking and get summary
      focusTracker.stopTracking();
      const focusSummary = focusTracker.getSessionSummary();

      const completedAt = new Date().toISOString();
      const totalPoints = quizQuestions.reduce((acc, q) => acc + q.points, 0);

      // Prepare answers in backend format
      const backendAnswers = answersToBackendFormat(answers, quizQuestions);

      // Call evaluation API
      let evaluationResults: { question_number: number; score: number }[] = [];
      try {
        const evalResponse = await api.evaluateQuiz({
          quiz_json: rawBackendQuestions,
          user_answers_json: backendAnswers,
          notes_markdown: notesMarkdown,
        });
        evaluationResults = evalResponse.results;
      } catch (evalErr: any) {
        console.error('Evaluation API failed:', evalErr);
        toast.error('Evaluation failed. Saving results without AI scoring.');
      }

      // Calculate weighted score from evaluation results
      let score = 0;
      evaluationResults.forEach(r => {
        const q = quizQuestions.find(q => parseInt(q.id) === r.question_number);
        if (q) {
          score += r.score * q.points;
        }
      });

      const resultPayload = {
        score: Math.round(score),
        totalPoints,
        percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
        focusTime: Math.round(focusSummary.overallFocusPercent),
        answers,
        questions: quizQuestions,
        startedAt: quizStartedAt,
        completedAt,
        evaluationResults,
        focusSummary,
      };

      localStorage.setItem('quiz_result', JSON.stringify(resultPayload));

      // Add to quiz history
      try {
        const raw = localStorage.getItem('quiz_history');
        const history = raw ? JSON.parse(raw) : [];
        history.unshift({
          id: `history-${Date.now()}`,
          quizId: id,
          quizTitle,
          quizType: quizFormat,
          startedAt: resultPayload.startedAt,
          completedAt: resultPayload.completedAt,
          score: resultPayload.score,
          totalPoints,
          percentage: resultPayload.percentage,
        });
        localStorage.setItem('quiz_history', JSON.stringify(history));
      } catch (err) {
        // ignore
      }

      if (typeof document !== 'undefined' && document.fullscreenElement) {
        try {
          document.exitFullscreen().catch(() => {});
        } catch (e) {
          // Ignore fullscreen errors
        }
      }

      // Clear any pending timers
      if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      navigate(`/results/${id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('An error occurred while submitting the quiz');
      setIsEvaluating(false);
    }
  }, [answers, navigate, quizStartedAt, id, quizTitle, quizFormat, quizQuestions, rawBackendQuestions, notesMarkdown, focusTracker]);

  // Keep ref in sync so timer can call latest handleSubmit without re-triggering the effect
  handleSubmitRef.current = handleSubmit;

  const enterFullscreen = async () => {
    try {
      if (typeof document === 'undefined' || !document.documentElement) {
        toast.error('Browser APIs unavailable');
        return;
      }
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      // Show disclaimer before starting
      setShowDisclaimer(true);
      toast.success('Fullscreen enabled');
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      if (errorMsg.includes('fullscreen')) {
        toast.error('Fullscreen is required to start the quiz. Please try again.');
      } else if (errorMsg.includes('Permission')) {
        toast.error('Fullscreen permission denied');
      } else {
        toast.error('Failed to enter fullscreen');
      }
      setIsFullscreen(false);
    }
  };

  // Handle disclaimer acceptance - just close the modal
  const handleDisclaimerAccept = () => {
    console.log('Disclaimer accepted - proceeding to camera request');
    setShowDisclaimer(false);
    setDisclaimerAccepted(true);
    setQuizStartedAt(new Date().toISOString());
  };

  const handleDisclaimerCancel = async () => {
    try {
      // Stop camera stream when canceling
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // Ignore track stop errors
          }
        });
      }
      setCameraStream(null);
      cameraStreamRef.current = null;
      setShowDisclaimer(false);
      
      // Safely exit fullscreen
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          // Ignore fullscreen exit errors
        }
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Disclaimer cancel error:', error);
      navigate('/dashboard');
    }
  };

  const handleCameraStreamError = () => {
    try {
      // Camera stream failed during quiz
      setIsLocked(true);
      setLockReason('tab-switch'); // reuse for camera error
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // Ignore track stop errors
          }
        });
      }
      setCameraStream(null);
      cameraStreamRef.current = null;
      
      // Auto-submit the quiz
      toast.error('Camera stream lost. Quiz is being terminated.');
      setTimeout(() => {
        handleSubmit();
      }, 500);
    } catch (error) {
      console.error('Camera error handler failed:', error);
      toast.error('An error occurred during the quiz');
    }
  };

  const handleForceExit = useCallback(() => {
    // Clean up fullscreen timeout
    if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
    if (fullscreenCountdownIntervalRef.current) clearInterval(fullscreenCountdownIntervalRef.current);
    
    toast.error('Quiz terminated due to fullscreen violation');
    setIsLocked(true);
    setLockReason('fullscreen-exit');
    if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setShowFullscreenWarning(false);
    setShowExitWarning(false);
    
    // Auto-submit the quiz
    setTimeout(() => {
      handleSubmit();
    }, 500);
  }, [handleSubmit]);

  // Check if quiz has ended (no more questions)
  useEffect(() => {
    if (hasStarted && currentIndex >= quizQuestions.length && quizQuestions.length > 0) {
      // Quiz has ended - auto submit
      setTimeout(() => {
        handleSubmit();
      }, 500);
    }
  }, [hasStarted, currentIndex, quizQuestions.length, handleSubmit]);

  // Enforce camera stream must be active during quiz
  useEffect(() => {
    if (!hasStarted) return;
    
    // If quiz started but no camera stream, lock the quiz
    if (!cameraStream) {
      setIsLocked(true);
      setLockReason('tab-switch');
      toast.error('Camera stream is required to continue. Quiz is locked.');
      setTimeout(() => {
        handleSubmit();
      }, 2000);
    }
  }, [hasStarted, cameraStream, handleSubmit]);

  // Enforce fullscreen when quiz has started
  useEffect(() => {
    if (!hasStarted || isLocked) return;

    // Check if fullscreen is active
    const checkFullscreen = async () => {
      if (typeof document === 'undefined') return;
      if (!document.fullscreenElement) {
        try {
          if (document.documentElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (err: any) {
          // Fullscreen request failed - this is normal if user denies
          if (!err?.message?.includes('Permission')) {
            console.log('Fullscreen reactivation failed');
          }
        }
      }
    };

    const fullscreenCheckInterval = setInterval(() => {
      checkFullscreen();
    }, 500);

    return () => clearInterval(fullscreenCheckInterval);
  }, [hasStarted, isLocked]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      try {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (e) {
              // Ignore individual track stop errors
            }
          });
        }
      } catch (e) {
        console.error('Camera cleanup error:', e);
      }
      
      // Cleanup fullscreen timers
      if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
      if (fullscreenCountdownIntervalRef.current) clearInterval(fullscreenCountdownIntervalRef.current);
      if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Handle tab/visibility change - DISABLED for now to prevent immediate exit
  useEffect(() => {
    // Tab switch monitoring disabled temporarily
    return;
  }, []);

  // Handle fullscreen exit with 10-second countdown
  useEffect(() => {
    if (!hasStarted || isLocked) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && hasStarted) {
        // User exited fullscreen - start countdown
        setShowFullscreenWarning(true);
        setFullscreenCountdown(10);

        // Clear existing timeout if any
        if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
        if (fullscreenCountdownIntervalRef.current) clearInterval(fullscreenCountdownIntervalRef.current);

        // Start 10-second countdown
        let remaining = 10;
        fullscreenCountdownIntervalRef.current = setInterval(() => {
          remaining -= 1;
          setFullscreenCountdown(remaining);

          if (remaining <= 0) {
            // Auto-submit quiz
            if (fullscreenCountdownIntervalRef.current) clearInterval(fullscreenCountdownIntervalRef.current);
            setShowFullscreenWarning(false);
            handleForceExit();
          }
        }, 1000);

        // Also set a timeout as backup
        fullscreenTimeoutRef.current = setTimeout(() => {
          if (fullscreenCountdownIntervalRef.current) clearInterval(fullscreenCountdownIntervalRef.current);
          setShowFullscreenWarning(false);
          handleForceExit();
        }, 10000);
      } else if (document.fullscreenElement && hasStarted) {
        // User returned to fullscreen
        if (showFullscreenWarning) {
          if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
          if (fullscreenCountdownIntervalRef.current) clearInterval(fullscreenCountdownIntervalRef.current);
          setShowFullscreenWarning(false);
          setFullscreenCountdown(10);
          toast.success('Fullscreen restored - Quiz resumed');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      }
    };
  }, [hasStarted, isLocked, showFullscreenWarning, handleForceExit]);

  // Timer countdown — uses ref so the interval never resets when answers change
  useEffect(() => {
    if (!hasStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMCQSelect = (optionIndex: number) => {
    try {
      if (currentQuestion && currentQuestion.id) {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
      }
    } catch (error) {
      console.error('Error selecting MCQ option:', error);
    }
  };

  const handleSubjectiveAnswer = (text: string) => {
    try {
      if (currentQuestion && currentQuestion.id) {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: text }));
      }
    } catch (error) {
      console.error('Error saving subjective answer:', error);
    }
  };

  if (!hasStarted) {
    return (
      <>
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-md">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">🚀 Ready to Start Your Quiz?</h2>
                <p className="text-muted-foreground mb-2 text-sm">
                  This quiz requires:
                </p>
                <ul className="text-muted-foreground text-sm mb-6 space-y-1">
                  <li>✓ Fullscreen mode</li>
                  <li>✓ Active camera stream</li>
                  <li>✓ Browser permissions granted</li>
                </ul>
                <p className="text-muted-foreground text-xs mb-6">
                  When you click start, you'll see the proctoring agreement. Please read it carefully before accepting. Camera activation is required.
                </p>
                <div className="flex flex-col gap-3">
                  <Button variant="default" size="lg" onClick={enterFullscreen} className="bg-blue-600 hover:bg-blue-700">
                    Enter Fullscreen & Start
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
                    Go Back
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  💡 Tip: Grant camera permission when the browser asks
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <QuizDisclaimerModal
          open={showDisclaimer}
          onAccept={handleDisclaimerAccept}
          onCancel={handleDisclaimerCancel}
        />
      </>
    );
  }

  // If quiz has started but no camera, show warning
  if (hasStarted && !cameraStream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Camera Required</h2>
            <p className="text-muted-foreground mb-6">
              Camera stream is required to take this quiz. Please grant camera permission and try again.
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="font-semibold">{quizTitle}</span>
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {quizQuestions.length}
              </span>
            </div>
            
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
              timeRemaining < 60 ? 'bg-destructive text-destructive-foreground animate-pulse' : 
              timeRemaining < 300 ? 'bg-warning text-warning-foreground' : 'bg-muted'
            }`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </header>

        {/* Fixed Camera Preview - Top Right Corner */}
        <WebcamPreview
          ref={webcamRef}
          stream={cameraStream}
          onStreamError={handleCameraStreamError}
          focusLevel={focusTracker.isTracking ? focusTracker.currentFocusLevel : undefined}
          focusStatus={focusTracker.isTracking ? focusTracker.currentFocusStatus : undefined}
        />

        {/* Question Content */}
        <main className="flex-1 container py-8 max-w-3xl">
          {!currentQuestion ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Quiz completed successfully!</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="animate-fade-in">
              <CardContent className="p-8">
                <div className="mb-2 text-sm text-muted-foreground">
                  {currentQuestion.type === 'mcq' ? 'Multiple Choice' : currentQuestion.type === 'bcq' ? 'True / False' : 'Written Response'} • {currentQuestion.points} points
                </div>

                <h2 className="text-xl font-semibold mb-8">
                  {currentQuestion.question}
                </h2>

                {(currentQuestion.type === 'mcq' || currentQuestion.type === 'bcq') && currentQuestion.options ? (
                  <div className={currentQuestion.type === 'bcq' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
                    {currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !isLocked && handleMCQSelect(idx)}
                        disabled={isLocked}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                          isLocked ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          answers[currentQuestion.id] === idx
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            answers[currentQuestion.id] === idx
                              ? 'gradient-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            {currentQuestion.type === 'bcq' ? (idx === 0 ? 'T' : 'F') : String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={(answers[currentQuestion.id] as string) || ''}
                    onChange={(e) => !isLocked && handleSubjectiveAnswer(e.target.value)}
                    disabled={isLocked}
                    rows={6}
                    className="resize-none"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </main>

        {/* Navigation Footer */}
        <footer className="sticky bottom-0 border-t bg-card/95 backdrop-blur">
          <div className="container flex items-center justify-between h-16">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0 || isLocked}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {/* Question Indicators */}
            <div className="flex gap-2">
              {quizQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => !isLocked && setCurrentIndex(idx)}
                  disabled={isLocked}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    idx === currentIndex
                      ? 'gradient-primary text-primary-foreground'
                      : answers[quizQuestions[idx].id] !== undefined
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {currentIndex === quizQuestions.length - 1 ? (
              <Button variant="success" onClick={handleSubmit} disabled={isLocked || isEvaluating}>
                {isEvaluating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Evaluating...</>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            ) : (
              <Button onClick={() => setCurrentIndex(prev => prev + 1)} disabled={isLocked}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </footer>

        {/* Fullscreen Warning with Countdown */}
        <FullscreenWarning
          show={showFullscreenWarning}
          countdown={fullscreenCountdown}
          onReturn={() => {
            if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
            if (fullscreenCountdownIntervalRef.current) clearInterval(fullscreenCountdownIntervalRef.current);
            setShowFullscreenWarning(false);
            setFullscreenCountdown(10);
            enterFullscreen();
          }}
          onTimeoutComplete={handleForceExit}
        />
      </div>

      {/* Tab Switch Warning */}
      <TabSwitchWarning
        show={showTabSwitchWarning}
        countdown={tabSwitchCountdown}
        onReturn={() => {
          if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setShowTabSwitchWarning(false);
          setTabSwitchCountdown(10);
          toast.success('Welcome back to the quiz');
        }}
        onTimeoutComplete={() => {
          setShowTabSwitchWarning(false);
          setIsLocked(true);
          setLockReason('tab-switch');
          toast.error('Quiz auto-submitted due to timeout');
          setTimeout(() => {
            handleSubmit();
          }, 500);
        }}
      />

      {/* Interaction Lock Screen */}
      <InteractionLockScreen show={isLocked} reason={lockReason} />

      {/* Evaluation Loading Overlay */}
      {isEvaluating && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Evaluating Your Answers...</h2>
            <p className="text-muted-foreground">AI is reviewing your responses. This may take a moment.</p>
          </div>
        </div>
      )}

      {/* Camera Error Dialog */}
      <AlertDialog open={showCameraError} onOpenChange={setShowCameraError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Camera className="h-5 w-5" />
              Camera Access Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              Camera access is mandatory to start the quiz. Please enable camera permissions in your browser settings and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowCameraError(false);
              navigate('/dashboard');
            }}>
              Return to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QuizInterface;
