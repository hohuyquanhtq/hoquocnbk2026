import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './config';
import type { Quiz, QuizDetail, QuizPublic, QuizAttempt, UserProfile, UserRole } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ---------------- USER OPERATIONS ----------------

const SUPER_ADMIN_EMAIL = 'hohuyquanhtq@gmail.com';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function syncUserProfile(firebaseUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}): Promise<UserProfile> {
  const isSuperAdmin = (firebaseUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const fallbackProfile: UserProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'Giáo viên',
    photoURL: firebaseUser.photoURL || '',
    role: isSuperAdmin ? 'admin' : 'teacher',
    createdAt: new Date().toISOString()
  };

  try {
    const existing = await getUserProfile(firebaseUser.uid);
    if (existing) {
      if (isSuperAdmin && existing.role !== 'admin') {
        const updated: UserProfile = {
          ...existing,
          role: 'admin',
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), updated, { merge: true }).catch(() => {});
        return updated;
      }
      return existing;
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), fallbackProfile);
    return fallbackProfile;
  } catch (error) {
    console.warn('Lỗi ghi hồ sơ giáo viên vào Firestore, sử dụng hồ sơ dự phòng:', error);
    return fallbackProfile;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      role,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------- QUIZ OPERATIONS (TEACHER) ----------------

export async function saveQuiz(
  quiz: Quiz,
  quizDetail: QuizDetail,
  quizPublic: QuizPublic
): Promise<void> {
  const quizPath = `quizzes/${quiz.id}`;
  const detailPath = `quizDetails/${quiz.id}`;
  const publicPath = `quizPublic/${quiz.id}`;

  try {
    await setDoc(doc(db, 'quizzes', quiz.id), quiz);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, quizPath);
  }

  try {
    await setDoc(doc(db, 'quizDetails', quiz.id), quizDetail);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, detailPath);
  }

  try {
    await setDoc(doc(db, 'quizPublic', quiz.id), quizPublic);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }
}

export async function getTeacherQuizzes(teacherId: string, isAdmin = false): Promise<Quiz[]> {
  const path = 'quizzes';
  try {
    let q;
    if (isAdmin) {
      q = query(collection(db, 'quizzes'));
    } else {
      q = query(collection(db, 'quizzes'), where('teacherId', '==', teacherId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data() as Quiz);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getQuizDetail(quizId: string): Promise<QuizDetail | null> {
  const path = `quizDetails/${quizId}`;
  try {
    const snap = await getDoc(doc(db, 'quizDetails', quizId));
    if (!snap.exists()) return null;
    return snap.data() as QuizDetail;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateQuizStatus(quizId: string, status: 'draft' | 'published' | 'closed'): Promise<void> {
  const quizPath = `quizzes/${quizId}`;
  const publicPath = `quizPublic/${quizId}`;
  const now = new Date().toISOString();

  try {
    await updateDoc(doc(db, 'quizzes', quizId), { status, updatedAt: now });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, quizPath);
  }

  try {
    await updateDoc(doc(db, 'quizPublic', quizId), { status, updatedAt: now });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, publicPath);
  }
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const path = `quizzes/${quizId}`;
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
    await deleteDoc(doc(db, 'quizDetails', quizId));
    await deleteDoc(doc(db, 'quizPublic', quizId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- PUBLIC / STUDENT OPERATIONS ----------------

export async function getPublicQuizByCodeOrId(identifier: string): Promise<QuizPublic | null> {
  const path = 'quizPublic';
  try {
    // First try by direct ID
    const snap = await getDoc(doc(db, 'quizPublic', identifier));
    if (snap.exists()) {
      return snap.data() as QuizPublic;
    }

    // Otherwise search by code
    const q = query(collection(db, 'quizPublic'), where('code', '==', identifier.toUpperCase().trim()));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as QuizPublic;
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function submitQuizAttempt(attempt: QuizAttempt): Promise<void> {
  const path = `attempts/${attempt.id}`;
  try {
    await setDoc(doc(db, 'attempts', attempt.id), attempt);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getQuizAttempt(attemptId: string): Promise<QuizAttempt | null> {
  const path = `attempts/${attemptId}`;
  try {
    const snap = await getDoc(doc(db, 'attempts', attemptId));
    if (!snap.exists()) return null;
    return snap.data() as QuizAttempt;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getQuizAttemptsForTeacher(quizId: string): Promise<QuizAttempt[]> {
  const path = 'attempts';
  try {
    const q = query(collection(db, 'attempts'), where('quizId', '==', quizId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data() as QuizAttempt);
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getAllAttemptsForTeacher(teacherId: string, isAdmin = false): Promise<QuizAttempt[]> {
  const path = 'attempts';
  try {
    let q;
    if (isAdmin) {
      q = query(collection(db, 'attempts'));
    } else {
      q = query(collection(db, 'attempts'), where('teacherId', '==', teacherId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data() as QuizAttempt);
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
