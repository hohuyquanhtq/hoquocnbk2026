import type {
  Quiz,
  Question,
  QuizDetail,
  QuizPublic,
  QuizAttempt,
  UserProfile,
  UserRole,
  StudentAnswerMap
} from '../types';

const TOKEN_KEY = 'eduquiz_teacher_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, rememberMe = true) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Yêu cầu thất bại (${res.status})`);
  }

  return data;
}

// ----------------- AUTH APIS -----------------

export async function checkAuthStatus(): Promise<{ hasTeachers: boolean; teacherCount: number }> {
  return request('/api/auth/status');
}

export async function setupInitialAdmin(fullName: string, password: string, email = ''): Promise<{ token: string; user: UserProfile }> {
  const data = await request('/api/auth/setup-initial', {
    method: 'POST',
    body: JSON.stringify({ fullName, password, email })
  });
  setStoredToken(data.token, true);
  return data;
}

export async function registerTeacher(payload: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<{ token: string; user: UserProfile; message: string }> {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setStoredToken(data.token, true);
  return data;
}

export async function loginTeacher(identifier: string, password: string, rememberMe = true): Promise<{ token: string; user: UserProfile }> {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, rememberMe })
  });
  setStoredToken(data.token, rememberMe);
  return data;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const data = await request('/api/auth/me');
    return data.user;
  } catch {
    removeStoredToken();
    return null;
  }
}

// ----------------- TEACHER QUIZ APIS -----------------

export async function apiGetTeacherQuizzes(): Promise<Quiz[]> {
  const data = await request('/api/teacher/quizzes');
  return data.quizzes || [];
}

export async function apiSaveQuiz(quiz: Partial<Quiz>, questions: Question[]): Promise<Quiz> {
  const data = await request('/api/teacher/quizzes', {
    method: 'POST',
    body: JSON.stringify({ quiz, questions })
  });
  return data.quiz;
}

export async function apiUpdateQuizStatus(quizId: string, status: 'published' | 'draft' | 'closed'): Promise<void> {
  await request(`/api/teacher/quizzes/${quizId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
}

export async function apiDeleteQuiz(quizId: string): Promise<void> {
  await request(`/api/teacher/quizzes/${quizId}`, {
    method: 'DELETE'
  });
}

export async function apiGetQuizDetail(quizId: string): Promise<QuizDetail> {
  const data = await request(`/api/teacher/quizzes/${quizId}/detail`);
  return data.detail;
}

export async function apiGetQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const data = await request(`/api/teacher/quizzes/${quizId}/attempts`);
  return data.attempts || [];
}

// ----------------- ADMIN APIS -----------------

export async function apiGetAdminUsers(): Promise<UserProfile[]> {
  const data = await request('/api/admin/users');
  return data.users || [];
}

export async function apiAddTeacher(fullName: string, password: string, role: UserRole = 'teacher'): Promise<UserProfile> {
  const data = await request('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ fullName, password, role })
  });
  return data.user;
}

export async function apiUpdateUserRole(userId: string, role: UserRole): Promise<void> {
  await request(`/api/admin/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify({ role })
  });
}

// ----------------- PUBLIC STUDENT APIS -----------------

export async function apiGetPublicQuiz(code: string): Promise<QuizPublic> {
  const data = await request(`/api/public/quiz/${encodeURIComponent(code)}`);
  return data.quiz;
}

export async function apiVerifyQuizPassword(quizId: string, password: string): Promise<boolean> {
  const data = await request(`/api/public/quiz/${quizId}/verify-password`, {
    method: 'POST',
    body: JSON.stringify({ password })
  });
  return data.valid;
}

export async function apiSubmitExamAttempt(quizId: string, payload: {
  studentName: string;
  studentClass: string;
  studentSchool?: string;
  answers: StudentAnswerMap;
  durationSeconds: number;
}): Promise<QuizAttempt> {
  const data = await request(`/api/public/quiz/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.attempt;
}
