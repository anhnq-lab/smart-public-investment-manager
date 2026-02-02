import React from 'react';
import { XeokitViewer } from './XeokitViewer';

interface BIMViewerProps {
    projectId: string;
}

/**
 * BIM Viewer component using xeokit SDK
 * Supports loading IFC files directly in the browser
 */
export const BIMViewer: React.FC<BIMViewerProps> = ({ projectId }) => {
    return <XeokitViewer projectId={projectId} />;
};

export default BIMViewer;
