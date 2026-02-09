export type QuizFormat = 'mcq' | 'subjective' | 'mixed';

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'subjective' | 'bcq';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  userAnswer?: string | number;
  isCorrect?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  format: QuizFormat;
  totalQuestions: number;
  timeLimit: number; // in minutes
  createdAt: Date;
  questions: QuizQuestion[];
  topic: string;
  subtopic: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  quizType: QuizFormat;
  quizImage?: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  score: number;
  totalPoints: number;
  percentage: number;
  focusTime: number; // percentage of time focused
  answers: {
    questionId: string;
    answer: string | number;
    isCorrect: boolean;
    timeTaken: number;
  }[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  createdAt: Date;
  avatarUrl?: string;
  isGoogleUser?: boolean;
}

export interface QuizCreationParams {
  title: string;
  timeLimit: number;
  format: QuizFormat;
  totalQuestions?: number;
  mcqCount?: number;
  mcqPoints?: number;
  subjectiveCount?: number;
  subjectivePoints?: number;
  bcqCount?: number;
  bcqPoints?: number;
  generationType: 'content' | 'ai';
  topic: string;
  subtopic: string;
  toDo?: string;
  toAvoid?: string;
  contentFile?: File;
}

export interface FocusSnapshot {
  timestamp: number;
  focusLevel: number;
  leftGazeRatio: number;
  rightGazeRatio: number;
}

export interface PerQuestionFocus {
  questionNumber: number;
  averageFocusPercent: number;
  timeSpentMs: number;
  gazeDeviationAvg: number;
  focusStatus: string;
  snapshots: FocusSnapshot[];
}

export interface SessionFocusSummary {
  totalDurationMs: number;
  overallFocusPercent: number;
  totalFocusedTimeMs: number;
  perQuestion: PerQuestionFocus[];
}
