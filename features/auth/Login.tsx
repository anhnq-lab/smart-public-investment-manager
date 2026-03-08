import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Building2, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    // Set default demo credentials
    const [username, setUsername] = useState('Admin');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const success = await login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError('Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-slate-700">
                <div className="bg-[#8B1A1A] p-8 pb-6 text-center relative overflow-hidden">
                    {/* Decorative drum pattern background */}
                    <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: 'url("/bg-header-login.png")', backgroundSize: '120%', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }}></div>
                    <img src="/hcma-logo.png" alt="Logo HVCTQG HCM" className="relative z-10 w-44 mx-auto mb-4 drop-shadow-xl object-contain" />
                    <h1 className="relative z-10 text-base font-extrabold text-white leading-snug uppercase" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)', letterSpacing: '0.5px' }}>Ban Quản lý dự án đầu tư xây dựng chuyên ngành</h1>
                    <p className="relative z-10 text-yellow-200/90 text-sm mt-2 font-medium tracking-wide">Học viện Chính trị Quốc gia Hồ Chí Minh</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Tài khoản (Username / Email / SĐT)</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Nhập tên đăng nhập hoặc email"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="text-right">
                                <a href="#" className="text-xs text-primary-600 hover:underline">Quên mật khẩu?</a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-[#B71C1C] to-[#8B1A1A] hover:from-[#9B1515] hover:to-[#6D1414] text-white font-bold rounded-xl shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all hover:-translate-y-0.5"
                        >
                            Đăng nhập
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 text-center">
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            Hỗ trợ kỹ thuật: 1900 1234 (Ext: 101)<br />
                            Phiên bản 2.5.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;