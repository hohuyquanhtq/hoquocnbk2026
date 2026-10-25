import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, UserX, Search, Users, ArrowLeft } from 'lucide-react';
import type { UserProfile, UserRole } from '../../types';
import { getAllUsers, updateUserRole } from '../../firebase/firestoreService';
import { useToast } from '../common/Toast';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await getAllUsers();
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
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => (u.uid === userId ? { ...u, role: newRole } : u)));
      showToast('Đã cập nhật phân quyền thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi cập nhật quyền: ' + err.message, 'error');
    }
  };

  const filtered = users.filter(
    u =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <p className="text-xs text-slate-500">Cấp quyền Giáo viên, phân quyền tài khoản người dùng</p>
          </div>
        </div>
      </div>

      {/* User Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo email hoặc họ tên người dùng..."
          className="flex-1 text-xs border-none focus:outline-hidden"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách người dùng...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Chưa có người dùng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Họ tên &amp; Email</th>
                  <th className="px-4 py-3.5">Vai trò hiện tại</th>
                  <th className="px-4 py-3.5">Ngày tham gia</th>
                  <th className="px-5 py-3.5 text-right">Hành động cấp quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{u.displayName || 'Chưa đặt tên'}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{u.email}</div>
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
                          : 'Chờ duyệt'}
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
                        <option value="teacher">Cấp quyền Giáo viên</option>
                        <option value="admin">Quản trị viên (Admin)</option>
                        <option value="pending">Khóa / Chờ duyệt</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
