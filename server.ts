import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  setFirestoreDoc,
  getFirestoreDoc,
  deleteFirestoreDoc,
  queryFirestoreCollection
} from './src/server/firestoreAdmin';
import { gradeSubmission } from './src/utils/grading';
import { SAMPLE_CHEMISTRY_QUESTIONS } from './src/utils/sampleData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Secret key for HMAC token signing
const JWT_SECRET = process.env.JWT_SECRET || 'eduquiz_session_hmac_secret_key_8e27d949';

// Cryptographic Password Hashing using PBKDF2
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
}

// Token signing
interface SessionPayload {
  uid: string;
  displayName: string;
  role: 'admin' | 'teacher' | 'pending';
  exp: number;
}

function createToken(payload: Omit<SessionPayload, 'exp'>, expiresInSeconds: number): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(token: string): SessionPayload | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
    if (signature !== expectedSignature) return null;
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: SessionPayload;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập tài khoản giáo viên.' });
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  }

  if (user.role === 'pending') {
    return res.status(403).json({ error: 'Tài khoản đang chờ duyệt hoặc đã bị khóa.' });
  }

  req.user = user;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền quản trị viên.' });
    }
    next();
  });
}

// Normalize name for matching
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

// ==========================================
// 1. AUTH ROUTES
// ==========================================

// Check if system has any teacher accounts
app.get('/api/auth/status', async (req, res) => {
  try {
    const teachers = await queryFirestoreCollection('teachers');
    res.json({
      hasTeachers: teachers.length > 0,
      teacherCount: teachers.length
    });
  } catch (error: any) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ error: 'Không thể kiểm tra trạng thái máy chủ' });
  }
});

// Setup initial administrator/teacher account
app.post('/api/auth/setup-initial', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName?.trim() || !password || password.length < 4) {
      return res.status(400).json({ error: 'Họ tên và mật khẩu (tối thiểu 4 ký tự) là bắt buộc.' });
    }

    const teachers = await queryFirestoreCollection('teachers');
    if (teachers.length > 0) {
      return res.status(403).json({ error: 'Hệ thống đã có tài khoản. Không thể khởi tạo lại.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const teacherId = `teacher_${Date.now()}`;

    const newTeacher = {
      uid: teacherId,
      fullName: fullName.trim(),
      email: (email || '').trim().toLowerCase(),
      normalizedName: normalizeName(fullName),
      passwordHash,
      salt,
      role: 'admin' as const,
      createdAt: new Date().toISOString()
    };

    await setFirestoreDoc('teachers', teacherId, newTeacher);

    // Create session token
    const token = createToken({
      uid: teacherId,
      displayName: newTeacher.fullName,
      role: newTeacher.role
    }, 30 * 24 * 3600); // 30 days

    res.json({
      message: 'Khởi tạo tài khoản Quản trị viên đầu tiên thành công!',
      token,
      user: {
        uid: teacherId,
        displayName: newTeacher.fullName,
        email: newTeacher.email,
        role: newTeacher.role
      }
    });
  } catch (error: any) {
    console.error('Initial setup error:', error);
    res.status(500).json({ error: 'Lỗi thiết lập tài khoản ban đầu' });
  }
});

