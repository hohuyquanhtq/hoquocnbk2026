import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle,
  Copy,
  ExternalLink,
  QrCode,
  Share2,
  X,
  MessageSquare,
  KeyRound,
  Calendar,
  Clock
} from 'lucide-react';
import type { Quiz } from '../../types';
import { useToast } from '../common/Toast';

interface QuizPublishSuccessProps {
  quiz: Quiz;
  onClose: () => void;
  onOpenAsStudent: (code: string) => void;
}

export const QuizPublishSuccess: React.FC<QuizPublishSuccessProps> = ({
  quiz,
  onClose,
  onOpenAsStudent,
}) => {
  const { showToast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Build the public link based on current origin
  const baseUrl = window.location.origin + window.location.pathname;
  const examUrl = `${baseUrl}?quiz=${quiz.code}`;

  useEffect(() => {
    QRCode.toDataURL(examUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Lỗi tạo QR code', err));
  }, [examUrl]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label} vào bộ nhớ tạm!`, 'success');
  };

  const zaloTemplate = `THÔNG BÁO BÀI THI TRẮC NGHIỆM TRỰC TUYẾN
- Tên bài: ${quiz.title}
- Môn: ${quiz.subject || 'Tổng hợp'} (${quiz.grade || 'Toán - KHTN'})
- Thời gian làm bài: ${quiz.durationMinutes} phút (${quiz.questionsCount} câu)
- Mã đề thi: ${quiz.code}
${quiz.hasPassword && quiz.password ? `- Mật khẩu vào thi: ${quiz.password}\n` : ''}
👉 Link vào thi trực tiếp: ${examUrl}
(Học sinh dùng điện thoại hoặc máy tính bấm link để làm bài, không cần tạo tài khoản)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold">Phát hành bài thi thành công!</h3>
          <p className="text-xs text-blue-100 mt-1 max-w-sm mx-auto">
            Bài thi đã được lưu trên máy chủ cộng đồng. Mọi học sinh có link đều có thể truy cập làm bài ngay lập tức.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* QR Code and Quick summary */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            {qrDataUrl ? (
              <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 shrink-0">
                <img src={qrDataUrl} alt="QR Code đề thi" className="w-32 h-32" />
                <p className="text-[10px] text-center text-slate-500 font-medium mt-1">Quét bằng Zalo / Camera</p>
              </div>
            ) : (
              <div className="w-32 h-32 bg-slate-200 rounded-xl animate-pulse" />
            )}

            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs text-slate-500">Mã đề:</span>
                <span className="font-mono text-base font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-lg">
                  {quiz.code}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">{quiz.title}</h4>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {quiz.durationMinutes} phút
                </span>
                <span>•</span>
                <span>{quiz.questionsCount} câu hỏi</span>
                {quiz.hasPassword && quiz.password && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700 font-medium">Mật khẩu: {quiz.password}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Copy Link field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Link làm bài thi trực tiếp:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={examUrl}
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl text-slate-700 select-all"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(examUrl, 'Link bài thi')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-xs transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép</span>
              </button>
            </div>
          </div>

          {/* Fast Actions: Copy Password & Copy Zalo Message */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quiz.hasPassword && quiz.password ? (
              <button
                type="button"
                onClick={() => copyToClipboard(quiz.password || '', 'Mật khẩu')}
                className="flex items-center justify-center gap-2 p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 text-xs font-semibold transition-all"
              >
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Sao chép Mật khẩu: {quiz.password}</span>
              </button>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                Đề thi mở tự do (Không có mật khẩu)
              </div>
            )}

            <button
              type="button"
              onClick={() => copyToClipboard(zaloTemplate, 'Mẫu tin nhắn gửi Zalo/Lớp')}
              className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-200 text-xs font-semibold transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Sao chép mẫu gửi Zalo</span>
            </button>
          </div>

          {/* Test run button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAsStudent(quiz.code);
              }}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Thử vào thi với tư cách Học sinh</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
