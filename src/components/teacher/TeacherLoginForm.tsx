import React, { useState } from 'react';
import {
  School,
  Lock,
  User,
  Mail,
  LogIn,
  UserPlus,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '../../firebase/config';
import { syncUserProfile } from '../../firebase/firestoreService';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { loginTeacher, registerTeacher } from '../../services/api';
import type { UserProfile } from '../../types';
import { useToast } from '../common/Toast';

interface TeacherLoginFormProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const TeacherLoginForm: React.FC<TeacherLoginFormProps> = ({ onLoginSuccess }) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanIdentifier = loginIdentifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Vui lòng nhập Email hoặc Họ và tên giáo viên.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Vui lòng nhập Mật khẩu truy cập.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const isEmail = cleanIdentifier.includes('@');
    const cleanEmail = cleanIdentifier.toLowerCase();

    // 1. If it's an email format, attempt Firebase Auth client first
    if (isEmail) {
      try {
        console.log('[Auth] Đang đăng nhập Firebase Authentication:', cleanEmail);
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, loginPassword);
        
        // Sync profile from Firestore
        const profile = await syncUserProfile({
          uid: userCred.user.uid,
          email: userCred.user.email,
          displayName: userCred.user.displayName || cleanIdentifier
        });

        // Sync backend session token
        await loginTeacher(cleanEmail, loginPassword, rememberMe).catch(err => {
          console.warn('[Backend Session Sync]', err);
        });

        showToast(`Đăng nhập thành công! Xin chào ${profile.displayName}`, 'success');
        onLoginSuccess(profile);
        return;
      } catch (fbErr: any) {
        console.warn('[Firebase Auth Login Check]', fbErr?.code || fbErr?.message);
        
        // If it's a specific credential error, try backend fallback or show error
        const isProviderDisabled = fbErr?.code === 'auth/operation-not-allowed';
        const isUserNotFound = fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential';
        
        if (!isProviderDisabled && !isUserNotFound) {
          // Explicit Firebase errors like wrong password, user disabled, etc.
          setErrorMessage(getAuthErrorMessage(fbErr));
          setIsLoading(false);
          return;
        }
        // If operation not allowed or user might be in backend Firestore, fallback to backend API below
      }
    }

    // 2. Authenticate against Backend Firestore Server
    try {
      console.log('[Auth] Xác thực qua Cloud Firestore Server:', cleanIdentifier);
      const res = await loginTeacher(cleanIdentifier, loginPassword, rememberMe);
      showToast(`Đăng nhập thành công! Xin chào ${res.user.displayName}`, 'success');
      onLoginSuccess(res.user);
    } catch (serverErr: any) {
      console.error('[Backend Auth Error]', serverErr);
      setErrorMessage(getAuthErrorMessage(serverErr));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanFullName = regFullName.trim();
    if (!cleanFullName || cleanFullName.length < 2) {
      setErrorMessage('Vui lòng nhập Họ và tên giáo viên (tối thiểu 2 ký tự).');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailPattern.test(cleanEmail)) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: giaovien@truong.edu.vn).');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Mật khẩu cần có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // 1. Attempt registration via Firebase Authentication client SDK
    let registeredWithFirebase = false;
    let createdUid: string | null = null;

    try {
      console.log('[Auth] Khởi tạo tài khoản Firebase Auth cho:', cleanEmail);
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
      registeredWithFirebase = true;
      createdUid = userCred.user.uid;

      // Update Firebase user profile
      await updateProfile(userCred.user, {
        displayName: cleanFullName
      }).catch(err => console.warn('Không thể cập nhật displayName trên Firebase user:', err));

      // Save/sync teacher profile into Firestore users/{uid}
      const profile = await syncUserProfile({
        uid: userCred.user.uid,
        email: cleanEmail,
        displayName: cleanFullName
      });

      // Also register on server to keep backend Firestore collection synced
      await registerTeacher({
        fullName: cleanFullName,
        email: cleanEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword
      }).catch(err => console.warn('Server sync note:', err?.message));

      showToast('Đăng ký tài khoản giáo viên thành công!', 'success');
      onLoginSuccess(profile);
      return;
    } catch (fbErr: any) {
      console.error('[Firebase Auth Register Error]', fbErr);
      
      const errorCode = fbErr?.code || '';

      // If email is already taken or password weak or email invalid, report immediately
      if (
        errorCode === 'auth/email-already-in-use' ||
        errorCode === 'auth/weak-password' ||
        errorCode === 'auth/invalid-email'
      ) {
        setErrorMessage(getAuthErrorMessage(fbErr));
        setIsLoading(false);
        return;
      }

      // If Firebase Auth Email/Password provider is not enabled on this GCP project
      // (errorCode === 'auth/operation-not-allowed'), seamlessly proceed to secure Firestore Server
      if (errorCode === 'auth/operation-not-allowed' || errorCode === 'auth/configuration-not-found') {
        console.warn('Firebase Email/Password provider chưa kích hoạt trên GCP console, tự động chuyển sang chế độ xác thực Cloud Server Firestore.');
      }
    }

    // 2. Fallback: Register via Cloud Firestore Server
    try {
      console.log('[Auth] Đăng ký tài khoản qua Cloud Firestore Server:', cleanEmail);
      const res = await registerTeacher({
        fullName: cleanFullName,
        email: cleanEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword
      });

      showToast('Đăng ký tài khoản giáo viên thành công!', 'success');
      onLoginSuccess(res.user);
    } catch (serverErr: any) {
      console.error('[Server Register Error]', serverErr);
      setErrorMessage(getAuthErrorMessage(serverErr));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      {/* Icon & Title */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
          {mode === 'login' ? <School className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {mode === 'login' ? 'Đăng Nhập Giáo Viên' : 'Đăng Ký Tài Khoản Giáo Viên'}
        </h2>
        <p className="text-xs text-slate-500">
          {mode === 'login'
            ? 'Nhập email hoặc họ tên và mật khẩu để quản lý đề thi trắc nghiệm.'
            : 'Tạo tài khoản mới để bắt đầu tạo đề từ file Word và phát hành thi trực tuyến.'}
        </p>
      </div>

      {/* Switcher Tab Pills */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đăng Nhập
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mode === 'register'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đăng Ký Mới
        </button>
      </div>

      {/* ---------------- LOGIN FORM ---------------- */}
      {mode === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Email or Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email hoặc Họ và tên giáo viên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
                placeholder="Nhập email hoặc họ tên giáo viên..."
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
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
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

          {/* Error display */}
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

          {/* Link to Register */}
          <div className="pt-3 text-center">
            <p className="text-xs text-slate-600">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </form>
      ) : (
        /* ---------------- REGISTER FORM ---------------- */
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên giáo viên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={regFullName}
                onChange={e => setRegFullName(e.target.value)}
                placeholder="Ví dụ: Thầy Trần Quang Huy"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="giaovien@truong.edu.vn"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Xác nhận mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={regConfirmPassword}
                onChange={e => setRegConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="flex-1">{errorMessage}</p>
            </div>
          )}

          {/* Policy Notice */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Chính sách phân quyền:
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Tài khoản đăng ký mới sẽ nhận quyền Giáo viên chuẩn để tạo đề từ file Word, cấu hình thời gian thi và xem báo cáo kết quả của học sinh.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}</span>
          </button>

          {/* Link to Login */}
          <div className="pt-3 text-center">
            <p className="text-xs text-slate-600">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </form>
      )}

      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          Hệ thống tạo đề Word &amp; Thi trắc nghiệm trực tuyến dùng chung cộng đồng
        </p>
      </div>
    </div>
  );
};
