import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor, ChevronRight, Palette, Bell, Shield, User } from 'lucide-react';

const Settings: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const themeOptions = [
        {
            key: 'light' as const,
            label: 'Sáng',
            description: 'Giao diện nền trắng, phù hợp ban ngày',
            icon: Sun,
            preview: {
                bg: 'bg-white',
                sidebar: 'bg-gray-100',
                header: 'bg-white',
                card: 'bg-gray-50',
                text: 'bg-gray-300',
                accent: 'bg-blue-500',
            }
        },
        {
            key: 'dark' as const,
            label: 'Tối',
            description: 'Giao diện nền tối, giảm mỏi mắt',
            icon: Moon,
            preview: {
                bg: 'bg-slate-900',
                sidebar: 'bg-slate-800',
                header: 'bg-slate-800',
                card: 'bg-slate-700',
                text: 'bg-slate-500',
                accent: 'bg-blue-500',
            }
        },
    ];

    const settingSections = [
        { icon: User, label: 'Thông tin cá nhân', description: 'Cập nhật hồ sơ, ảnh đại diện', disabled: true },
        { icon: Bell, label: 'Thông báo', description: 'Cấu hình cảnh báo và email', disabled: true },
        { icon: Shield, label: 'Bảo mật', description: 'Đổi mật khẩu, xác thực 2 bước', disabled: true },
    ];

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Cài đặt</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Tùy chỉnh giao diện và cấu hình hệ thống</p>
            </div>

            {/* Appearance Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                        <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Giao diện</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Chọn chế độ hiển thị phù hợp</p>
                    </div>
                </div>

                <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {themeOptions.map(opt => {
                            const isActive = theme === opt.key;
                            return (
                                <button
                                    key={opt.key}
                                    onClick={() => setTheme(opt.key)}
                                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 group ${isActive
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                                        }`}
                                >
                                    {/* Mini Preview */}
                                    <div className={`${opt.preview.bg} rounded-lg border border-gray-200 dark:border-slate-600 p-2 mb-3 flex gap-1.5 h-20 overflow-hidden`}>
                                        {/* Sidebar Preview */}
                                        <div className={`${opt.preview.sidebar} rounded w-6 flex flex-col gap-1 p-1`}>
                                            <div className={`${opt.preview.accent} rounded-sm h-1`}></div>
                                            <div className={`${opt.preview.text} rounded-sm h-1`}></div>
                                            <div className={`${opt.preview.text} rounded-sm h-1`}></div>
                                        </div>
                                        {/* Content Preview */}
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className={`${opt.preview.header} rounded h-3`}></div>
                                            <div className="flex gap-1 flex-1">
                                                <div className={`${opt.preview.card} rounded flex-1`}></div>
                                                <div className={`${opt.preview.card} rounded flex-1`}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Label */}
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-lg ${isActive
                                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                                : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                                            }`}>
                                            <opt.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-slate-100'
                                                }`}>{opt.label}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400">{opt.description}</p>
                                        </div>
                                    </div>

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Other Settings (Placeholder) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {settingSections.map((section, idx) => (
                        <div key={idx} className="px-5 py-4 flex items-center justify-between opacity-60 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-xl">
                                    <section.icon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{section.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{section.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 px-2 py-0.5 rounded-md uppercase">Sắp ra mắt</span>
                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Settings;
