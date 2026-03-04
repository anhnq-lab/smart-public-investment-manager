import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, User, Sparkles, Database, RefreshCw } from 'lucide-react';
import { sendMessageToGemini, ChatMessage, isAIAvailable } from '../../services/aiService';
import { QUICK_SUGGESTIONS } from '../../services/ai/aiTools';

// Simple markdown-ish renderer for AI responses
function renderMessageText(text: string) {
    // Split by lines and process
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listKey = 0;

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-0.5 my-1">
                    {listItems.map((item, i) => (
                        <li key={i} className="text-sm">{formatInline(item)}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Bullet list
        if (/^[\-\*•]\s+/.test(line)) {
            listItems.push(line.replace(/^[\-\*•]\s+/, ''));
            continue;
        }

        // Numbered list
        if (/^\d+[\.\)]\s+/.test(line)) {
            listItems.push(line.replace(/^\d+[\.\)]\s+/, ''));
            continue;
        }

        flushList();

        // Headers
        if (line.startsWith('### ')) {
            elements.push(<h4 key={i} className="font-bold text-xs mt-2 mb-1">{line.replace('### ', '')}</h4>);
        } else if (line.startsWith('## ')) {
            elements.push(<h3 key={i} className="font-bold text-sm mt-2 mb-1">{line.replace('## ', '')}</h3>);
        } else if (line.startsWith('# ')) {
            elements.push(<h2 key={i} className="font-bold text-sm mt-2 mb-1">{line.replace('# ', '')}</h2>);
        } else if (line.trim() === '') {
            elements.push(<div key={i} className="h-1" />);
        } else {
            elements.push(<p key={i} className="text-sm my-0.5">{formatInline(line)}</p>);
        }
    }
    flushList();

    return <div className="space-y-0.5">{elements}</div>;
}

// Format inline markdown: **bold**, *italic*, `code`
function formatInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Code
        const codeMatch = remaining.match(/`(.+?)`/);

        if (boldMatch && boldMatch.index !== undefined && (!codeMatch || boldMatch.index < (codeMatch.index ?? Infinity))) {
            if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index));
            parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
            remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        } else if (codeMatch && codeMatch.index !== undefined) {
            if (codeMatch.index > 0) parts.push(remaining.slice(0, codeMatch.index));
            parts.push(
                <code key={key++} className="bg-slate-200 dark:bg-slate-600 px-1 rounded text-xs font-mono">
                    {codeMatch[1]}
                </code>
            );
            remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
        } else {
            parts.push(remaining);
            break;
        }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export const AIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            text: 'Xin chào! Tôi là trợ lý ảo QLDA, được tích hợp AI thông minh. Tôi có thể:\n\n- 📊 Tra cứu dữ liệu dự án, hợp đồng, thanh toán **trực tiếp từ hệ thống**\n- ⚠️ Phân tích rủi ro và cảnh báo\n- 📋 Tư vấn quy trình, quy định pháp luật\n- 📝 Hỗ trợ soạn thảo văn bản\n\nHãy thử hỏi tôi!',
            sender: 'ai',
            timestamp: new Date(),
        },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = async (text?: string) => {
        const msgText = text || input.trim();
        if (!msgText) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: msgText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setIsQuerying(true);
        setShowSuggestions(false);

        try {
            const responseText = await sendMessageToGemini(messages, msgText);
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chatbot Error:', error);
            let errorMessage = 'Xin lỗi, tôi đang gặp sự cố.';
            if (error instanceof Error) {
                if (error.message.includes('API_KEY')) {
                    errorMessage = 'Chưa cấu hình Gemini API Key. Vui lòng đặt VITE_GEMINI_API_KEY trong file .env.local';
                } else {
                    errorMessage += ` (${error.message})`;
                }
            }

            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: errorMessage,
                sender: 'ai',
                timestamp: new Date(),
                isError: true,
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            setIsQuerying(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                id: Date.now().toString(),
                text: 'Đã xóa lịch sử. Tôi sẵn sàng hỗ trợ bạn!',
                sender: 'ai',
                timestamp: new Date(),
            },
        ]);
        setShowSuggestions(true);
    };

    const aiAvailable = isAIAvailable();

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center gap-2 group"
            >
                <div className="relative">
                    <Sparkles size={24} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
                    Trợ lý AI
                </span>
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 transition-all duration-300 flex flex-col border border-slate-200 dark:border-slate-700
            ${isExpanded ? 'w-[640px] h-[80vh]' : 'w-[400px] h-[540px]'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <span className="font-semibold text-sm">Trợ lý AI QLDA</span>
                        <div className="flex items-center gap-1 text-[10px] text-blue-100">
                            <Database size={10} />
                            <span>Kết nối dữ liệu thực</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClearChat}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Xóa lịch sử chat"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Đóng"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 
                                ${msg.sender === 'user' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-emerald-100 dark:bg-emerald-900'}`}
                            >
                                {msg.sender === 'user' ? (
                                    <User size={14} className="text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <Bot size={14} className="text-emerald-600 dark:text-emerald-400" />
                                )}
                            </div>
                            <div
                                className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                                    } ${msg.isError ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : ''}`}
                            >
                                {msg.sender === 'ai' ? renderMessageText(msg.text) : msg.text}
                                <div className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                                <Bot size={14} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                                    </div>
                                    {isQuerying && (
                                        <span className="text-[10px] text-blue-500 dark:text-blue-400 flex items-center gap-1">
                                            <Database size={10} className="animate-pulse" />
                                            Đang truy vấn dữ liệu...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick suggestions */}
                {showSuggestions && !isLoading && messages.length <= 2 && (
                    <div className="space-y-2 pt-2">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">💡 Gợi ý câu hỏi:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(s.prompt)}
                                    className="text-[11px] px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
                {!aiAvailable && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg mb-2">
                        ⚠️ Chưa cấu hình Gemini API Key
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Hỏi về dự án, hợp đồng, giải ngân..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-slate-50 dark:disabled:bg-slate-700 bg-white dark:bg-slate-700 dark:text-white placeholder-slate-400"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-600 dark:disabled:to-slate-600 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Powered by Gemini AI — Kết nối dữ liệu thực
                    </span>
                </div>
            </div>
        </div>
    );
};
