// Base API Client with mock data fallback
import config from '../config';
import type { ApiResponse, ApiError, QueryParams } from '../types/api';

class ApiClientClass {
    private baseUrl: string;
    private useMock: boolean;
    private timeout: number;

    constructor() {
        this.baseUrl = config.API_BASE_URL;
        this.useMock = config.USE_MOCK_DATA;
        this.timeout = config.API_TIMEOUT;
    }

    // Helper to build URL with query params
    private buildUrl(endpoint: string, params?: QueryParams): string {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }
        return url.toString();
    }

    // Generic GET request
    async get<T>(endpoint: string, mockFn: () => T | Promise<T>, params?: QueryParams): Promise<T> {
        if (this.useMock) {
            // Simulate network delay for realistic UX
            await this.simulateDelay();
            return mockFn();
        }

        try {
            const response = await fetch(this.buildUrl(endpoint, params), {
                method: 'GET',
                headers: this.getHeaders(),
                signal: AbortSignal.timeout(this.timeout),
            });

            if (!response.ok) {
                throw await this.handleError(response);
            }

            const json: ApiResponse<T> = await response.json();
            return json.data;
        } catch (error) {
            console.error(`API GET ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Generic POST request
    async post<T>(endpoint: string, data: any, mockFn: () => T | Promise<T>): Promise<T> {
        if (this.useMock) {
            await this.simulateDelay();
            return mockFn();
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(this.timeout),
            });

            if (!response.ok) {
                throw await this.handleError(response);
            }

            const json: ApiResponse<T> = await response.json();
            return json.data;
        } catch (error) {
            console.error(`API POST ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Generic PUT request
    async put<T>(endpoint: string, data: any, mockFn: () => T | Promise<T>): Promise<T> {
        if (this.useMock) {
            await this.simulateDelay();
            return mockFn();
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(this.timeout),
            });

            if (!response.ok) {
                throw await this.handleError(response);
            }

            const json: ApiResponse<T> = await response.json();
            return json.data;
        } catch (error) {
            console.error(`API PUT ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Generic DELETE request
    async delete<T = void>(endpoint: string, mockFn: () => T | Promise<T>): Promise<T> {
        if (this.useMock) {
            await this.simulateDelay();
            return mockFn();
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
                signal: AbortSignal.timeout(this.timeout),
            });

            if (!response.ok) {
                throw await this.handleError(response);
            }

            // DELETE might not return data
            if (response.status === 204) {
                return undefined as T;
            }

            const json: ApiResponse<T> = await response.json();
            return json.data;
        } catch (error) {
            console.error(`API DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Get auth headers
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Add auth token if available
        const user = localStorage.getItem('currentUser');
        if (user) {
            try {
                const parsed = JSON.parse(user);
                if (parsed.token) {
                    headers['Authorization'] = `Bearer ${parsed.token}`;
                }
            } catch {
                // Ignore parse errors
            }
        }

        return headers;
    }

    // Handle error responses
    private async handleError(response: Response): Promise<ApiError> {
        let error: ApiError = {
            code: `HTTP_${response.status}`,
            message: response.statusText || 'An error occurred',
        };

        try {
            const json = await response.json();
            if (json.error) {
                error = json.error;
            }
        } catch {
            // Response might not be JSON
        }

        return error;
    }

    // Simulate network delay for mock data (100-300ms)
    private simulateDelay(): Promise<void> {
        const delay = Math.random() * 200 + 100;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Toggle mock mode (useful for testing)
    setMockMode(useMock: boolean): void {
        this.useMock = useMock;
    }

    // Check if using mock mode
    isMockMode(): boolean {
        return this.useMock;
    }
}

// Singleton instance
export const api = new ApiClientClass();
export default api;
