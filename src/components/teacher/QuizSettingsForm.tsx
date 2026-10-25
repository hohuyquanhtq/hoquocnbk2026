import React from 'react';
import {
  Clock,
  KeyRound,
  Award,
  Shuffle,
  Eye,
  RotateCcw,
  Users,
  Calendar,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import type { Quiz } from '../../types';

interface QuizSettingsFormProps {
  settings: Partial<Quiz>;
  onChange: (settings: Partial<Quiz>) => void;
}

export const QuizSettingsForm: React.FC<QuizSettingsFormProps> = ({ settings, onChange }) => {
  const update = (patch: Partial<Quiz>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span>Thông tin cơ bản</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên đề thi trắc nghiệm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={settings.title || ''}
              onChange={e => update({ title: e.target.value })}
              placeholder="Ví dụ: Kiểm tra 1 tiết Hóa Học 12 - Chương Este Lipit"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
            <input
              type="text"
              value={settings.subject || ''}
              onChange={e => update({ subject: e.target.value })}
              placeholder="Hóa học, Toán học, Vật lý..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
            <input
              type="text"
              value={settings.grade || ''}
              onChange={e => update({ grade: e.target.value })}
              placeholder="Lớp 10, Lớp 11, Lớp 12..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thời gian làm bài (Phút) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="300"
                value={settings.durationMinutes || 45}
                onChange={e => update({ durationMinutes: parseInt(e.target.value, 10) || 45 })}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-medium"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access Password */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-600" />
          <span>Mật khẩu và Quyền vào thi</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu vào bài thi (Tự đặt)
            </label>
            <input
              type="text"
              value={settings.password || ''}
              onChange={e => {
                const val = e.target.value;
                update({
                  password: val,
                  hasPassword: val.trim().length > 0
                });
              }}
              placeholder="Để trống nếu thi tự do không cần mật khẩu"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Học sinh phải nhập đúng mật khẩu này mới có thể bắt đầu làm bài.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số lần học sinh được phép làm bài
            </label>
            <select
              value={settings.maxAttempts ?? 1}
              onChange={e => update({ maxAttempts: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
            >
              <option value="1">1 lần duy nhất (Nghiêm ngặt)</option>
              <option value="0">Không giới hạn số lần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scoring and Answer Revealing Threshold (CRITICAL REQUIREMENT) */}
      <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 p-5 rounded-2xl border border-blue-200 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Quy tắc tính điểm &amp; Ngưỡng mở đáp án / lời giải
            </h4>
            <p className="text-xs text-slate-600">
              Chỉ học sinh đạt ngưỡng điểm này mới được hệ thống hiển thị đáp án đúng và hướng dẫn giải sau khi nộp bài.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Thang điểm bài thi
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.totalPoints || 10}
              onChange={e => update({ totalPoints: parseFloat(e.target.value) || 10 })}
              className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl text-center font-bold text-blue-700"
            />
            <p className="text-[11px] text-slate-500 mt-1">Mặc định thang điểm 10</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Ngưỡng điểm tối thiểu để mở đáp án
            </label>
            <input
              type="number"
              min="0"
              max={settings.totalPoints || 10}
              step="0.5"
              value={settings.minScoreToViewAnswers ?? 7.0}
              onChange={e => update({ minScoreToViewAnswers: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl text-center font-bold text-emerald-700"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Ví dụ: Đạt ≥ 7.0 / 10 mới xem được giải
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Cài đặt hiển thị đáp án
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowViewAnswers ?? true}
                onChange={e => update({ allowViewAnswers: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-xs text-slate-700 font-medium">Cho phép mở đáp án khi đạt ngưỡng</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowViewExplanation ?? true}
                onChange={e => update({ allowViewExplanation: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-xs text-slate-700 font-medium">Kèm theo hướng dẫn giải chi tiết</span>
            </label>
          </div>
        </div>
      </div>

      {/* Shuffling & Exam Rules */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-blue-600" />
          <span>Tùy chọn xáo trộn &amp; Chống gian lận</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.shuffleQuestions ?? true}
              onChange={e => update({ shuffleQuestions: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Trộn thứ tự câu hỏi</p>
              <p className="text-xs text-slate-500">Mỗi học sinh nhận đề với thứ tự câu hỏi ngẫu nhiên khác nhau.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.shuffleOptions ?? true}
              onChange={e => update({ shuffleOptions: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Trộn phương án lựa chọn (A, B, C, D)</p>
              <p className="text-xs text-slate-500">Đảo vị trí các phương án để học sinh khó nhìn bài nhau.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.showScoreImmediately ?? true}
              onChange={e => update({ showScoreImmediately: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Hiện điểm ngay sau khi nộp</p>
              <p className="text-xs text-slate-500">Học sinh biết ngay điểm tổng và số câu đúng/sai.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={settings.allowRetake ?? false}
              onChange={e => update({ allowRetake: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Cho phép làm lại bài</p>
              <p className="text-xs text-slate-500">Học sinh chưa đạt ngưỡng có thể thi lại lần nữa.</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
