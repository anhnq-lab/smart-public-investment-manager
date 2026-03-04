import React, { useEffect, useRef, useCallback } from 'react';
import { ProjectStatus } from '../../types';

interface Project {
    ProjectID?: string;
    ProjectName: string;
    Status: ProjectStatus;
    TotalInvestment: number;
    Coordinates?: { lat: number; lng: number };
    LocationCode?: string;
}

interface InteractiveMapProps {
    projects: Project[];
}

// Vietnamese province center coordinates fallback
const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
    'hà nội': { lat: 21.0285, lng: 105.8542 },
    'hồ chí minh': { lat: 10.8231, lng: 106.6297 },
    'hà tĩnh': { lat: 18.3559, lng: 105.8877 },
    'đà nẵng': { lat: 16.0544, lng: 108.2022 },
    'hải phòng': { lat: 20.8449, lng: 106.6881 },
    'cần thơ': { lat: 10.0452, lng: 105.7469 },
    'nghệ an': { lat: 18.6739, lng: 105.6813 },
    'thanh hóa': { lat: 19.8067, lng: 105.7852 },
    'bắc ninh': { lat: 21.1781, lng: 106.0710 },
    'hải dương': { lat: 20.9373, lng: 106.3145 },
    'vĩnh phúc': { lat: 21.3089, lng: 105.6050 },
    'bắc giang': { lat: 21.2730, lng: 106.1946 },
    'quảng ninh': { lat: 21.0064, lng: 107.2925 },
    'thái nguyên': { lat: 21.5928, lng: 105.8442 },
    'nam định': { lat: 20.4389, lng: 106.1621 },
    'thái bình': { lat: 20.4463, lng: 106.3365 },
    'hưng yên': { lat: 20.6464, lng: 106.0511 },
    'phú thọ': { lat: 21.3229, lng: 105.4019 },
    'hà nam': { lat: 20.5835, lng: 105.9229 },
    'ninh bình': { lat: 20.2506, lng: 105.9744 },
    'quảng bình': { lat: 17.4690, lng: 106.6222 },
    'quảng trị': { lat: 16.7500, lng: 107.1854 },
    'thừa thiên huế': { lat: 16.4637, lng: 107.5909 },
    'quảng nam': { lat: 15.5394, lng: 108.0191 },
    'quảng ngãi': { lat: 15.1214, lng: 108.8044 },
    'bình định': { lat: 13.7820, lng: 109.2197 },
    'khánh hòa': { lat: 12.2585, lng: 109.0526 },
    'gia lai': { lat: 13.9833, lng: 108.0000 },
    'đắk lắk': { lat: 12.7100, lng: 108.2378 },
    'lâm đồng': { lat: 11.9465, lng: 108.4419 },
    'bình thuận': { lat: 10.9282, lng: 108.1002 },
    'bình dương': { lat: 11.1664, lng: 106.6522 },
    'đồng nai': { lat: 10.9453, lng: 106.8244 },
    'bà rịa - vũng tàu': { lat: 10.5418, lng: 107.2430 },
    'long an': { lat: 10.5360, lng: 106.4134 },
    'tiền giang': { lat: 10.4493, lng: 106.3420 },
    'bến tre': { lat: 10.2434, lng: 106.3756 },
    'vĩnh long': { lat: 10.2537, lng: 105.9722 },
    'đồng tháp': { lat: 10.4937, lng: 105.6882 },
    'an giang': { lat: 10.3899, lng: 105.4356 },
    'kiên giang': { lat: 10.0125, lng: 105.0809 },
    'sóc trăng': { lat: 9.6036, lng: 105.9740 },
    'bạc liêu': { lat: 9.2940, lng: 105.7216 },
    'cà mau': { lat: 9.1769, lng: 105.1524 },
    'sơn la': { lat: 21.3269, lng: 103.9188 },
    'điện biên': { lat: 21.3860, lng: 103.0230 },
    'yên bái': { lat: 21.7168, lng: 104.9113 },
    'hòa bình': { lat: 20.8171, lng: 105.3384 },
    'hà giang': { lat: 22.8233, lng: 104.9838 },
    'cao bằng': { lat: 22.6666, lng: 106.2576 },
    'lạng sơn': { lat: 21.8539, lng: 106.7615 },
    'đắk nông': { lat: 12.0000, lng: 107.6833 },
    'kon tum': { lat: 14.3498, lng: 108.0005 },
    'ninh thuận': { lat: 11.5752, lng: 108.9890 },
    // Common district names in Hanoi 
    'cổ nhuế': { lat: 21.0575, lng: 105.7863 },
    'đông ngạc': { lat: 21.0700, lng: 105.7850 },
    'bắc từ liêm': { lat: 21.0667, lng: 105.7667 },
    'nam từ liêm': { lat: 21.0167, lng: 105.7667 },
    'cầu giấy': { lat: 21.0333, lng: 105.7833 },
    'thanh xuân': { lat: 20.9917, lng: 105.8083 },
    'hoàng mai': { lat: 20.9750, lng: 105.8500 },
    'long biên': { lat: 21.0500, lng: 105.8833 },
    'hà đông': { lat: 20.9667, lng: 105.7667 },
};

