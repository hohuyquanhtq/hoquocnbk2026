import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Users,
  ArrowLeft,
  UserPlus,
  Lock,
  User,
  KeyRound
} from 'lucide-react';
import type { UserProfile, UserRole } from '../../types';
import { apiGetAdminUsers, apiAddTeacher, apiUpdateUserRole } from '../../services/api';
import { useToast } from '../common/Toast';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add teacher form modal / card
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await apiGetAdminUsers();
      setUsers(list);
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi tải danh sách người dùng', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await apiUpdateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => (u.uid === userId ? { ...u, role: newRole } : u)));
      showToast('Đã cập nhật phân quyền thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi cập nhật quyền: ' + err.message, 'error');
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPassword) {
      showToast('Vui lòng nhập Họ tên và Mật khẩu', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const created = await apiAddTeacher(newFullName.trim(), newPassword, newRole);
      setUsers(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewFullName('');
      setNewPassword('');
      showToast(`Đã thêm tài khoản giáo viên "${created.displayName}" thành công!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi thêm giáo viên: ' + err.message, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const filtered = users.filter(
    u =>
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-slate-900">Quản trị viên hệ thống (Admin)</h2>
            </div>
            <p className="text-xs text-slate-500">Cấp quyền Giáo viên, quản lý tài khoản nội bộ bảo mật</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cấp tài khoản Giáo viên mới</span>
        </button>
      </div>

      {/* User Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo họ tên giáo viên..."
          className="flex-1 text-xs border-none focus:outline-hidden"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách tài khoản...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Chưa có tài khoản nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Họ tên giáo viên</th>
                  <th className="px-4 py-3.5">Vai trò hiện tại</th>
                  <th className="px-4 py-3.5">Ngày tạo</th>
                  <th className="px-5 py-3.5 text-right">Hành động cấp quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{u.displayName || 'Chưa đặt tên'}</div>
                      <div className="text-slate-400 text-[11px] font-mono">UID: {u.uid}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'teacher'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role === 'admin'
                          ? 'Quản trị viên'
                          : u.role === 'teacher'
                          ? 'Giáo viên'
                          : 'Chờ duyệt / Khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.uid, e.target.value as UserRole)}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium"
                      >
                        <option value="teacher">Quyền Giáo viên</option>
                        <option value="admin">Quản trị viên (Admin)</option>
                        <option value="pending">Khóa tài khoản</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Cấp tài khoản Giáo viên mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên giáo viên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="Ví dụ: Cô Trần Thị Mai"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu đăng nhập ban đầu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cấp cho giáo viên"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai trò phân quyền
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-medium"
                >
                  <option value="teacher">Giáo viên (Tạo &amp; quản lý đề)</option>
                  <option value="admin">Quản trị viên (Toàn quyền hệ thống)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isAdding ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
