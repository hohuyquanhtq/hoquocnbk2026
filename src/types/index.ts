export type UserRole = 'admin' | 'teacher' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D'
  content: string;
}

export interface Question {
  id: string;
  order: number;
  content: string;
  type: QuestionType;
  options: QuestionOption[];
  correctAnswers: string[]; // ['A'] or ['A', 'C'] or ['a:Đúng', 'b:Sai'] or ['3.14']
  explanation?: string;
  points: number; // default e.g. 1
  hasError?: boolean;
  errorMessage?: string;
}

// Sanitized version sent to students during test (NO correctAnswers, NO explanation)
export interface QuestionSanitized {
  id: string;
  order: number;
  content: string;
  type: QuestionType;
  options: QuestionOption[];
  points: number;
}

export interface Quiz {
  id: string;
  code: string; // Short code e.g. "QZ892A"
  title: string;
  subject: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  status: 'draft' | 'published' | 'closed';
  durationMinutes: number; // e.g. 45
  password?: string;
  hasPassword: boolean;
  maxAttempts: number; // 1 = only once, 0 = unlimited
  totalPoints: number; // default 10
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showScoreImmediately: boolean;
  allowViewAnswers: boolean;
  minScoreToViewAnswers: number; // e.g. 7.0 (out of 10)
  allowViewExplanation: boolean;
  allowRetake: boolean;
  maxParticipants?: number; // 0 = unlimited
  questionsCount: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizDetail {
  quizId: string;
  teacherId: string;
  questions: Question[];
  updatedAt: string;
}

export interface QuizPublic {
  id: string;
  code: string;
  title: string;
  subject: string;
  grade: string;
  teacherName: string;
  status: 'draft' | 'published' | 'closed';
  durationMinutes: number;
  hasPassword: boolean;
  passwordHash?: string;
  passwordPlain?: string; // Stored securely in public metadata or checked
  totalPoints: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showScoreImmediately: boolean;
  allowViewAnswers: boolean;
  minScoreToViewAnswers: number;
  allowViewExplanation: boolean;
  allowRetake: boolean;
  questionsCount: number;
  questionsSanitized: QuestionSanitized[];
  // Encrypted or hidden solution payload unlocked strictly when student completes test with threshold
  updatedAt: string;
}

export interface StudentAnswerMap {
  [questionId: string]: any; // string, string[], or boolean map
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizCode: string;
  quizTitle: string;
  teacherId: string;
  studentName: string;
  studentClass: string;
  studentSchool?: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  passedThreshold: boolean;
  canViewAnswers: boolean;
  studentAnswers: StudentAnswerMap;
  gradedQuestions?: {
    id: string;
    isCorrect: boolean;
    studentAnswer: any;
    correctAnswers?: string[];
    explanation?: string;
    pointsEarned: number;
    maxPoints: number;
  }[];
  status: 'submitted';
  createdAt: string;
}
