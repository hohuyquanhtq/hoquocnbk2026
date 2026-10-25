import type { Question, StudentAnswerMap, QuizAttempt, Quiz } from '../types';

export interface GradingResult {
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  passedThreshold: boolean;
  canViewAnswers: boolean;
  gradedQuestions: {
    id: string;
    isCorrect: boolean;
    studentAnswer: any;
    correctAnswers?: string[];
    explanation?: string;
    pointsEarned: number;
    maxPoints: number;
  }[];
}

/**
 * Robust grading function for student submissions
 */
export function gradeSubmission(
  questions: Question[],
  studentAnswers: StudentAnswerMap,
  quizConfig: {
    totalPoints: number;
    minScoreToViewAnswers: number;
    allowViewAnswers: boolean;
    allowViewExplanation: boolean;
  }
): GradingResult {
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  // Calculate sum of base question points
  const rawMaxPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  let rawEarnedPoints = 0;

  const gradedQuestions = questions.map(q => {
    const studentAns = studentAnswers[q.id];
    let isCorrect = false;
    let isUnanswered = false;

    if (studentAns === undefined || studentAns === null || studentAns === '') {
      isUnanswered = true;
      unansweredCount++;
    } else if (Array.isArray(studentAns) && studentAns.length === 0) {
      isUnanswered = true;
      unansweredCount++;
    }

    if (!isUnanswered) {
      if (q.type === 'single_choice') {
        const correct = (q.correctAnswers[0] || '').trim().toUpperCase();
        const given = String(studentAns).trim().toUpperCase();
        if (correct === given) {
          isCorrect = true;
        }
      } else if (q.type === 'multiple_choice') {
        const correctSet = new Set(q.correctAnswers.map(a => a.trim().toUpperCase()));
        const givenArr: string[] = Array.isArray(studentAns) ? studentAns : [String(studentAns)];
        const givenSet = new Set(givenArr.map(a => a.trim().toUpperCase()));

        // Exactly equal sets
        if (correctSet.size === givenSet.size && [...correctSet].every(item => givenSet.has(item))) {
          isCorrect = true;
        }
      } else if (q.type === 'short_answer') {
        const given = String(studentAns).trim().toLowerCase();
        isCorrect = q.correctAnswers.some(ans => ans.trim().toLowerCase() === given);
      } else if (q.type === 'true_false') {
        const correct = (q.correctAnswers[0] || '').trim().toLowerCase();
        const given = String(studentAns).trim().toLowerCase();
        if (correct === given) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        correctCount++;
        rawEarnedPoints += q.points || 1;
      } else {
        wrongCount++;
      }
    }

    const qPoints = q.points || 1;
    const earned = isCorrect ? qPoints : 0;

    return {
      id: q.id,
      isCorrect,
      studentAnswer: studentAns ?? null,
      correctAnswers: q.correctAnswers,
      explanation: q.explanation || '',
      pointsEarned: earned,
      maxPoints: qPoints,
    };
  });

  // Scale score to quiz target scale (default 10)
  const targetScale = quizConfig.totalPoints || 10;
  const scaledScore = rawMaxPoints > 0 ? (rawEarnedPoints / rawMaxPoints) * targetScale : 0;
  const finalScore = Math.round(scaledScore * 10) / 10; // Round to 1 decimal place, e.g. 7.5

  const threshold = quizConfig.minScoreToViewAnswers ?? 7.0;
  const passedThreshold = finalScore >= threshold;
  const canViewAnswers = Boolean(quizConfig.allowViewAnswers && passedThreshold);

  // If student did not pass the threshold or view answers is turned off, strip correct answers & explanations from response!
  const sanitizedGradedQuestions = gradedQuestions.map(item => {
    if (canViewAnswers) {
      return item;
    }
    return {
      id: item.id,
      isCorrect: item.isCorrect,
      studentAnswer: item.studentAnswer,
      pointsEarned: item.pointsEarned,
      maxPoints: item.maxPoints,
      // Intentionally omit correctAnswers and explanation
    };
  });

  return {
    score: finalScore,
    maxScore: targetScale,
    correctCount,
    wrongCount,
    unansweredCount,
    passedThreshold,
    canViewAnswers,
    gradedQuestions: sanitizedGradedQuestions,
  };
}