// Teacher Registration with Full Name, Email, Password, ConfirmPassword
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName?.trim() || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Vui lòng nhập Họ và tên giáo viên (tối thiểu 2 ký tự).' });
    }

    const trimmedEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Địa chỉ email không đúng định dạng.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu cần có độ dài tối thiểu 6 ký tự.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.' });
    }

    const teachers = await queryFirestoreCollection('teachers');

    // Check if email already registered
    const existingEmail = teachers.find(t => t.email && t.email.toLowerCase() === trimmedEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const teacherId = `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Strictly assign standard 'teacher' role for public registrations (never 'admin')
    const newTeacher = {
      uid: teacherId,
      fullName: fullName.trim(),
      email: trimmedEmail,
      normalizedName: normalizeName(fullName),
      passwordHash,
      salt,
      role: 'teacher' as const,
      createdAt: new Date().toISOString()
    };

    await setFirestoreDoc('teachers', teacherId, newTeacher);

    // Issue session token for 30 days
    const token = createToken({
      uid: teacherId,
      displayName: newTeacher.fullName,
      role: newTeacher.role
    }, 30 * 24 * 3600);

    res.json({
      message: 'Đăng ký tài khoản giáo viên thành công!',
      token,
      user: {
        uid: teacherId,
        displayName: newTeacher.fullName,
        email: newTeacher.email,
        role: newTeacher.role
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Lỗi khi đăng ký tài khoản. Vui lòng thử lại.' });
  }
});

// Teacher Login with Email/Name & Password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, email, fullName, password, rememberMe } = req.body;
    const loginInput = (identifier || email || fullName || '').trim();

    if (!loginInput || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập Email hoặc Họ tên và Mật khẩu.' });
    }

    const normalizedInput = normalizeName(loginInput);
    const lowerInput = loginInput.toLowerCase();
    const teachers = await queryFirestoreCollection('teachers');

    // Find teacher by email or normalized name or exact fullName
    const teacher = teachers.find(t =>
      (t.email && t.email.toLowerCase() === lowerInput) ||
      (t.normalizedName && t.normalizedName === normalizedInput) ||
      (t.fullName && t.fullName.trim().toLowerCase() === lowerInput)
    );

    if (!teacher) {
      return res.status(401).json({ error: 'Tài khoản hoặc email chưa được đăng ký trong hệ thống.' });
    }

    if (teacher.role === 'pending') {
      return res.status(403).json({ error: 'Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt.' });
    }

    const expectedHash = hashPassword(password, teacher.salt);
    if (expectedHash !== teacher.passwordHash) {
      return res.status(401).json({ error: 'Mật khẩu truy cập không chính xác. Vui lòng thử lại.' });
    }

    const expiresInSeconds = rememberMe ? 30 * 24 * 3600 : 24 * 3600; // 30 days or 1 day
    const token = createToken({
      uid: teacher.uid,
      displayName: teacher.fullName,
      role: teacher.role
    }, expiresInSeconds);

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        uid: teacher.uid,
        displayName: teacher.fullName,
        email: teacher.email || '',
        role: teacher.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng nhập' });
  }
});

// Get current logged in teacher profile
app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// ==========================================
// 2. TEACHER QUIZ MANAGEMENT ROUTES
// ==========================================

// Get teacher quizzes
app.get('/api/teacher/quizzes', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const allQuizzes = await queryFirestoreCollection('quizzes');
    const user = req.user!;

    let filtered = allQuizzes;
    if (user.role !== 'admin') {
      filtered = allQuizzes.filter(q => q.teacherId === user.uid);
    }

    filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json({ quizzes: filtered });
  } catch (error: any) {
    console.error('Error fetching teacher quizzes:', error);
    res.status(500).json({ error: 'Lỗi tải danh sách đề thi' });
  }
});

// Save or Update a Quiz
app.post('/api/teacher/quizzes', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { quiz, questions } = req.body;
    if (!quiz || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Dữ liệu đề thi không hợp lệ.' });
    }

    const user = req.user!;
    const now = new Date().toISOString();
    const quizId = quiz.id || `quiz_${Date.now()}`;
    const quizCode = quiz.code || Math.random().toString(36).substring(2, 8).toUpperCase();

    const fullQuiz = {
      ...quiz,
      id: quizId,
      code: quizCode,
      teacherId: quiz.teacherId || user.uid,
      teacherName: quiz.teacherName || user.displayName,
      questionsCount: questions.length,
      createdAt: quiz.createdAt || now,
      updatedAt: now
    };

    const quizDetail = {
      quizId,
      teacherId: fullQuiz.teacherId,
      questions,
      updatedAt: now
    };

    // Public sanitized version without answers or solutions
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      order: q.order,
      content: q.content,
      type: q.type,
      options: q.options,
      points: q.points || 1
    }));

    const quizPublic = {
      id: quizId,
      code: quizCode,
      title: fullQuiz.title,
      subject: fullQuiz.subject,
      grade: fullQuiz.grade,
      teacherName: fullQuiz.teacherName,
      status: fullQuiz.status,
      durationMinutes: fullQuiz.durationMinutes,
      hasPassword: fullQuiz.hasPassword,
      passwordPlain: fullQuiz.hasPassword ? fullQuiz.password : '',
      totalPoints: fullQuiz.totalPoints,
      shuffleQuestions: fullQuiz.shuffleQuestions,
      shuffleOptions: fullQuiz.shuffleOptions,
      showScoreImmediately: fullQuiz.showScoreImmediately,
      allowViewAnswers: fullQuiz.allowViewAnswers,
      minScoreToViewAnswers: fullQuiz.minScoreToViewAnswers,
      allowViewExplanation: fullQuiz.allowViewExplanation,
      allowRetake: fullQuiz.allowRetake,
      questionsCount: questions.length,
      questionsSanitized: sanitizedQuestions,
      updatedAt: now
    };

    await Promise.all([
      setFirestoreDoc('quizzes', quizId, fullQuiz),
      setFirestoreDoc('quizDetails', quizId, quizDetail),
      setFirestoreDoc('quizPublic', quizId, quizPublic)
    ]);

    res.json({ message: 'Lưu đề thi thành công', quiz: fullQuiz });
  } catch (error: any) {
    console.error('Error saving quiz:', error);
    res.status(500).json({ error: 'Lỗi lưu đề thi lên cơ sở dữ liệu' });
  }
});

// Update quiz status
app.post('/api/teacher/quizzes/:id/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const now = new Date().toISOString();

    const existingQuiz = await getFirestoreDoc('quizzes', id);
    if (!existingQuiz) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    if (req.user!.role !== 'admin' && existingQuiz.teacherId !== req.user!.uid) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa đề này' });
    }

    await setFirestoreDoc('quizzes', id, { ...existingQuiz, status, updatedAt: now });

    const existingPub = await getFirestoreDoc('quizPublic', id);
    if (existingPub) {
      await setFirestoreDoc('quizPublic', id, { ...existingPub, status, updatedAt: now });
    }

    res.json({ message: 'Cập nhật trạng thái thành công', status });
  } catch (error: any) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái' });
  }
});

// Delete quiz
app.delete('/api/teacher/quizzes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await getFirestoreDoc('quizzes', id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    if (req.user!.role !== 'admin' && existing.teacherId !== req.user!.uid) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa đề này' });
    }

    await Promise.all([
      deleteFirestoreDoc('quizzes', id),
      deleteFirestoreDoc('quizDetails', id),
      deleteFirestoreDoc('quizPublic', id)
    ]);

    res.json({ message: 'Đã xóa đề thi thành công' });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Lỗi xóa đề thi' });
  }
});

// Get quiz detail with answer keys (Teacher only)
app.get('/api/teacher/quizzes/:id/detail', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const detail = await getFirestoreDoc('quizDetails', id);
    if (!detail) return res.status(404).json({ error: 'Không tìm thấy chi tiết câu hỏi' });

    if (req.user!.role !== 'admin' && detail.teacherId !== req.user!.uid) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập đề thi này' });
    }

    res.json({ detail });
  } catch (error: any) {
    console.error('Error getting quiz detail:', error);
    res.status(500).json({ error: 'Lỗi đọc chi tiết đề thi' });
  }
});

// Get quiz attempts for teacher
app.get('/api/teacher/quizzes/:id/attempts', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const allAttempts = await queryFirestoreCollection('attempts');
    const filtered = allAttempts.filter(a => a.quizId === id);
    filtered.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
    res.json({ attempts: filtered });
  } catch (error: any) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Lỗi tải danh sách kết quả' });
  }
});

// ==========================================
// 3. ADMIN USER MANAGEMENT ROUTES
// ==========================================

// Get all users (Admin only)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const teachers = await queryFirestoreCollection('teachers');
    const sanitized = teachers.map(t => ({
      uid: t.uid,
      displayName: t.fullName,
      role: t.role,
      createdAt: t.createdAt
    }));
    res.json({ users: sanitized });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Lỗi tải danh sách người dùng' });
  }
});

// Admin adds new teacher
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { fullName, password, role } = req.body;
    if (!fullName?.trim() || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp Họ tên và Mật khẩu.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const teacherId = `teacher_${Date.now()}`;

    const newTeacher = {
      uid: teacherId,
      fullName: fullName.trim(),
      normalizedName: normalizeName(fullName),
      passwordHash,
      salt,
      role: role || 'teacher',
      createdAt: new Date().toISOString()
    };

    await setFirestoreDoc('teachers', teacherId, newTeacher);
    res.json({
      message: 'Thêm giáo viên mới thành công',
      user: {
        uid: teacherId,
        displayName: newTeacher.fullName,
        role: newTeacher.role
      }
    });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Lỗi thêm giáo viên mới' });
  }
});

// Admin updates role
app.post('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const existing = await getFirestoreDoc('teachers', id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    await setFirestoreDoc('teachers', id, { ...existing, role, updatedAt: new Date().toISOString() });
    res.json({ message: 'Cập nhật vai trò thành công', role });
  } catch (error: any) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Lỗi cập nhật vai trò' });
  }
});

// ==========================================
// 4. PUBLIC STUDENT ROUTES
// ==========================================

// Get public quiz by code
app.get('/api/public/quiz/:code', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const allPublic = await queryFirestoreCollection('quizPublic');
    const quiz = allPublic.find(q => q.code === code || q.id === req.params.code);

    if (!quiz) {
      return res.status(404).json({ error: `Không tìm thấy đề thi với mã "${code}".` });
    }

    if (quiz.status === 'closed') {
      return res.status(403).json({ error: 'Bài thi này hiện đã đóng hoặc hết hạn làm bài.' });
    }

    // Do NOT return password in response
    const sanitizedQuiz = { ...quiz };
    delete sanitizedQuiz.passwordPlain;
    res.json({ quiz: sanitizedQuiz });
  } catch (error: any) {
    console.error('Error fetching public quiz:', error);
    res.status(500).json({ error: 'Lỗi tải đề thi' });
  }
});

// Verify quiz password
app.post('/api/public/quiz/:id/verify-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const quiz = await getFirestoreDoc('quizPublic', id);
    if (!quiz) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    if (!quiz.hasPassword) return res.json({ valid: true });

    const expected = quiz.passwordPlain || '';
    const match = expected.trim() === (password || '').trim();
    if (!match) {
      return res.status(401).json({ valid: false, error: 'Mật khẩu bài thi không chính xác.' });
    }

    res.json({ valid: true });
  } catch (error: any) {
    console.error('Error verifying password:', error);
    res.status(500).json({ error: 'Lỗi kiểm tra mật khẩu' });
  }
});

// Submit and auto-grade exam attempt
app.post('/api/public/quiz/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, studentClass, studentSchool, answers, durationSeconds } = req.body;

    if (!studentName?.trim() || !studentClass?.trim()) {
      return res.status(400).json({ error: 'Họ tên và lớp là bắt buộc khi nộp bài.' });
    }

    // Load full quiz details with answer keys
    let detail = await getFirestoreDoc('quizDetails', id);
    let questions = detail?.questions;

    if (!questions || !Array.isArray(questions)) {
      questions = SAMPLE_CHEMISTRY_QUESTIONS;
    }

    const quizPub = await getFirestoreDoc('quizPublic', id);
    const totalPoints = quizPub?.totalPoints || 10;
    const minScore = quizPub?.minScoreToViewAnswers ?? 7.0;
    const allowViewAnswers = quizPub?.allowViewAnswers ?? true;
    const allowViewExplanation = quizPub?.allowViewExplanation ?? true;

    // Grade submission
    const graded = gradeSubmission(questions, answers || {}, {
      totalPoints,
      minScoreToViewAnswers: minScore,
      allowViewAnswers,
      allowViewExplanation
    });

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const attempt = {
      id: attemptId,
      quizId: id,
      quizCode: quizPub?.code || '',
      quizTitle: quizPub?.title || 'Bài thi trắc nghiệm',
      teacherId: quizPub?.teacherId || 'teacher',
      studentName: studentName.trim(),
      studentClass: studentClass.trim(),
      studentSchool: (studentSchool || '').trim(),
      startedAt: new Date(Date.now() - (durationSeconds || 60) * 1000).toISOString(),
      submittedAt: now,
      durationSeconds: durationSeconds || 60,
      score: graded.score,
      maxScore: graded.maxScore,
      correctCount: graded.correctCount,
      wrongCount: graded.wrongCount,
      unansweredCount: graded.unansweredCount,
      passedThreshold: graded.passedThreshold,
      canViewAnswers: graded.canViewAnswers,
      studentAnswers: answers || {},
      gradedQuestions: graded.gradedQuestions,
      status: 'submitted',
      createdAt: now
    };

    // Save attempt to Firestore
    await setFirestoreDoc('attempts', attemptId, attempt);

    res.json({
      message: 'Nộp bài và chấm điểm thành công',
      attempt
    });
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ error: 'Lỗi chấm điểm bài thi' });
  }
});

// ==========================================
// 5. VITE & STATIC FILES SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduQuiz Server running on port ${PORT}`);
  });
}

startServer();
