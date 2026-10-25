import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  KeyRound,
  User,
  School,
  Clock,
  BookOpen,
  ArrowRight,
  Search,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import type { QuizPublic } from '../../types';
import { getPublicQuizByCodeOrId } from '../../firebase/firestoreService';
import { useToast } from '../common/Toast';

interface StudentPortalProps {
  initialQuizCode?: string | null;
  onStartExam: (
    quiz: QuizPublic,
    studentInfo: { name: string; studentClass: string; school: string }
  ) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  initialQuizCode,
  onStartExam,
}) => {
  const { showToast } = useToast();
  const [quizCodeInput, setQuizCodeInput] = useState(initialQuizCode || '');
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [loadedQuiz, setLoadedQuiz] = useState<QuizPublic | null>(null);

  // Student form
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto load quiz if URL code provided
  useEffect(() => {
    if (initialQuizCode) {
      handleSearchQuiz(initialQuizCode);
    }
  }, [initialQuizCode]);

  const handleSearchQuiz = async (codeToSearch: string) => {
    const code = codeToSearch.trim().toUpperCase();
    if (!code) {
      showToast('Vui lòng nhập mã đề thi', 'error');
      return;
    }

    setIsLoadingQuiz(true);
    setErrorMessage(null);

    try {
      const quiz = await getPublicQuizByCodeOrId(code);
      if (!quiz) {
        setErrorMessage(`Không tìm thấy đề thi với mã "${code}". Vui lòng kiểm tra lại mã hoặc hỏi giáo viên.`);
        setLoadedQuiz(null);
      } else if (quiz.status === 'closed') {
        setErrorMessage('Bài thi này hiện đã đóng hoặc đã hết thời gian cho phép làm bài.');
        setLoadedQuiz(null);
      } else {
        setLoadedQuiz(quiz);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleEnterExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadedQuiz) return;

    if (!studentName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên của bạn.');
      return;
    }
    if (!studentClass.trim()) {
      setErrorMessage('Vui lòng nhập Lớp học của bạn.');
      return;
    }

    // Verify Password if quiz has password
    if (loadedQuiz.hasPassword) {
      // In production, we compare the entered password
      // Since quizPublic contains password metadata or verification
      const expectedPassword = loadedQuiz.passwordPlain || '';
      if (expectedPassword && passwordInput.trim() !== expectedPassword.trim()) {
        setErrorMessage('Mật khẩu bài thi không chính xác. Vui lòng kiểm tra lại.');
        return;
      }
    }

    onStartExam(loadedQuiz, {
      name: studentName.trim(),
      studentClass: studentClass.trim(),
      school: studentSchool.trim(),
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
          Phòng Thi Trắc Nghiệm Trực Tuyến
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Nhập mã đề hoặc làm bài trực tiếp theo link giáo viên gửi. Không cần đăng nhập tài khoản.
        </p>
      </div>

      {/* Step 1: Code Search if not yet loaded */}
      {!loadedQuiz && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nhập mã đề thi trắc nghiệm (6 ký tự)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={16}
                  value={quizCodeInput}
                  onChange={e => setQuizCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: QZ8A39"
                  className="w-full pl-10 pr-4 py-3 text-base font-mono font-bold tracking-wider uppercase border border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-hidden"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="button"
                disabled={isLoadingQuiz}
                onClick={() => handleSearchQuiz(quizCodeInput)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isLoadingQuiz ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Tìm đề thi</span>
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Mẹo: Nếu bạn nhấn vào link do thầy cô gửi qua Zalo/Facebook, mã đề sẽ tự động điền sẵn.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Fill Student Info & Password to Enter */}
      {loadedQuiz && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Quiz Header Banner */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold uppercase bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                Mã đề: {loadedQuiz.code}
              </span>
              <button
                type="button"
                onClick={() => {
                  setLoadedQuiz(null);
                  setErrorMessage(null);
                }}
                className="text-xs text-blue-100 hover:text-white underline"
              >
                Đổi mã đề khác
              </button>
            </div>
            <h2 className="text-xl font-bold leading-snug">{loadedQuiz.title}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-blue-100">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {loadedQuiz.subject} ({loadedQuiz.grade})
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {loadedQuiz.durationMinutes} phút
              </span>
              <span>•</span>
              <span>{loadedQuiz.questionsCount} câu hỏi</span>
              <span>•</span>
              <span>GV: {loadedQuiz.teacherName}</span>
            </div>
          </div>

          {/* Student Entrance Form */}
          <form onSubmit={handleEnterExam} className="p-6 sm:p-8 space-y-5">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Thông tin học sinh làm bài</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lớp học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentClass}
                  onChange={e => setStudentClass(e.target.value)}
                  placeholder="Ví dụ: 12A1"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trường (Không bắt buộc)
                </label>
                <input
                  type="text"
                  value={studentSchool}
                  onChange={e => setStudentSchool(e.target.value)}
                  placeholder="Ví dụ: THPT Chuyên"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Password if required */}
            {loadedQuiz.hasPassword && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu bài thi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu do thầy/cô cung cấp"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Đề thi này được bảo vệ bởi mật khẩu.</p>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Threshold Notice */}
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/70 text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Quy định xem đáp án &amp; lời giải:
              </p>
              <p className="text-blue-800">
                Sau khi nộp bài, chỉ những bài thi đạt từ{' '}
                <strong>{loadedQuiz.minScoreToViewAnswers} / {loadedQuiz.totalPoints || 10} điểm</strong>{' '}
                mới được mở xem đáp án đúng và hướng dẫn giải chi tiết.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <span>Vào Làm Bài Thi Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
