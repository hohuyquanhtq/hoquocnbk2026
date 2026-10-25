/**
 * Utility to map Firebase Authentication and backend error codes to friendly Vietnamese messages
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';

  const errorCode = typeof error === 'string' ? error : error.code || error.message || '';

  // Log technical code to console for debugging
  console.error('[Auth Error]', { code: error?.code, message: error?.message, error });

  if (errorCode.includes('auth/email-already-in-use')) {
    return 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.';
  }
  if (errorCode.includes('auth/invalid-email')) {
    return 'Địa chỉ email không đúng định dạng. Vui lòng kiểm tra lại.';
  }
  if (errorCode.includes('auth/weak-password')) {
    return 'Mật khẩu chưa đủ mạnh. Mật khẩu cần có độ dài tối thiểu 6 ký tự.';
  }
  if (errorCode.includes('auth/operation-not-allowed')) {
    return 'Phương thức đăng nhập/đăng ký bằng Email và Mật khẩu chưa được kích hoạt trong Firebase Authentication.';
  }
  if (errorCode.includes('auth/network-request-failed')) {
    return 'Không kết nối được máy chủ xác thực. Vui lòng kiểm tra lại kết nối mạng.';
  }
  if (errorCode.includes('auth/invalid-api-key')) {
    return 'Cấu hình Firebase không hợp lệ (Sai API Key). Vui lòng kiểm tra cấu hình dự án.';
  }
  if (errorCode.includes('auth/unauthorized-domain')) {
    return 'Tên miền trang web chưa được cấp phép trong Firebase Authentication Authorized Domains.';
  }
  if (errorCode.includes('auth/too-many-requests')) {
    return 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng đợi trong giây lát rồi thử lại.';
  }
  if (errorCode.includes('auth/user-not-found') || errorCode.includes('auth/invalid-credential')) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
  }
  if (errorCode.includes('auth/wrong-password')) {
    return 'Mật khẩu truy cập không chính xác. Vui lòng thử lại.';
  }
  if (errorCode.includes('auth/user-disabled')) {
    return 'Tài khoản giáo viên này đã bị vô hiệu hóa hoặc tạm khóa.';
  }

  // If error has a human readable backend message
  if (error.message && typeof error.message === 'string' && !error.message.includes('Firebase: Error')) {
    return error.message;
  }

  return 'Lỗi xác thực hệ thống. Vui lòng thử lại sau.';
}