// Try to extract province/district from LocationCode text 
function extractCoords(locationCode: string): { lat: number; lng: number } | null {
    const lower = locationCode.toLowerCase();
    // Try more specific matches first (districts before provinces)
    let bestMatch: { key: string; coords: { lat: number; lng: number } } | null = null;
    for (const [name, coords] of Object.entries(PROVINCE_COORDS)) {
        if (lower.includes(name)) {
            if (!bestMatch || name.length > bestMatch.key.length) {
                bestMatch = { key: name, coords };
            }
        }
    }
    if (bestMatch) {
        return {
            lat: bestMatch.coords.lat + (Math.random() - 0.5) * 0.01,
            lng: bestMatch.coords.lng + (Math.random() - 0.5) * 0.01,
        };
    }
    return null;
}

// Geocode cache
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeLocation(locationCode: string): Promise<{ lat: number; lng: number } | null> {
    if (geocodeCache.has(locationCode)) {
        return geocodeCache.get(locationCode) || null;
    }

    // Try province/district extraction first (instant, no API call)
    const localCoords = extractCoords(locationCode);
    if (localCoords) {
        geocodeCache.set(locationCode, localCoords);
        return localCoords;
    }

    // Fallback: Nominatim API  
    try {
        const query = encodeURIComponent(locationCode + ', Việt Nam');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=vn`, {
            headers: { 'Accept-Language': 'vi' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            geocodeCache.set(locationCode, result);
            return result;
        }
    } catch {
        // Geocoding failed silently
    }

    geocodeCache.set(locationCode, null);
    return null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ projects }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const enrichedRef = useRef<Project[]>([]);
    const iframeLoadedRef = useRef(false);

    // Send data to iframe
    const sendToIframe = useCallback(() => {
        if (iframeRef.current?.contentWindow && enrichedRef.current.length > 0) {
            iframeRef.current.contentWindow.postMessage({
                type: 'UPDATE_PROJECTS',
                payload: enrichedRef.current
            }, '*');
        }
    }, []);

    // Geocode and enrich projects
    useEffect(() => {
        let cancelled = false;

        const enrichAll = async () => {
            const enriched = await Promise.all(
                projects.map(async (p) => {
                    if (p.Coordinates) return p;
                    if (!p.LocationCode) return p;
                    const coords = await geocodeLocation(p.LocationCode);
                    return coords ? { ...p, Coordinates: coords } : p;
                })
            );

            if (!cancelled) {
                enrichedRef.current = enriched;
                sendToIframe();
            }
        };

        enrichAll();
        return () => { cancelled = true; };
    }, [projects, sendToIframe]);

    // Handle iframe load event
    useEffect(() => {
        const handleLoad = () => {
            iframeLoadedRef.current = true;
            // Small delay to ensure iframe JS is fully initialized
            setTimeout(sendToIframe, 200);
        };

        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', handleLoad);
        }

        return () => {
            if (iframe) {
                iframe.removeEventListener('load', handleLoad);
            }
        };
    }, [sendToIframe]);

    return (
        <iframe
            ref={iframeRef}
            src="/map.html"
            className="w-full h-full rounded-2xl border-none custom-map-iframe"
            title="Project Map"
            style={{ width: '100%', height: '100%', minHeight: '500px' }}
        />
    );
};

export default InteractiveMap;
