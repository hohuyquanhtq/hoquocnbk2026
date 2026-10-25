import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Award,
  Users,
  ChevronDown,
  Trash2,
  X
} from 'lucide-react';
import type { Quiz, QuizAttempt, Question } from '../../types';
import { getQuizAttemptsForTeacher, getQuizDetail } from '../../firebase/firestoreService';
import { exportAttemptsToExcel } from '../../utils/exportExcel';
import { useToast } from '../common/Toast';

interface QuizSubmissionsViewProps {
  quiz: Quiz;
  onBack: () => void;
}

export const QuizSubmissionsView: React.FC<QuizSubmissionsViewProps> = ({ quiz, onBack }) => {
  const { showToast } = useToast();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [inspectedAttempt, setInspectedAttempt] = useState<QuizAttempt | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  useEffect(() => {
    loadData();
  }, [quiz.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedAttempts, detail] = await Promise.all([
        getQuizAttemptsForTeacher(quiz.id),
        getQuizDetail(quiz.id)
      ]);
      setAttempts(fetchedAttempts);
      if (detail && detail.questions) {
        setQuizQuestions(detail.questions);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi tải danh sách kết quả bài thi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (attempts.length === 0) {
      showToast('Chưa có lượt nộp bài nào để xuất file', 'error');
      return;
    }
    try {
      exportAttemptsToExcel(attempts, quiz);
      showToast('Đã tải xuống file Excel (.xlsx) thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi xuất file Excel', 'error');
    }
  };

  // Extract distinct classes for filtering
  const distinctClasses = Array.from(new Set(attempts.map(a => a.studentClass).filter(Boolean)));

  const filteredAttempts = attempts.filter(att => {
    const matchesSearch =
      att.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (att.studentSchool || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.studentClass.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'all' || att.studentClass === selectedClass;

    return matchesSearch && matchesClass;
  });

  // Analytics calculation
  const totalSubmissions = attempts.length;
  const scores = attempts.map(a => a.score);
  const avgScore = totalSubmissions > 0 ? (scores.reduce((a, b) => a + b, 0) / totalSubmissions).toFixed(2) : '0';
  const maxScore = totalSubmissions > 0 ? Math.max(...scores) : 0;
  const minScore = totalSubmissions > 0 ? Math.min(...scores) : 0;
  const passThreshold = quiz.minScoreToViewAnswers || 5.0;
  const passCount = attempts.filter(a => a.score >= passThreshold).length;
  const passRate = totalSubmissions > 0 ? ((passCount / totalSubmissions) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-lg">
                {quiz.code}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{quiz.title}</h2>
            </div>
            <p className="text-xs text-slate-500">
              Môn: {quiz.subject} • {quiz.grade} • {quiz.durationMinutes} phút
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Excel (.xlsx)</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Lượt làm bài</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSubmissions}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Điểm trung bình</span>
          </div>
          <div className="text-2xl font-black text-indigo-600">{avgScore}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Điểm cao nhất</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{maxScore}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Điểm thấp nhất</span>
          </div>
          <div className="text-2xl font-black text-rose-600">{minScore}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Tỷ lệ đạt (≥ {passThreshold}đ)</span>
          </div>
          <div className="text-2xl font-black text-amber-600">{passRate}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên, lớp, trường..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Lọc theo lớp:</span>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
          >
            <option value="all">Tất cả các lớp ({attempts.length})</option>
            {distinctClasses.map(cls => (
              <option key={cls} value={cls}>
                Lớp {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải dữ liệu bài thi từ máy chủ...
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Chưa có học sinh nào nộp bài cho đề thi này. Hãy gửi link cho học sinh để làm bài.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Họ và tên</th>
                  <th className="px-4 py-3.5">Lớp</th>
                  <th className="px-4 py-3.5">Trường</th>
                  <th className="px-4 py-3.5 text-center">Điểm số</th>
                  <th className="px-4 py-3.5 text-center">Đúng / Tổng</th>
                  <th className="px-4 py-3.5 text-center">Thời gian làm</th>
                  <th className="px-4 py-3.5 text-center">Thời điểm nộp</th>
                  <th className="px-5 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.map(att => {
                  const mins = Math.floor(att.durationSeconds / 60);
                  const secs = att.durationSeconds % 60;
                  const isPassScore = att.score >= passThreshold;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{att.studentName}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">{att.studentClass}</td>
                      <td className="px-4 py-3.5 text-slate-500">{att.studentSchool || '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg font-black text-sm ${
                            isPassScore
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {att.score}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-slate-600">
                        {att.correctCount} / {att.correctCount + att.wrongCount + att.unansweredCount}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-600 font-mono">
                        {mins}m {secs}s
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-500">
                        {new Date(att.submittedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectedAttempt(att)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem bài</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Student Submission Modal */}
      {inspectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] my-4 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Bài làm của: {inspectedAttempt.studentName} (Lớp {inspectedAttempt.studentClass})
                </h3>
                <p className="text-xs text-slate-500">
                  Điểm: <strong>{inspectedAttempt.score} / {inspectedAttempt.maxScore}</strong> • Đúng {inspectedAttempt.correctCount} câu • Sai {inspectedAttempt.wrongCount} câu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedAttempt(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {quizQuestions.map((q, idx) => {
                const studentAns = inspectedAttempt.studentAnswers?.[q.id];
                const correctAns = q.correctAnswers || [];
                const isCorrect =
                  q.type === 'multiple_choice'
                    ? Array.isArray(studentAns) &&
                      correctAns.length === studentAns.length &&
                      correctAns.every(item => studentAns.includes(item))
                    : String(studentAns).trim().toUpperCase() === (correctAns[0] || '').trim().toUpperCase();

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border ${
                      isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-xs">Câu {idx + 1}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? 'ĐÚNG' : 'SAI'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-900 font-medium mb-3">{q.content}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      {q.options.map(opt => {
                        const isStudent =
                          Array.isArray(studentAns) ? studentAns.includes(opt.id) : studentAns === opt.id;
                        const isTruth = correctAns.includes(opt.id);

                        return (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                              isTruth
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold'
                                : isStudent
                                ? 'border-rose-300 bg-rose-50 text-rose-800'
                                : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            <span>
                              <strong>{opt.id}.</strong> {opt.content}
                            </span>
                            {isTruth && <span className="text-[10px] text-emerald-700 font-bold">Đáp án</span>}
                            {isStudent && !isTruth && (
                              <span className="text-[10px] text-rose-700 font-bold">Học sinh chọn</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-2.5 bg-blue-50 rounded-xl text-[11px] text-blue-900">
                        <strong>Lời giải:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedAttempt(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
