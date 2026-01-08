
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  CreditCard,
  FileBox,
  Settings,
  LogOut,
  UserCircle,
  CheckSquare,
  BarChart2,
  BookOpen,
  User
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Dashboard cá nhân', path: '/my-dashboard', icon: User },
    { name: 'Dự án đầu tư', path: '/projects', icon: Briefcase },
    { name: 'Công việc', path: '/tasks', icon: CheckSquare },
    { name: 'Nhân sự', path: '/employees', icon: UserCircle },
    { name: 'Nhà thầu', path: '/contractors', icon: Users },
    { name: 'Hợp đồng', path: '/contracts', icon: FileText },
    { name: 'Thanh toán', path: '/payments', icon: CreditCard },
    { name: 'Hồ sơ tài liệu', path: '/documents', icon: FileBox },
    { name: 'Báo cáo', path: '/reports', icon: BarChart2 },
    { name: 'Quy chế làm việc', path: '/regulations', icon: BookOpen },
  ];

  return (
    <div className="h-full flex flex-col justify-between py-6 px-4">
      <div>
        <div className="flex items-center gap-3 px-4 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-xl">QL</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">Ban QLDA</h1>
            <p className="text-xs text-gray-500 font-medium">Đầu tư công</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <item.icon className="w-5 h-5 transition-colors group-hover:text-current" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-1 pt-6 border-t border-gray-100">
        <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Cài đặt</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
