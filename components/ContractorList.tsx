import React from 'react';
import { mockContractors } from '../mockData';

import { useNavigate } from 'react-router-dom';

const ContractorList: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Danh sách Nhà thầu</h2>
                    <p className="text-sm text-gray-500 mt-1">Quản lý thông tin và năng lực nhà thầu</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                    + Thêm nhà thầu
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Mã số DN</th>
                            <th className="px-6 py-4">Tên nhà thầu</th>
                            <th className="px-6 py-4">Số chứng chỉ năng lực</th>
                            <th className="px-6 py-4">Loại hình</th>
                            <th className="px-6 py-4">Địa chỉ</th>
                            <th className="px-6 py-4">Liên hệ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {mockContractors.map((contractor) => (
                            <tr key={contractor.ContractorID} onClick={() => navigate(`/contractors/${contractor.ContractorID}`)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                <td className="px-6 py-4 font-medium text-gray-900">{contractor.ContractorID}</td>
                                <td className="px-6 py-4 font-medium">{contractor.FullName}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                                        {contractor.CapCertCode}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {contractor.IsForeign ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                            Nước ngoài
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Trong nước
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 truncate max-w-xs" title={contractor.Address}>{contractor.Address}</td>
                                <td className="px-6 py-4">{contractor.ContactInfo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContractorList;
