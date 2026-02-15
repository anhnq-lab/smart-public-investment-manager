/**
 * BimShortcutsModal — Keyboard shortcuts reference for BIM Viewer
 */
import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface BimShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}

const SHORTCUTS = [
    {
        category: 'Navigation', items: [
            { key: '0', action: 'Isometric view' },
            { key: '1', action: 'Front view' },
            { key: '2', action: 'Back view' },
            { key: '3', action: 'Left view' },
            { key: '4', action: 'Right view' },
            { key: '5', action: 'Top view' },
            { key: '6', action: 'Bottom view' },
            { key: 'F', action: 'Fit all' },
        ]
    },
    {
        category: 'Tools', items: [
            { key: 'V', action: 'Select tool' },
            { key: 'Esc', action: 'Deselect / Cancel' },
            { key: 'Delete', action: 'Clear sections & measurements' },
        ]
    },
    {
        category: 'Visibility', items: [
            { key: 'I', action: 'Isolate selected' },
            { key: 'H', action: 'Hide selected' },
            { key: 'Shift+H', action: 'Show all' },
        ]
    },
    {
        category: 'Mouse', items: [
            { key: 'Left Click', action: 'Select element' },
            { key: 'Scroll', action: 'Zoom in/out' },
            { key: 'Right Drag', action: 'Rotate' },
            { key: 'Middle Drag', action: 'Pan' },
        ]
    },
];

export const BimShortcutsModal: React.FC<BimShortcutsModalProps> = ({ isOpen, onClose, isDarkMode }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className={`
                    relative z-10 w-[400px] max-h-[80%] overflow-auto rounded-2xl border shadow-2xl
                    ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
                `}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-blue-400" />
                        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Keyboard Shortcuts</h3>
                    </div>
                    <button onClick={onClose} className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {SHORTCUTS.map(group => (
                        <div key={group.category}>
                            <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                {group.category}
                            </h4>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <div key={item.key} className={`flex items-center justify-between py-1 px-2 rounded ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                        <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{item.action}</span>
                                        <kbd className={`
                                            text-[10px] font-mono px-2 py-0.5 rounded border min-w-[32px] text-center
                                            ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-gray-100 border-gray-200 text-gray-600'}
                                        `}>
                                            {item.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className={`p-3 border-t text-center ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        Press <kbd className={`px-1 py-0.5 rounded text-[9px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>?</kbd> or <kbd className={`px-1 py-0.5 rounded text-[9px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>Esc</kbd> to close
                    </p>
                </div>
            </div>
        </div>
    );
};
