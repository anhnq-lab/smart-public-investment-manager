import React, { useEffect, useRef } from 'react';
import { ProjectStatus } from '../types';

interface Project {
    ProjectName: string;
    Status: ProjectStatus;
    TotalInvestment: number;
    Coordinates?: { lat: number; lng: number };
}

interface InteractiveMapProps {
    projects: Project[];
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ projects }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleLoad = () => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'UPDATE_PROJECTS',
                    payload: projects
                }, '*');
            }
        };

        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', handleLoad);
            // If already loaded (rare in React render cycle but possible), trigger manually
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                handleLoad();
            }
        }

        return () => {
            if (iframe) {
                iframe.removeEventListener('load', handleLoad);
            }
        };
    }, []);

    // Also trigger update when projects change if iframe is already loaded
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_PROJECTS',
                payload: projects
            }, '*');
        }
    }, [projects]);

    return (
        <iframe
            ref={iframeRef}
            src="map.html"
            className="w-full h-full rounded-2xl border-none custom-map-iframe"
            title="Project Map"
            style={{ width: '100%', height: '100%', minHeight: '500px' }}
        />
    );
};

export default InteractiveMap;
