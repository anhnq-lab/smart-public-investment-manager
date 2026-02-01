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
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Thành viên dự án ({members.length})
                </h3>
            </div>

            <div className="space-y-2">
                {members.map((member, idx) => (
                    <div
                        key={member.EmployeeID}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group"
                        onClick={() => onViewMember?.(member.EmployeeID)}
                    >
                        {/* Avatar */}
                        <img
                            src={member.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.FullName)}&background=random`}
                            alt={member.FullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {member.FullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {member.Position} • {member.Department}
                            </p>
                        </div>

                        {/* Contact Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {member.Email && (
                                <a
                                    href={`mailto:${member.Email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title={member.Email}
                                >
                                    <Mail className="w-4 h-4" />
                                </a>
                            )}
                            {member.Phone && (
                                <a
                                    href={`tel:${member.Phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                    title={member.Phone}
                                >
                                    <Phone className="w-4 h-4" />
                                </a>
                            )}
                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
