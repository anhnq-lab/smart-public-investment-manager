
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
}

class ApiClient {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { params, ...init } = options;

        const url = new URL(endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`, window.location.origin);
        if (params) {
            Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
        }

        const headers = {
            'Content-Type': 'application/json',
            ...init.headers,
        };

        // Add auth token if exists
        const token = localStorage.getItem('token');
        if (token) {
            (headers as any)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url.toString(), {
            ...init,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    get<T>(endpoint: string, params?: Record<string, string>) {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    post<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
    }

    put<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
    }

    delete<T>(endpoint: string) {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
