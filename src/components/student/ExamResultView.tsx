import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Clock,
  User,
  Calendar,
  Lock,
  Unlock,
  Check,
  X
} from 'lucide-react';
import type { QuizAttempt, QuizPublic } from '../../types';

interface ExamResultViewProps {
  attempt: QuizAttempt;
  quiz: QuizPublic;
  onRetake: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  attempt,
  quiz,
  onRetake,
}) => {
  const isPass = attempt.score >= (quiz.minScoreToViewAnswers || 5.0);
  const canViewAnswers = attempt.canViewAnswers;

  const durationMins = Math.floor(attempt.durationSeconds / 60);
  const durationSecs = attempt.durationSeconds % 60;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Result Card Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div
          className={`p-6 sm:p-8 text-center text-white ${
            isPass
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Award className="w-9 h-9 text-white" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-100">
            Kết quả bài thi trắc nghiệm
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">{quiz.title}</h2>

          <div className="mt-6 inline-flex items-baseline gap-2 bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/25">
            <span className="text-4xl sm:text-5xl font-black">{attempt.score}</span>
            <span className="text-lg sm:text-xl font-bold opacity-80">/ {attempt.maxScore}</span>
            <span className="text-xs font-semibold ml-2 opacity-90 uppercase">Điểm</span>
          </div>
        </div>

        {/* Student & Attempt details */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-xs text-slate-500 block">Thí sinh</span>
            <span className="font-bold text-slate-800 text-sm">{attempt.studentName}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Lớp</span>
            <span className="font-bold text-slate-800 text-sm">{attempt.studentClass}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Thời gian làm bài</span>
            <span className="font-bold text-slate-800 text-sm">
              {durationMins}m {durationSecs}s
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Thời điểm nộp</span>
            <span className="font-bold text-slate-800 text-xs">
              {new Date(attempt.submittedAt).toLocaleTimeString('vi-VN')}
            </span>
          </div>
        </div>

        {/* Question statistics counters */}
        <div className="p-6 grid grid-cols-3 gap-4 text-center bg-white">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span>{attempt.correctCount}</span>
            </div>
            <span className="text-xs text-emerald-800 font-medium">Câu đúng</span>
          </div>

          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
            <div className="flex items-center justify-center gap-1.5 text-rose-700 font-bold text-lg">
              <XCircle className="w-5 h-5" />
              <span>{attempt.wrongCount}</span>
            </div>
            <span className="text-xs text-rose-800 font-medium">Câu sai</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 font-bold text-lg">
              <HelpCircle className="w-5 h-5" />
              <span>{attempt.unansweredCount}</span>
            </div>
            <span className="text-xs text-slate-600 font-medium">Chưa làm</span>
          </div>
        </div>
      </div>

      {/* Threshold & Answer Access Status */}
      <div
        className={`p-5 rounded-3xl border flex items-start gap-4 ${
          canViewAnswers
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            canViewAnswers ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}
        >
          {canViewAnswers ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm">
            {canViewAnswers
              ? 'Chúc mừng! Bạn đã đạt ngưỡng điểm để mở khóa đáp án và lời giải chi tiết.'
              : `Chưa đạt ngưỡng xem đáp án (Yêu cầu tối thiểu: ${quiz.minScoreToViewAnswers} / ${attempt.maxScore} điểm)`}
          </h4>
          <p className="text-xs opacity-90 leading-relaxed">
            {canViewAnswers
              ? 'Hệ thống đã hiển thị chi tiết phương án đúng, phương án bạn đã chọn và lời giải thích từng câu ở bên dưới.'
              : 'Theo cấu hình bảo mật của giáo viên, chỉ những bạn đạt từ ngưỡng điểm trên mới được xem đáp án đúng và hướng dẫn giải. Bạn có thể ôn lại kiến thức và làm lại nếu được cho phép.'}
          </p>

          {!canViewAnswers && quiz.allowRetake && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRetake}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại bài thi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Questions (Only when canViewAnswers is true!) */}
      {canViewAnswers && attempt.gradedQuestions && attempt.gradedQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Xem lại bài thi &amp; Lời giải chi tiết</h3>

          {quiz.questionsSanitized.map((q, idx) => {
            const graded = attempt.gradedQuestions?.find(g => g.id === q.id);
            const isCorrect = graded?.isCorrect ?? false;
            const studentAns = graded?.studentAnswer;
            const correctAns = graded?.correctAnswers || [];
            const explanation = graded?.explanation || '';

            return (
              <div
                key={q.id}
                className={`p-6 rounded-3xl border bg-white shadow-xs space-y-4 ${
                  isCorrect ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-rose-200 ring-1 ring-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center text-white ${
                        isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">Câu {idx + 1}</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isCorrect ? 'ĐÚNG (+1đ)' : 'SAI (0đ)'}
                  </span>
                </div>

                <div className="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {q.content}
                </div>

                {/* Options List with Visual Feedback */}
                {q.type !== 'short_answer' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map(opt => {
                      const isOptionCorrect = correctAns.includes(opt.id);
                      const isOptionSelected =
                        Array.isArray(studentAns) ? studentAns.includes(opt.id) : studentAns === opt.id;

                      let badgeClass = 'border-slate-200 bg-slate-50/50 text-slate-700';
                      let icon = null;

                      if (isOptionCorrect && isOptionSelected) {
                        badgeClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                        icon = <Check className="w-4 h-4 text-emerald-600 shrink-0" />;
                      } else if (isOptionCorrect && !isOptionSelected) {
                        badgeClass = 'border-emerald-400 bg-emerald-50/70 text-emerald-900 font-medium';
                        icon = <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">Đáp án đúng</span>;
                      } else if (!isOptionCorrect && isOptionSelected) {
                        badgeClass = 'border-rose-400 bg-rose-50 text-rose-900 font-medium';
                        icon = <X className="w-4 h-4 text-rose-600 shrink-0" />;
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${badgeClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-white border border-slate-300 font-bold flex items-center justify-center shrink-0">
                              {opt.id}
                            </span>
                            <span>{opt.content}</span>
                          </div>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <p>
                      <strong>Câu trả lời của bạn:</strong> {studentAns || '(Chưa điền)'}
                    </p>
                    <p className="text-emerald-700 font-semibold">
                      <strong>Đáp án chuẩn:</strong> {correctAns.join(', ')}
                    </p>
                  </div>
                )}

                {/* Explanation Callout */}
                {explanation && (
                  <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs space-y-1">
                    <p className="font-bold text-blue-900 flex items-center gap-1.5">
                      <span>💡 Hướng dẫn giải chi tiết:</span>
                    </p>
                    <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">{explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Retake button bottom */}
      {quiz.allowRetake && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onRetake}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md"
          >
            Làm lại bài thi này
          </button>
        </div>
      )}
    </div>
  );
};
