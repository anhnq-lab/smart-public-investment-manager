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
  FolderTree,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ========================================
// SIDEBAR COMPONENT — Premium HCMA Theme
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
  { name: 'Môi trường dữ liệu chung', path: '/cde', icon: FolderTree },
  { name: 'Văn bản pháp luật', path: '/legal-documents', icon: Scale },
  { name: 'Báo cáo', path: '/reports', icon: BarChart2 },
  { name: 'Quy chế làm việc', path: '/regulations', icon: BookOpen },
];

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  onClose
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.Role === 'Admin';

  const adminItems: NavItem[] = isAdmin ? [
    { name: 'Quản lý tài khoản', path: '/user-accounts', icon: ShieldCheck },
  ] : [];

  return (
    <div
      className={`
        h-full flex flex-col justify-between
        transition-all duration-300 ease-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
      style={{
        background: 'linear-gradient(180deg, #C85A10 0%, #A84508 60%, #8B3706 100%)',
      }}
    >
      {/* ── Logo & Brand ── */}
      <div>
        <div
          className={`flex items-center gap-3 px-4 h-14 shrink-0 ${isCollapsed ? 'justify-center px-2' : ''}`}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FDDF8B 0%, #F99715 100%)',
              boxShadow: '0 2px 8px rgba(249, 151, 21, 0.35)',
            }}
          >
            <span className="font-extrabold text-sm" style={{ color: '#7C3308' }}>HV</span>
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1 className="text-[13px] font-bold text-white leading-tight truncate">Ban QLDA ĐTXD CN</h1>
              <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>Học viện CTQG HCM</p>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="mt-2 px-2 space-y-0.5 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {[...navItems, ...adminItems].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) => `
                flex items-center gap-2.5 px-3 py-2 rounded-lg
                transition-all duration-150 group relative text-[13px]
                ${isCollapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'font-semibold'
                  : 'sidebar-nav-item'
                }
              `}
              style={({ isActive }) => isActive ? {
                background: 'rgba(255,255,255,0.18)',
                color: '#ffffff',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              } : {
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator — subtle left bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: '#FDDF8B' }}
                    />
                  )}

                  <item.icon className={`
                    w-[18px] h-[18px] shrink-0 transition-transform
                    ${isActive ? '' : 'group-hover:scale-110'}
                  `} />

                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}

                  {/* Badge */}
                  {item.badge && !isCollapsed && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded-md leading-none"
                      style={{
                        background: '#FDDF8B',
                        color: '#7C3308',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.badge && isCollapsed && (
                    <span
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{ background: '#FDDF8B' }}
                    />
                  )}

                  {/* Tooltip for collapsed */}
                  {isCollapsed && (
                    <span
                      className="
                        absolute left-full ml-2 px-2 py-1
                        text-white text-xs rounded-lg
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        whitespace-nowrap z-50 shadow-lg
                        transition-opacity duration-200
                      "
                      style={{ background: '#7C3308' }}
                    >
                      {item.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Footer ── */}
      <div
        className="px-2 py-3 space-y-0.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
              transition-all duration-150 text-[13px]
              ${isCollapsed ? 'justify-center' : ''}
            `}
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-[18px] h-[18px]" />
            ) : (
              <>
                <ChevronLeft className="w-[18px] h-[18px]" />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        )}

        {/* Settings */}
        <NavLink
          to="/settings"
          className={`
            flex items-center gap-2.5 px-3 py-2 rounded-lg
            transition-colors text-[13px]
            ${isCollapsed ? 'justify-center' : ''}
          `}
          style={{ color: 'rgba(255,255,255,0.5)' }}
          title={isCollapsed ? 'Cài đặt' : undefined}
        >
          <Settings className="w-[18px] h-[18px]" />
          {!isCollapsed && <span>Cài đặt</span>}
        </NavLink>

        {/* Logout */}
        <button
          onClick={() => {/* Handle logout */ }}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
            transition-all duration-150 text-[13px]
            ${isCollapsed ? 'justify-center' : ''}
          `}
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#FDDF8B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
          title={isCollapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
