// API Types - Response structures and error handling

// Generic API Response wrapper
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    timestamp?: string;
}

// Paginated response for list endpoints
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

// API Error structure
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string>;
}

// Query parameters for list endpoints
export interface QueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}

// CRUD operation result
export interface MutationResult<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}
