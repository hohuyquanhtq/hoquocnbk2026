import React from 'react';
import { BookOpen, User, LogIn, LogOut, ShieldCheck, GraduationCap, School } from 'lucide-react';
import type { UserProfile } from '../../types';

interface HeaderProps {
  currentTab: 'teacher' | 'student';
  onTabChange: (tab: 'teacher' | 'student') => void;
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoadingAuth: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogin,
  onLogout,
  isLoadingAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onTabChange('student')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">EduQuiz Online</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  Cộng Đồng
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Tạo đề từ Word (.docx) &amp; Thi trực tuyến tự động
              </p>
            </div>
          </div>

          {/* Navigation Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => onTabChange('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'student'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Học sinh vào thi</span>
            </button>
            <button
              onClick={() => onTabChange('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'teacher'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Dành cho Giáo viên</span>
            </button>
          </div>

          {/* User profile / Login button */}
          <div className="flex items-center gap-3">
            {isLoadingAuth ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-right">
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                      {user.displayName || 'Giáo viên'}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          <ShieldCheck className="w-3 h-3" />
                          Quản trị viên
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          Giáo viên
                        </span>
                      )}
                    </div>
                  </div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full ring-2 ring-blue-500/30 object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {(user.displayName || 'GV').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentTab === 'teacher' ? (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng nhập Giáo viên</span>
                <span className="sm:hidden">Đăng nhập</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
