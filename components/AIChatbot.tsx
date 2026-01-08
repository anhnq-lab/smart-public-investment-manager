import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ChevronDown, Settings, Key } from 'lucide-react';
import { mockProjects, mockContractors, mockPayments, mockTasks, formatCurrency } from '../mockData';
import { ProjectStatus, ProjectGroup } from '../types';

interface Message {
    id: number;
    text: React.ReactNode;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const SUGGESTIONS = [
    "Tổng vốn đầu tư bao nhiêu?",
    "Dự án nào lớn nhất?",
    "Tiến độ giải ngân hiện tại?",
    "Danh sách nhà thầu uy tín?"
];

export const AIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('qt_gemini_key') || '');
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Xin chào! Tôi là trợ lý AI (Gemini). Vui lòng nhập API Key trong phần cài đặt để tôi có thể phân tích dữ liệu giúp bạn.", sender: 'bot', timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const saveApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem('qt_gemini_key', key);
        setShowSettings(false);
        setMessages(prev => [...prev, { id: Date.now(), text: "✅ Đã lưu API Key! Bây giờ bạn có thể hỏi tôi bất cứ điều gì về dữ liệu dự án.", sender: 'bot', timestamp: new Date() }]);
    };

    // --- GEMINI API CALL REPLACEMENT ---
    const callGeminiPro = async (query: string) => {
        if (!apiKey) {
            return "⚠️ Vui lòng nhập Google Gemini API Key trong phần cài đặt (biểu tượng bánh răng) để sử dụng tính năng này.";
        }

        // 1. Prepare Context Data (Optimized for Prompt Size)
        const contextData = {
            summary: {
                totalProjects: mockProjects.length,
                totalInvestment: formatCurrency(mockProjects.reduce((a, b) => a + b.TotalInvestment, 0)),
                totalDisbursed: formatCurrency(mockPayments.filter(p => p.Status === 'Transferred').reduce((a, b) => a + b.Amount, 0))
            },
            projects: mockProjects.slice(0, 30).map(p => ({
                id: p.ProjectID,
                name: p.ProjectName,
                total: formatCurrency(p.TotalInvestment),
                status: p.Status === 1 ? 'Preparation' : p.Status === 2 ? 'Execution' : 'Finished',
                location: p.LocationCode,
                investor: p.InvestorName,
                contractor: p.MainContractorName
            })),
            urgentTasks: mockTasks.filter(t => t.Priority === 'Urgent').map(t => ({
                title: t.Title,
                deadline: t.DueDate,
                status: t.Status
            }))
        };

        // 2. Construct Prompt
        const prompt = `
            Bạn là một trợ lý AI thông minh chuyên về Quản lý Dự án Đầu tư Công.
            Hãy trả lời câu hỏi của người dùng dựa trên dữ liệu JSON dưới đây:
            
            ${JSON.stringify(contextData)}

            LƯU Ý:
            - Trả lời ngắn gọn, súc tích, đi thẳng vào vấn đề.
            - Nếu câu hỏi về số liệu, hãy đưa ra con số chính xác.
            - Nếu câu hỏi cần suy luận (ví dụ: "Dự án nào rủi ro?"), hãy dựa vào trạng thái và tiến độ để đưa ra ý kiến.
            - Format câu trả lời bằng Markdown (Bold, List) cho đẹp mắt.
            - Luôn dùng tiếng Việt chuyên ngành xây dựng/đầu tư công.

            Câu hỏi: "${query}"
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error("Gemini Error:", data.error);
                return `❌ Lỗi từ Gemini API: ${data.error.message}`;
            }

            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "🤔 Không nhận được phản hồi từ AI. Vui lòng thử lại.";
            }

        } catch (error) {
            console.error("Network Error:", error);
            return "❌ Lỗi kết nối mạng. Vui lòng kiểm tra Internet hoặc API Key.";
        }
    };

    const handleSend = async (text: string = inputText) => {
        if (!text.trim()) return;

        // Add User Message
        const userMsg: Message = { id: Date.now(), text, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);

        // Call AI
        const responseText = await callGeminiPro(text);

        const botMsg: Message = { id: Date.now() + 1, text: responseText, sender: 'bot', timestamp: new Date() };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white shadow-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Gemini AI Assistant</h3>
                                <div className="flex items-center gap-1.5 opacity-90">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-xs font-medium">Power by Google Gemini</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Cài đặt API Key">
                                <Settings className="w-5 h-5" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Settings Area */}
                    {showSettings && (
                        <div className="bg-gray-100 p-4 border-b border-gray-200 animate-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1">
                                <Key className="w-3 h-3" /> API Key (Google Gemini)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Paste key here..."
                                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                                <button
                                    onClick={() => saveApiKey(apiKey)}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Lưu
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                                Key được lưu an toàn trong trình duyệt của bạn (LocalStorage).
                                <br />Bạn có thể lấy key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">aistudio.google.com</a>.
                            </p>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-hide">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                                    {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                    <div className={`text-[10px] mt-1.5 font-medium opacity-70 ${msg.sender === 'user' ? 'text-indigo-100' : 'text-gray-400'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-end gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                    <span className="text-xs text-gray-500 font-medium">Gemini đang suy nghĩ...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {!isTyping && messages[messages.length - 1].sender === 'bot' && !showSettings && (
                        <div className="px-4 pb-2 bg-gray-50/50">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(s)}
                                        className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-semibold rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={showSettings} // Disable input when settings open
                                placeholder={showSettings ? "Vui lòng lưu API Key trước..." : "Nhập câu hỏi của bạn..."}
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!inputText.trim() || isTyping || showSettings}
                                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 mt-2">
                            Gemini có thể đưa ra thông tin không chính xác, vui lòng kiểm tra đối chiếu.
                        </p>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-110 transition-all duration-300"
                >
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                    </span>
                    <MessageCircle className="w-7 h-7" />

                    {/* Tooltip */}
                    <div className="absolute right-full mr-4 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none">
                        Hỏi AI về dự án
                        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                </button>
            )}
        </div>
    );
};
