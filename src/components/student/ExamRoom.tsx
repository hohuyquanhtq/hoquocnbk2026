import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Flag
} from 'lucide-react';
import type { QuizPublic, QuestionSanitized, StudentAnswerMap } from '../../types';

interface ExamRoomProps {
  quiz: QuizPublic;
  studentInfo: {
    name: string;
    studentClass: string;
    school: string;
  };
  onSubmit: (answers: StudentAnswerMap, durationSeconds: number) => void;
  isSubmitting: boolean;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  quiz,
  studentInfo,
  onSubmit,
  isSubmitting,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswerMap>(() => {
    // Attempt to restore session backup
    try {
      const saved = sessionStorage.getItem(`exam_answers_${quiz.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const totalQuestions = quiz.questionsSanitized.length;
  const currentQuestion: QuestionSanitized = quiz.questionsSanitized[currentIndex];

  // Timer setup
  const totalDurationSeconds = quiz.durationMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    try {
      const savedTime = sessionStorage.getItem(`exam_remaining_${quiz.id}`);
      return savedTime ? parseInt(savedTime, 10) : totalDurationSeconds;
    } catch {
      return totalDurationSeconds;
    }
  });

  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const timerRef = useRef<any>(null);

  // Sync backup to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(`exam_answers_${quiz.id}`, JSON.stringify(answers));
      sessionStorage.setItem(`exam_remaining_${quiz.id}`, remainingSeconds.toString());
    } catch (e) {
      console.warn('Cannot write session storage', e);
    }
  }, [answers, remainingSeconds, quiz.id]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const handleAutoSubmit = () => {
    const elapsed = totalDurationSeconds;
    onSubmit(answers, elapsed);
  };

  const handleSelectOption = (questionId: string, optionId: string, type: string) => {
    if (type === 'multiple_choice') {
      const currentList: string[] = Array.isArray(answers[questionId]) ? answers[questionId] : [];
      const updated = currentList.includes(optionId)
        ? currentList.filter(id => id !== optionId)
        : [...currentList, optionId];
      setAnswers(prev => ({ ...prev, [questionId]: updated }));
    } else {
      // Single choice or True/False
      setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    }
  };

  const answeredCount = Object.keys(answers).filter(k => {
    const val = answers[k];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== null && val !== '';
  }).length;

  const unansweredCount = totalQuestions - answeredCount;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = remainingSeconds <= 300; // Under 5 minutes
  const isTimeUrgent = remainingSeconds <= 60; // Under 1 minute

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Sticky Top Bar: Title, Student, Timer, Submit */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
            {quiz.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="font-semibold text-slate-700">{studentInfo.name}</span>
            <span>-</span>
            <span>Lớp {studentInfo.studentClass}</span>
            <span>•</span>
            <span>Tiến độ: {answeredCount}/{totalQuestions} câu</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold border transition-all ${
              isTimeUrgent
                ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                : isTimeCritical
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowSubmitConfirmModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Area (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {currentQuestion && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              {/* Question Index & Type badge */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs">
                  Câu {currentIndex + 1} / {totalQuestions}
                </span>

                <span className="text-xs text-slate-500 font-medium">
                  {currentQuestion.type === 'multiple_choice'
                    ? 'Có thể chọn nhiều đáp án'
                    : currentQuestion.type === 'true_false'
                    ? 'Đúng / Sai'
                    : 'Chọn 1 đáp án đúng nhất'}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                {currentQuestion.content}
              </div>

              {/* Options */}
              {currentQuestion.type !== 'short_answer' ? (
                <div className="space-y-3">
                  {currentQuestion.options.map(opt => {
                    const studentAns = answers[currentQuestion.id];
                    const isSelected =
                      currentQuestion.type === 'multiple_choice'
                        ? Array.isArray(studentAns) && studentAns.includes(opt.id)
                        : studentAns === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id, currentQuestion.type)}
                        className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.id}
                        </div>
                        <span className="text-sm font-medium leading-normal flex-1">
                          {opt.content}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Nhập câu trả lời của bạn:</label>
                  <input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                    placeholder="Điền đáp án..."
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Navigation buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirmModal(true)}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <span>Hoàn thành &amp; Nộp bài</span>
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Question Palette (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Bảng câu hỏi ({answeredCount}/{totalQuestions})
            </h4>

            {/* Quick Palette Grid */}
            <div className="grid grid-cols-5 gap-2">
              {quiz.questionsSanitized.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered =
                  ans !== undefined &&
                  ans !== null &&
                  ans !== '' &&
                  (!Array.isArray(ans) || ans.length > 0);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 ring-offset-2'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-sm bg-blue-600" />
                <span>Đã làm ({answeredCount} câu)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-300" />
                <span>Chưa làm ({unansweredCount} câu)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-lg">Xác nhận nộp bài thi?</h3>
              <p className="text-xs text-slate-500">
                Bạn đã làm <strong>{answeredCount}</strong> / {totalQuestions} câu.
                {unansweredCount > 0 ? (
                  <span className="block text-amber-700 font-semibold mt-1">
                    Còn {unansweredCount} câu chưa chọn đáp án!
                  </span>
                ) : (
                  <span className="block text-emerald-600 font-semibold mt-1">
                    Bạn đã hoàn thành tất cả các câu hỏi!
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setShowSubmitConfirmModal(false);
                  const elapsed = totalDurationSeconds - remainingSeconds;
                  onSubmit(answers, elapsed);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Đang chấm điểm...' : 'Đồng ý nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
