import { useRef, useState, useCallback, useEffect } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { FocusSnapshot, PerQuestionFocus, SessionFocusSummary } from '@/types/quiz';

// Landmark indices ported from eye-focus-level/focus-level.py
const LEFT_IRIS = [474, 475, 476, 477];
const RIGHT_IRIS = [469, 470, 471, 472];
const LEFT_EYE_INNER = 362;
const LEFT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 133;
const RIGHT_EYE_OUTER = 33;

const HISTORY_SIZE = 30;

// --- Core math functions ported from Python ---

function getIrisCenter(
  landmarks: { x: number; y: number }[],
  irisIndices: number[],
): [number, number] {
  let sumX = 0;
  let sumY = 0;
  for (const idx of irisIndices) {
    sumX += landmarks[idx].x;
    sumY += landmarks[idx].y;
  }
  return [sumX / irisIndices.length, sumY / irisIndices.length];
}

function calculateGazeRatio(
  irisCenter: [number, number],
  innerCorner: [number, number],
  outerCorner: [number, number],
): number {
  const eyeWidth = Math.sqrt(
    (outerCorner[0] - innerCorner[0]) ** 2 +
    (outerCorner[1] - innerCorner[1]) ** 2,
  );
  if (eyeWidth === 0) return 0.5;
  const irisToInner = Math.sqrt(
    (irisCenter[0] - innerCorner[0]) ** 2 +
    (irisCenter[1] - innerCorner[1]) ** 2,
  );
  return Math.max(0, Math.min(1, irisToInner / eyeWidth));
}

function calculateFocusLevel(leftRatio: number, rightRatio: number): number {
  const idealRatio = 0.5;
  const leftDeviation = Math.abs(leftRatio - idealRatio);
  const rightDeviation = Math.abs(rightRatio - idealRatio);
  const avgDeviation = (leftDeviation + rightDeviation) / 2;
  return Math.max(0, 1 - avgDeviation * 2.5) * 100;
}

function getFocusStatus(focusLevel: number): string {
  if (focusLevel >= 80) return 'HIGHLY FOCUSED';
  if (focusLevel >= 60) return 'FOCUSED';
  if (focusLevel >= 40) return 'PARTIALLY FOCUSED';
  if (focusLevel >= 20) return 'DISTRACTED';
  return 'NOT FOCUSED';
}

// --- Hook ---

export interface UseFocusTrackerReturn {
  isReady: boolean;
  isTracking: boolean;
  currentFocusLevel: number;
  currentFocusStatus: string;
  startTracking: (videoElement: HTMLVideoElement) => void;
  stopTracking: () => void;
  setCurrentQuestion: (questionNumber: number) => void;
  getSessionSummary: () => SessionFocusSummary;
  getPerQuestionData: () => PerQuestionFocus[];
}

