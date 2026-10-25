import React, { useState, useEffect } from 'react';
import {
  School,
  Lock,
  User,
  LogIn,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { checkAuthStatus, loginTeacher, setupInitialAdmin } from '../../services/api';
import type { UserProfile } from '../../types';
import { useToast } from '../common/Toast';

interface TeacherLoginFormProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const TeacherLoginForm: React.FC<TeacherLoginFormProps> = ({ onLoginSuccess }) => {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial setup state if no accounts exist
  const [isCheckingSystem, setIsCheckingSystem] = useState(true);
  const [hasExistingTeachers, setHasExistingTeachers] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setIsCheckingSystem(true);
    try {
      const status = await checkAuthStatus();
      setHasExistingTeachers(status.hasTeachers);
    } catch (err: any) {
      console.warn('Could not check auth status', err);
      // Assume existing teachers if server unreachable
      setHasExistingTeachers(true);
    } finally {
      setIsCheckingSystem(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên giáo viên.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập Mật khẩu truy cập.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginTeacher(fullName.trim(), password, rememberMe);
      showToast(`Đăng nhập thành công! Xin chào ${res.user.displayName}`, 'success');
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Họ tên hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên quản trị viên.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Mật khẩu cần có tối thiểu 4 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await setupInitialAdmin(fullName.trim(), password);
      showToast('Khởi tạo tài khoản Quản trị viên đầu tiên thành công!', 'success');
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi thiết lập tài khoản ban đầu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSystem) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Đang kiểm tra trạng thái bảo mật hệ thống...</p>
      </div>
    );
  }

  // 1. First Time System Setup Mode (Only when 0 accounts exist)
  if (!hasExistingTeachers) {
    return (
      <div className="max-w-md mx-auto my-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center mx-auto shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Thiết Lập Tài Khoản Ban Đầu</h2>
          <p className="text-xs text-slate-500">
            Hệ thống chưa có tài khoản nào. Vui lòng thiết lập tài khoản Quản trị viên / Giáo viên đầu tiên.
          </p>
        </div>

        <form onSubmit={handleInitialSetup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên Quản trị viên / Giáo viên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ví dụ: Thầy Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu truy cập <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 4 ký tự"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Xác nhận mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <p className="font-semibold">Lưu ý bảo mật:</p>
            <p className="text-blue-800 text-[11px]">
              Sau khi khởi tạo tài khoản này, hệ thống sẽ tự động khóa vĩnh viễn trang thiết lập. Người dùng công khai sẽ không thể tự đăng ký.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Khởi Tạo Tài Khoản Quản Trị</span>
          </button>
        </form>
      </div>
    );
  }

  // 2. Standard Teacher Login Form (Strictly Họ tên + Mật khẩu + Ghi nhớ)
  return (
    <div className="max-w-md mx-auto my-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
          <School className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Đăng Nhập Giáo Viên</h2>
        <p className="text-xs text-slate-500">
          Nhập họ tên và mật khẩu được cấp để quản lý đề thi trắc nghiệm.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Họ và tên giáo viên <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A hoặc admin"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mật khẩu truy cập <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="flex-1">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
        </button>
      </form>

      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          Hệ thống bảo vệ nội bộ. Chỉ tài khoản giáo viên được cấp phép mới có thể truy cập.
        </p>
      </div>
    </div>
  );
};
