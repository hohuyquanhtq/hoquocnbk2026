import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithPopup, googleProvider, signOut } from './firebase/config';
import {
  syncUserProfile,
  getUserProfile,
  getQuizDetail,
  submitQuizAttempt
} from './firebase/firestoreService';
import type {
  UserProfile,
  Quiz,
  QuizPublic,
  StudentAnswerMap,
  QuizAttempt,
  Question
} from './types';
import { Header } from './components/common/Header';
import { ToastProvider, useToast } from './components/common/Toast';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { CreateQuizModal } from './components/teacher/CreateQuizModal';
import { StudentPortal } from './components/student/StudentPortal';
import { ExamRoom } from './components/student/ExamRoom';
import { ExamResultView } from './components/student/ExamResultView';
import { gradeSubmission } from './utils/grading';
import { SAMPLE_CHEMISTRY_QUESTIONS } from './utils/sampleData';
import {
  BookOpen,
  GraduationCap,
  School,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

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

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      setIsLoadingAuth(true);
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          setUser(profile);
        } catch (err: any) {
          console.error('Error syncing user profile:', err);
          showToast('Lỗi đồng bộ thông tin giáo viên', 'error');
        }
      } else {
        setUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Login for Teachers
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile = await syncUserProfile({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
        setUser(profile);
        showToast(`Đăng nhập thành công! Xin chào ${profile.displayName}`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast('Đăng nhập Google thất bại: ' + err.message, 'error');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      showToast('Đã đăng xuất tài khoản', 'info');
    } catch (err: any) {
      console.error(err);
    }
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
      // 1. Fetch full questions with answers for grading from server / detail
      let fullQuestions: Question[] = [];
      const detail = await getQuizDetail(activeExamQuiz.id);
      if (detail && detail.questions) {
        fullQuestions = detail.questions;
      } else {
        // Fallback for sample demo questions if local test
        fullQuestions = SAMPLE_CHEMISTRY_QUESTIONS;
      }

      // 2. Grade submission with secure threshold calculation
      const graded = gradeSubmission(fullQuestions, studentAnswers, {
        totalPoints: activeExamQuiz.totalPoints || 10,
        minScoreToViewAnswers: activeExamQuiz.minScoreToViewAnswers ?? 7.0,
        allowViewAnswers: activeExamQuiz.allowViewAnswers ?? true,
        allowViewExplanation: activeExamQuiz.allowViewExplanation ?? true,
      });

      // 3. Create attempt record
      const now = new Date().toISOString();
      const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const attempt: QuizAttempt = {
        id: attemptId,
        quizId: activeExamQuiz.id,
        quizCode: activeExamQuiz.code,
        quizTitle: activeExamQuiz.title,
        teacherId: 'teacher_assigned',
        studentName: activeStudentInfo.name,
        studentClass: activeStudentInfo.studentClass,
        studentSchool: activeStudentInfo.school,
        startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
        submittedAt: now,
        durationSeconds,
        score: graded.score,
        maxScore: graded.maxScore,
        correctCount: graded.correctCount,
        wrongCount: graded.wrongCount,
        unansweredCount: graded.unansweredCount,
        passedThreshold: graded.passedThreshold,
        canViewAnswers: graded.canViewAnswers,
        studentAnswers,
        gradedQuestions: graded.gradedQuestions,
        status: 'submitted',
        createdAt: now,
      };

      // 4. Save attempt to Firestore so teacher sees results immediately
      await submitQuizAttempt(attempt);

      // Clean up session storage backup
      try {
        sessionStorage.removeItem(`exam_answers_${activeExamQuiz.id}`);
        sessionStorage.removeItem(`exam_remaining_${activeExamQuiz.id}`);
      } catch (e) {
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
        onLogin={handleLogin}
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
              <div className="max-w-lg mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <School className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Khu Vực Dành Cho Giáo Viên</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Đăng nhập tài khoản Google để tạo đề thi từ file Word (.docx), cấu hình bài thi và theo dõi kết quả học sinh.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs text-blue-900 text-left space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Chính sách phân quyền bảo mật:
                  </p>
                  <p className="text-blue-800">
                    Chỉ các tài khoản giáo viên được quản trị viên phê duyệt mới có quyền phát hành và quản lý đề thi. Học sinh không thể tự nâng quyền.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Đăng nhập với Google</span>
                </button>
              </div>
            ) : user.role === 'pending' ? (
              <div className="max-w-lg mx-auto my-12 bg-white p-8 rounded-3xl border border-amber-200 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Tài khoản đang chờ phê duyệt</h3>
                <p className="text-xs text-slate-600">
                  Tài khoản ({user.email}) của bạn đang chờ quản trị viên cấp quyền Giáo viên. Vui lòng liên hệ quản trị viên hệ thống để được kích hoạt quyền tạo đề.
                </p>
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
          onSuccess={savedQuiz => {
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
            <span>Hỗ trợ file Word (.docx)</span>
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
