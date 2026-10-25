import React, { useState } from 'react';
import { X, CheckCircle, ArrowLeft, ArrowRight, Eye, Send, AlertTriangle } from 'lucide-react';
import type { Quiz, Question, QuizDetail, QuizPublic, UserProfile } from '../../types';
import { WordUploader } from './WordUploader';
import { QuestionEditor } from './QuestionEditor';
import { QuizSettingsForm } from './QuizSettingsForm';
import { saveQuiz } from '../../firebase/firestoreService';
import { useToast } from '../common/Toast';

interface CreateQuizModalProps {
  user: UserProfile;
  initialQuiz?: Quiz | null;
  initialQuestions?: Question[];
  onClose: () => void;
  onSuccess: (savedQuiz: Quiz) => void;
}

export const CreateQuizModal: React.FC<CreateQuizModalProps> = ({
  user,
  initialQuiz,
  initialQuestions,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(initialQuestions && initialQuestions.length > 0 ? 2 : 1);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewStudentMode, setPreviewStudentMode] = useState(false);

  // Random 6-char unique code for the quiz e.g. QZ8A39
  const generateQuizCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const [settings, setSettings] = useState<Partial<Quiz>>({
    id: initialQuiz?.id || `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: initialQuiz?.code || generateQuizCode(),
    title: initialQuiz?.title || 'Đề kiểm tra trắc nghiệm',
    subject: initialQuiz?.subject || 'Hóa học',
    grade: initialQuiz?.grade || 'Lớp 12',
    durationMinutes: initialQuiz?.durationMinutes || 45,
    password: initialQuiz?.password || '',
    hasPassword: initialQuiz?.hasPassword || false,
    maxAttempts: initialQuiz?.maxAttempts ?? 1,
    totalPoints: initialQuiz?.totalPoints || 10,
    shuffleQuestions: initialQuiz?.shuffleQuestions ?? true,
    shuffleOptions: initialQuiz?.shuffleOptions ?? true,
    showScoreImmediately: initialQuiz?.showScoreImmediately ?? true,
    allowViewAnswers: initialQuiz?.allowViewAnswers ?? true,
    minScoreToViewAnswers: initialQuiz?.minScoreToViewAnswers ?? 7.0,
    allowViewExplanation: initialQuiz?.allowViewExplanation ?? true,
    allowRetake: initialQuiz?.allowRetake ?? false,
    maxParticipants: initialQuiz?.maxParticipants || 0,
    status: 'published',
  });

  const steps = [
    { num: 1, title: 'Tải đề Word (.docx)' },
    { num: 2, title: 'Kiểm tra & Sửa câu hỏi' },
    { num: 3, title: 'Cấu hình bài thi' },
  ];

  const handlePublish = async (status: 'published' | 'draft') => {
    // Validation
    if (!settings.title?.trim()) {
      showToast('Vui lòng nhập tên đề thi', 'error');
      setCurrentStep(3);
      return;
    }

    if (questions.length === 0) {
      showToast('Đề thi chưa có câu hỏi nào. Vui lòng tải file hoặc thêm câu hỏi.', 'error');
      setCurrentStep(1);
      return;
    }

    // Check if any question missing answer
    const missingAnswers = questions.filter(
      q => (!q.correctAnswers || q.correctAnswers.length === 0) && q.type !== 'short_answer'
    );
    if (missingAnswers.length > 0 && status === 'published') {
      const confirmContinue = window.confirm(
        `Có ${missingAnswers.length} câu hỏi chưa được chọn đáp án đúng. Bạn có chắc muốn tiếp tục phát hành không? (Nên bổ sung đáp án trước khi phát hành)`
      );
      if (!confirmContinue) {
        setCurrentStep(2);
        return;
      }
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const quizId = settings.id || `quiz_${Date.now()}`;
    const quizCode = settings.code || generateQuizCode();

    const fullQuiz: Quiz = {
      id: quizId,
      code: quizCode,
      title: settings.title.trim(),
      subject: settings.subject || 'Tổng hợp',
      grade: settings.grade || 'Toàn trường',
      teacherId: user.uid,
      teacherName: user.displayName || 'Giáo viên',
      teacherEmail: user.email || '',
      status,
      durationMinutes: settings.durationMinutes || 45,
      password: settings.password?.trim() || '',
      hasPassword: Boolean(settings.password && settings.password.trim().length > 0),
      maxAttempts: settings.maxAttempts ?? 1,
      totalPoints: settings.totalPoints || 10,
      shuffleQuestions: Boolean(settings.shuffleQuestions),
      shuffleOptions: Boolean(settings.shuffleOptions),
      showScoreImmediately: Boolean(settings.showScoreImmediately),
      allowViewAnswers: Boolean(settings.allowViewAnswers),
      minScoreToViewAnswers: Number(settings.minScoreToViewAnswers ?? 7.0),
      allowViewExplanation: Boolean(settings.allowViewExplanation),
      allowRetake: Boolean(settings.allowRetake),
      maxParticipants: Number(settings.maxParticipants || 0),
      questionsCount: questions.length,
      createdAt: initialQuiz?.createdAt || now,
      updatedAt: now,
    };

    const quizDetail: QuizDetail = {
      quizId,
      teacherId: user.uid,
      questions,
      updatedAt: now,
    };

    // Public sanitized version for students without answers & solutions!
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      order: q.order,
      content: q.content,
      type: q.type,
      options: q.options,
      points: q.points || 1,
    }));

    const quizPublic: QuizPublic = {
      id: quizId,
      code: quizCode,
      title: fullQuiz.title,
      subject: fullQuiz.subject,
      grade: fullQuiz.grade,
      teacherName: fullQuiz.teacherName,
      status,
      durationMinutes: fullQuiz.durationMinutes,
      hasPassword: fullQuiz.hasPassword,
      totalPoints: fullQuiz.totalPoints,
      shuffleQuestions: fullQuiz.shuffleQuestions,
      shuffleOptions: fullQuiz.shuffleOptions,
      showScoreImmediately: fullQuiz.showScoreImmediately,
      allowViewAnswers: fullQuiz.allowViewAnswers,
      minScoreToViewAnswers: fullQuiz.minScoreToViewAnswers,
      allowViewExplanation: fullQuiz.allowViewExplanation,
      allowRetake: fullQuiz.allowRetake,
      questionsCount: questions.length,
      questionsSanitized: sanitizedQuestions,
      updatedAt: now,
    };

    try {
      await saveQuiz(fullQuiz, quizDetail, quizPublic);
      showToast(status === 'published' ? 'Phát hành đề thi thành công!' : 'Đã lưu bản nháp đề thi!', 'success');
      onSuccess(fullQuiz);
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi lưu đề thi lên máy chủ: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] my-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Tạo đề thi trắc nghiệm từ file Word</h3>
            <p className="text-xs text-slate-500">Quy trình 3 bước tự động đọc, kiểm tra và phát hành link thi</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-center gap-4 sm:gap-8">
          {steps.map(step => (
            <div
              key={step.num}
              onClick={() => {
                if (questions.length > 0 || step.num === 1) {
                  setCurrentStep(step.num);
                }
              }}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                currentStep === step.num
                  ? 'text-blue-600 font-bold'
                  : currentStep > step.num
                  ? 'text-emerald-600 font-medium'
                  : 'text-slate-400 font-medium'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                  currentStep === step.num
                    ? 'bg-blue-600 text-white shadow-xs'
                    : currentStep > step.num
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {currentStep > step.num ? <CheckCircle className="w-4 h-4" /> : step.num}
              </div>
              <span className="text-xs hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {currentStep === 1 && (
            <WordUploader
              onQuestionsLoaded={loaded => {
                setQuestions(loaded);
              }}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <QuestionEditor
              questions={questions}
              onChange={setQuestions}
            />
          )}

          {currentStep === 3 && (
            <QuizSettingsForm
              settings={settings}
              onChange={setSettings}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium"
              >
                Hủy bỏ
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <span>Tiếp tục: Cấu hình bài thi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handlePublish('draft')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Lưu bản nháp
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handlePublish('published')}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Phát hành đề thi &amp; Lấy link</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
