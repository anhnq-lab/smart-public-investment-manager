import React from 'react';
import { Users, Mail, Phone, ExternalLink } from 'lucide-react';
import { Employee } from '@/types';

interface ProjectTeamSectionProps {
    members: Employee[];
    onViewMember?: (employeeId: string) => void;
}

export const ProjectTeamSection: React.FC<ProjectTeamSectionProps> = ({
    members,
    onViewMember
}) => {
    if (!members || members.length === 0) {
        return (
            <div className="text-center py-6 text-gray-400 text-sm">
                Chưa có thành viên tham gia dự án
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Thành viên dự án ({members.length})
                </h3>
            </div>

            <div className="space-y-2">
                {members.map((member, idx) => (
                    <div
                        key={member.EmployeeID}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
                        onClick={() => onViewMember?.(member.EmployeeID)}
                    >
                        {/* Avatar */}
                        <img
                            src={member.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.FullName)}&background=random`}
                            alt={member.FullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-sm"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {member.FullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {member.Position} • {member.Department}
                            </p>
                        </div>

                        {/* Contact Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {member.Email && (
                                <a
                                    href={`mailto:${member.Email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                                    title={member.Email}
                                >
                                    <Mail className="w-4 h-4" />
                                </a>
                            )}
                            {member.Phone && (
                                <a
                                    href={`tel:${member.Phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors"
                                    title={member.Phone}
                                >
                                    <Phone className="w-4 h-4" />
                                </a>
                            )}
                            <ExternalLink className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-gray-400 dark:group-hover:text-slate-400" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