export function useFocusTracker(): UseFocusTrackerReturn {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackingRef = useRef(false);

  // Per-question tracking
  const currentQuestionRef = useRef<number>(1);
  const questionDataRef = useRef<
    Map<number, { snapshots: FocusSnapshot[]; startTime: number }>
  >(new Map());

  // Smoothing buffer (like Python deque(maxlen=30))
  const focusHistoryRef = useRef<number[]>([]);

  const [isReady, setIsReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentFocusLevel, setCurrentFocusLevel] = useState(0);
  const [currentFocusStatus, setCurrentFocusStatus] = useState('NOT TRACKING');

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );
        if (cancelled) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        if (cancelled) return;

        faceLandmarkerRef.current = landmarker;
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize FaceLandmarker:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      faceLandmarkerRef.current?.close();
    };
  }, []);

  // Detection loop
  const detectFrame = useCallback(() => {
    if (!trackingRef.current || !faceLandmarkerRef.current || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    try {
      const results = faceLandmarkerRef.current.detectForVideo(
        video,
        performance.now(),
      );

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        const maxIdx = Math.max(...LEFT_IRIS, ...RIGHT_IRIS);

        if (landmarks.length > maxIdx) {
          const leftIrisCenter = getIrisCenter(landmarks, LEFT_IRIS);
          const rightIrisCenter = getIrisCenter(landmarks, RIGHT_IRIS);

          const leftInner: [number, number] = [
            landmarks[LEFT_EYE_INNER].x,
            landmarks[LEFT_EYE_INNER].y,
          ];
          const leftOuter: [number, number] = [
            landmarks[LEFT_EYE_OUTER].x,
            landmarks[LEFT_EYE_OUTER].y,
          ];
          const rightInner: [number, number] = [
            landmarks[RIGHT_EYE_INNER].x,
            landmarks[RIGHT_EYE_INNER].y,
          ];
          const rightOuter: [number, number] = [
            landmarks[RIGHT_EYE_OUTER].x,
            landmarks[RIGHT_EYE_OUTER].y,
          ];

          const leftRatio = calculateGazeRatio(leftIrisCenter, leftInner, leftOuter);
          const rightRatio = calculateGazeRatio(rightIrisCenter, rightInner, rightOuter);
          const focus = calculateFocusLevel(leftRatio, rightRatio);

          // Smoothing
          focusHistoryRef.current.push(focus);
          if (focusHistoryRef.current.length > HISTORY_SIZE) {
            focusHistoryRef.current.shift();
          }
          const smoothed =
            focusHistoryRef.current.reduce((a, b) => a + b, 0) /
            focusHistoryRef.current.length;

          setCurrentFocusLevel(smoothed);
          setCurrentFocusStatus(getFocusStatus(smoothed));

          // Record snapshot for current question
          const qNum = currentQuestionRef.current;
          if (!questionDataRef.current.has(qNum)) {
            questionDataRef.current.set(qNum, {
              snapshots: [],
              startTime: Date.now(),
            });
          }
          questionDataRef.current.get(qNum)!.snapshots.push({
            timestamp: Date.now(),
            focusLevel: smoothed,
            leftGazeRatio: leftRatio,
            rightGazeRatio: rightRatio,
          });
        }
      }
    } catch {
      // Silently handle detection errors to keep the loop running
    }

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  }, []);

  const startTracking = useCallback(
    (videoElement: HTMLVideoElement) => {
      videoRef.current = videoElement;
      trackingRef.current = true;
      setIsTracking(true);
      focusHistoryRef.current = [];
      questionDataRef.current.clear();
      animationFrameRef.current = requestAnimationFrame(detectFrame);
    },
    [detectFrame],
  );

  const stopTracking = useCallback(() => {
    trackingRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);
    setIsTracking(false);
  }, []);

  const setCurrentQuestion = useCallback((questionNumber: number) => {
    currentQuestionRef.current = questionNumber;
  }, []);

  const getPerQuestionData = useCallback((): PerQuestionFocus[] => {
    const result: PerQuestionFocus[] = [];
    questionDataRef.current.forEach((data, qNum) => {
      const { snapshots } = data;
      if (snapshots.length === 0) return;

      const avgFocus =
        snapshots.reduce((sum, s) => sum + s.focusLevel, 0) / snapshots.length;
      const timeSpent =
        snapshots[snapshots.length - 1].timestamp - data.startTime;
      const avgDeviation =
        snapshots.reduce((sum, s) => {
          const leftDev = Math.abs(s.leftGazeRatio - 0.5);
          const rightDev = Math.abs(s.rightGazeRatio - 0.5);
          return sum + (leftDev + rightDev) / 2;
        }, 0) / snapshots.length;

      result.push({
        questionNumber: qNum,
        averageFocusPercent: Math.round(avgFocus * 10) / 10,
        timeSpentMs: timeSpent,
        gazeDeviationAvg: Math.round(avgDeviation * 1000) / 1000,
        focusStatus: getFocusStatus(avgFocus),
        snapshots,
      });
    });
    return result.sort((a, b) => a.questionNumber - b.questionNumber);
  }, []);

  const getSessionSummary = useCallback((): SessionFocusSummary => {
    const perQuestion = getPerQuestionData();
    const allSnapshots = perQuestion.flatMap((q) => q.snapshots);
    const totalDuration = perQuestion.reduce(
      (sum, q) => sum + q.timeSpentMs,
      0,
    );
    const overallFocus =
      allSnapshots.length > 0
        ? allSnapshots.reduce((sum, s) => sum + s.focusLevel, 0) /
          allSnapshots.length
        : 0;
    const focusedSnapshots = allSnapshots.filter((s) => s.focusLevel >= 60);
    const focusedTime =
      totalDuration *
      (focusedSnapshots.length / Math.max(allSnapshots.length, 1));

    return {
      totalDurationMs: totalDuration,
      overallFocusPercent: Math.round(overallFocus * 10) / 10,
      totalFocusedTimeMs: Math.round(focusedTime),
      perQuestion,
    };
  }, [getPerQuestionData]);

  return {
    isReady,
    isTracking,
    currentFocusLevel,
    currentFocusStatus,
    startTracking,
    stopTracking,
    setCurrentQuestion,
    getSessionSummary,
    getPerQuestionData,
  };
}
