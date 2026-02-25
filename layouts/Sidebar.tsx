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
  User,
  ChevronLeft,
  ChevronRight,
  Scale,
} from 'lucide-react';

// ========================================
// SIDEBAR COMPONENT - Design System v2
// ========================================

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
  { name: 'Dashboard cá nhân', path: '/my-dashboard', icon: User },
  { name: 'Dự án đầu tư', path: '/projects', icon: Briefcase },
  { name: 'Công việc', path: '/tasks', icon: CheckSquare, badge: 5 },
  { name: 'Nhân sự', path: '/employees', icon: UserCircle },
  { name: 'Nhà thầu', path: '/contractors', icon: Users },
  { name: 'Hợp đồng', path: '/contracts', icon: FileText },
  { name: 'Thanh toán', path: '/payments', icon: CreditCard },
  { name: 'Hồ sơ tài liệu', path: '/documents', icon: FileBox },
  { name: 'Văn bản pháp luật', path: '/legal-documents', icon: Scale },
  { name: 'Báo cáo', path: '/reports', icon: BarChart2 },
  { name: 'Quy chế làm việc', path: '/regulations', icon: BookOpen },
];

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  onClose
}) => {
  return (
    <div className={`
            h-full flex flex-col justify-between py-6 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800
            transition-all duration-300 ease-out
            ${isCollapsed ? 'w-20 px-2' : 'w-64 px-4'}
        `}>
      {/* Header */}
      <div>
        <div className={`
                    flex items-center gap-3 mb-8 px-2
                    ${isCollapsed ? 'justify-center' : ''}
                `}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
            <span className="text-white font-bold text-lg">HV</span>
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-gray-800 dark:text-slate-100 leading-tight">Ban QLDA ĐTXD CN</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Học viện CTQG HCM</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl 
                                transition-all duration-200 group relative
                                ${isCollapsed ? 'justify-center' : ''}
                                ${isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-200'
                }
                            `}
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
                  )}

                  <item.icon className={`
                                        w-5 h-5 shrink-0 transition-transform
                                        ${isActive ? '' : 'group-hover:scale-110'}
                                    `} />

                  {!isCollapsed && (
                    <span className="flex-1 truncate text-sm">{item.name}</span>
                  )}

                  {/* Badge */}
                  {item.badge && !isCollapsed && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-danger-100 text-danger-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.badge && isCollapsed && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
                  )}

                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <span className="
                                            absolute left-full ml-2 px-2 py-1 
                                            bg-gray-800 dark:bg-slate-700 text-white text-xs rounded-lg
                                            opacity-0 group-hover:opacity-100 pointer-events-none
                                            whitespace-nowrap z-50 shadow-lg
                                            transition-opacity duration-200
                                        ">
                      {item.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="space-y-1 pt-4 border-t border-gray-100 dark:border-slate-800">
        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-300
                            transition-all duration-200
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Thu gọn</span>
              </>
            )}
          </button>
        )}

        {/* Settings */}
        <NavLink
          to="/settings"
          className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-200
                        transition-colors
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
          title={isCollapsed ? 'Cài đặt' : undefined}
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Cài đặt</span>}
        </NavLink>

        {/* Logout */}
        <button
          onClick={() => {/* Handle logout */ }}
          className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20
                        transition-colors
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
          title={isCollapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
