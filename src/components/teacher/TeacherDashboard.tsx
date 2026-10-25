import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Share2,
  BarChart3,
  Copy,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Clock,
  BookOpen,
  Users,
  Search,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { Quiz, UserProfile } from '../../types';
import {
  getTeacherQuizzes,
  updateQuizStatus,
  deleteQuiz,
  getQuizDetail,
  saveQuiz
} from '../../firebase/firestoreService';
import { QuizPublishSuccess } from './QuizPublishSuccess';
import { QuizSubmissionsView } from './QuizSubmissionsView';
import { AdminPanel } from './AdminPanel';
import { useToast } from '../common/Toast';

interface TeacherDashboardProps {
  user: UserProfile;
  onCreateQuiz: () => void;
  onOpenAsStudent: (code: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  onCreateQuiz,
  onOpenAsStudent,
}) => {
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
  const [search, setSearch] = useState('');

  // Modals / active views
  const [sharingQuiz, setSharingQuiz] = useState<Quiz | null>(null);
  const [viewingResultsQuiz, setViewingResultsQuiz] = useState<Quiz | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [user.uid]);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const list = await getTeacherQuizzes(user.uid, user.role === 'admin');
      setQuizzes(list);
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi tải danh sách đề thi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (quiz: Quiz) => {
    const nextStatus = quiz.status === 'published' ? 'closed' : 'published';
    try {
      await updateQuizStatus(quiz.id, nextStatus);
      setQuizzes(prev => prev.map(q => (q.id === quiz.id ? { ...q, status: nextStatus } : q)));
      showToast(nextStatus === 'published' ? 'Đã mở lại đề thi!' : 'Đã đóng đề thi!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi cập nhật trạng thái đề thi', 'error');
    }
  };

  const handleDelete = async (quiz: Quiz) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đề thi "${quiz.title}" không? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await deleteQuiz(quiz.id);
      setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
      showToast('Đã xóa đề thi thành công', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi xóa đề thi: ' + err.message, 'error');
    }
  };

  const handleDuplicate = async (quiz: Quiz) => {
    try {
      const detail = await getQuizDetail(quiz.id);
      if (!detail) {
        showToast('Không thể đọc chi tiết đề thi cũ', 'error');
        return;
      }

      const newId = `quiz_${Date.now()}`;
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date().toISOString();

      const newQuiz: Quiz = {
        ...quiz,
        id: newId,
        code: newCode,
        title: `${quiz.title} (Bản sao)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };

      const newDetail = {
        quizId: newId,
        teacherId: user.uid,
        questions: detail.questions,
        updatedAt: now,
      };

      const newPublic = {
        id: newId,
        code: newCode,
        title: newQuiz.title,
        subject: newQuiz.subject,
        grade: newQuiz.grade,
        teacherName: user.displayName || 'Giáo viên',
        status: 'draft' as const,
        durationMinutes: newQuiz.durationMinutes,
        hasPassword: newQuiz.hasPassword,
        totalPoints: newQuiz.totalPoints,
        shuffleQuestions: newQuiz.shuffleQuestions,
        shuffleOptions: newQuiz.shuffleOptions,
        showScoreImmediately: newQuiz.showScoreImmediately,
        allowViewAnswers: newQuiz.allowViewAnswers,
        minScoreToViewAnswers: newQuiz.minScoreToViewAnswers,
        allowViewExplanation: newQuiz.allowViewExplanation,
        allowRetake: newQuiz.allowRetake,
        questionsCount: newQuiz.questionsCount,
        questionsSanitized: detail.questions.map(q => ({
          id: q.id,
          order: q.order,
          content: q.content,
          type: q.type,
          options: q.options,
          points: q.points || 1,
        })),
        updatedAt: now,
      };

      await saveQuiz(newQuiz, newDetail, newPublic);
      setQuizzes(prev => [newQuiz, ...prev]);
      showToast('Đã nhân bản đề thi thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi nhân bản đề thi', 'error');
    }
  };

  // If viewing results view
  if (viewingResultsQuiz) {
    return (
      <QuizSubmissionsView
        quiz={viewingResultsQuiz}
        onBack={() => {
          setViewingResultsQuiz(null);
          loadQuizzes();
        }}
      />
    );
  }

  // If viewing admin panel
  if (showAdminPanel) {
    return <AdminPanel onBack={() => setShowAdminPanel(false)} />;
  }

  // Filtered list
  const filtered = quizzes.filter(q => {
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.code.toLowerCase().includes(search.toLowerCase()) ||
      q.subject.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const publishedCount = quizzes.filter(q => q.status === 'published').length;
  const draftCount = quizzes.filter(q => q.status === 'draft').length;
  const closedCount = quizzes.filter(q => q.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Đề Thi Trắc Nghiệm
          </h1>
          <p className="text-xs text-slate-500">
            Tạo đề từ file Word, cấu hình ngưỡng mở lời giải và theo dõi kết quả làm bài của học sinh.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowAdminPanel(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Phân quyền Giáo viên</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCreateQuiz}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Đề Mới (File Word .docx)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Tổng số đề thi</div>
          <div className="text-2xl font-black text-slate-900">{quizzes.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 mb-1">Đang phát hành</div>
          <div className="text-2xl font-black text-emerald-600">{publishedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 mb-1">Bản nháp</div>
          <div className="text-2xl font-black text-amber-600">{draftCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Đã đóng</div>
          <div className="text-2xl font-black text-slate-600">{closedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({quizzes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'published' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đang phát hành ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'draft' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bản nháp ({draftCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'closed' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đã đóng ({closedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên đề, mã đề..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* Quizzes List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Đang tải danh sách đề thi...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Chưa có đề thi nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bấm nút Tạo Đề Mới để tải file Word (.docx) hoặc dán câu hỏi để phát hành cho học sinh.
          </p>
          <button
            type="button"
            onClick={onCreateQuiz}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề thi mới ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(quiz => {
            const isPublished = quiz.status === 'published';
            const isClosed = quiz.status === 'closed';

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  {/* Status & Code */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg">
                      {quiz.code}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isPublished
                          ? 'bg-emerald-100 text-emerald-800'
                          : isClosed
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPublished ? 'Đang mở' : isClosed ? 'Đã đóng' : 'Bản nháp'}
                    </span>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {quiz.subject} • {quiz.grade}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {quiz.durationMinutes} phút
                    </span>
                    <span>•</span>
                    <span>{quiz.questionsCount} câu hỏi</span>
                    {quiz.hasPassword && quiz.password && (
                      <>
                        <span>•</span>
                        <span className="text-amber-700 font-medium flex items-center gap-0.5">
                          <KeyRound className="w-3 h-3" />
                          {quiz.password}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Threshold info */}
                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Ngưỡng xem lời giải:</span>
                    <span className="font-bold text-emerald-700">
                      ≥ {quiz.minScoreToViewAnswers} / {quiz.totalPoints}đ
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={() => setSharingQuiz(quiz)}
                      title="Lấy link & Mã QR"
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* View Submissions */}
                    <button
                      type="button"
                      onClick={() => setViewingResultsQuiz(quiz)}
                      title="Xem danh sách kết quả học sinh"
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>

                    {/* Toggle Open/Closed */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(quiz)}
                      title={isPublished ? 'Đóng đề thi' : 'Mở lại đề thi'}
                      className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      {isPublished ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(quiz)}
                      title="Nhân bản đề này"
                      className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(quiz)}
                    title="Xóa đề thi"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share / QR Modal */}
      {sharingQuiz && (
        <QuizPublishSuccess
          quiz={sharingQuiz}
          onClose={() => setSharingQuiz(null)}
          onOpenAsStudent={code => {
            setSharingQuiz(null);
            onOpenAsStudent(code);
          }}
        />
      )}
    </div>
  );
};
