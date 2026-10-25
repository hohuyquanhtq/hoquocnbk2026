import React, { useState, useEffect } from 'react';
import type {
  UserProfile,
  Quiz,
  QuizPublic,
  StudentAnswerMap,
  QuizAttempt
} from './types';
import { Header } from './components/common/Header';
import { ToastProvider, useToast } from './components/common/Toast';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherLoginForm } from './components/teacher/TeacherLoginForm';
import { CreateQuizModal } from './components/teacher/CreateQuizModal';
import { StudentPortal } from './components/student/StudentPortal';
import { ExamRoom } from './components/student/ExamRoom';
import { ExamResultView } from './components/student/ExamResultView';
import {
  getCurrentUser,
  removeStoredToken,
  apiSubmitExamAttempt
} from './services/api';

function MainApp() {
  const { showToast } = useToast();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<'student' | 'teacher'>('student');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Student flow state
  const [activeQuizCodeFromUrl, setActiveQuizCodeFromUrl] = useState<string | null>(null);
  const [activeExamQuiz, setActiveExamQuiz] = useState<QuizPublic | null>(null);
  const [activeStudentInfo, setActiveStudentInfo] = useState<{
    name: string;
    studentClass: string;
    school: string;
  } | null>(null);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [examResult, setExamResult] = useState<QuizAttempt | null>(null);

  // Teacher flow state
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // Check URL params for ?quiz=CODE or ?q=CODE
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizParam = urlParams.get('quiz') || urlParams.get('q');
    if (quizParam) {
      setActiveQuizCodeFromUrl(quizParam.toUpperCase());
      setCurrentTab('student');
    }
  }, []);

  // Restore authenticated teacher session from token
  useEffect(() => {
    const restoreSession = async () => {
      setIsLoadingAuth(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.warn('No active session found', err);
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    showToast('Đã đăng xuất tài khoản giáo viên thành công', 'info');
  };

  // Student starts taking exam
  const handleStartExam = (
    quiz: QuizPublic,
    studentInfo: { name: string; studentClass: string; school: string }
  ) => {
    setActiveExamQuiz(quiz);
    setActiveStudentInfo(studentInfo);
    setExamResult(null);
  };

  // Student submits exam
  const handleSubmitExam = async (studentAnswers: StudentAnswerMap, durationSeconds: number) => {
    if (!activeExamQuiz || !activeStudentInfo) return;

    setIsSubmittingExam(true);
    try {
      // Call backend API to grade and store attempt securely
      const attempt = await apiSubmitExamAttempt(activeExamQuiz.id, {
        studentName: activeStudentInfo.name,
        studentClass: activeStudentInfo.studentClass,
        studentSchool: activeStudentInfo.school,
        answers: studentAnswers,
        durationSeconds
      });

      // Clean up session storage backup
      try {
        sessionStorage.removeItem(`exam_answers_${activeExamQuiz.id}`);
        sessionStorage.removeItem(`exam_remaining_${activeExamQuiz.id}`);
      } catch {
        // ignore
      }

      setExamResult(attempt);
      showToast('Đã nộp bài và chấm điểm tự động thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi chấm điểm hoặc lưu kết quả: ' + err.message, 'error');
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleRetakeExam = () => {
    setExamResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onTabChange={tab => {
          if (activeExamQuiz && !examResult) {
            if (!window.confirm('Bạn đang trong quá trình làm bài thi. Rời khỏi đây có thể làm gián đoạn bài làm. Bạn có chắc muốn chuyển trang không?')) {
              return;
            }
          }
          setCurrentTab(tab);
        }}
        user={user}
        onLogin={() => setCurrentTab('teacher')}
        onLogout={handleLogout}
        isLoadingAuth={isLoadingAuth}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'student' ? (
          <div>
            {examResult && activeExamQuiz ? (
              <ExamResultView
                attempt={examResult}
                quiz={activeExamQuiz}
                onRetake={handleRetakeExam}
              />
            ) : activeExamQuiz && activeStudentInfo ? (
              <ExamRoom
                quiz={activeExamQuiz}
                studentInfo={activeStudentInfo}
                onSubmit={handleSubmitExam}
                isSubmitting={isSubmittingExam}
              />
            ) : (
              <StudentPortal
                initialQuizCode={activeQuizCodeFromUrl}
                onStartExam={handleStartExam}
              />
            )}
          </div>
        ) : (
          /* Teacher Tab */
          <div>
            {!user ? (
              <TeacherLoginForm onLoginSuccess={setUser} />
            ) : user.role === 'pending' ? (
              <div className="max-w-lg mx-auto my-12 bg-white p-8 rounded-3xl border border-amber-200 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <span className="font-bold text-amber-700 text-xl">!</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Tài khoản đang chờ phê duyệt</h3>
                <p className="text-xs text-slate-600">
                  Tài khoản ({user.displayName}) đang chờ quản trị viên kích hoạt. Vui lòng liên hệ quản trị viên trường học của bạn.
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <TeacherDashboard
                user={user}
                onCreateQuiz={() => {
                  setEditingQuiz(null);
                  setShowCreateQuizModal(true);
                }}
                onOpenAsStudent={code => {
                  setActiveQuizCodeFromUrl(code);
                  setActiveExamQuiz(null);
                  setExamResult(null);
                  setCurrentTab('student');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Create / Edit Quiz Modal */}
      {showCreateQuizModal && user && (
        <CreateQuizModal
          user={user}
          initialQuiz={editingQuiz}
          onClose={() => setShowCreateQuizModal(false)}
          onSuccess={() => {
            setShowCreateQuizModal(false);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 EduQuiz Online — Hệ Thống Tạo Đề Nhanh &amp; Thi Trắc Nghiệm Trực Tuyến Dùng Chung Cộng Đồng.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Bảo mật Cloud Firestore</span>
            <span>•</span>
            <span>Chấm điểm tự động</span>
            <span>•</span>
            <span>Đăng nhập nội bộ an toàn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
