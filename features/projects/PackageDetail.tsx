
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ArrowLeft } from 'lucide-react';

const PackageDetail: React.FC = () => {
    const { projectId, packageId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chi tiết gói thầu</h1>
                    <p className="text-gray-500">Dự án: {projectId} - Gói thầu: {packageId}</p>
                </div>
            </div>

            <Card className="p-8 text-center text-gray-500">
                <p>Nội dung chi tiết gói thầu đang được xây dựng.</p>
            </Card>
        </div>
    );
};

export default PackageDetail;
