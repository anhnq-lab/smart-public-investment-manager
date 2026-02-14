// Configuration for API and environment

export const config = {
    // API Configuration
    API_BASE_URL: import.meta.env.VITE_API_URL || '/api',

    // Toggle between mock data and real API
    // Set to false when backend is ready
    USE_MOCK_DATA: false,

    // Pagination defaults
    DEFAULT_PAGE_SIZE: 20,

    // Timeout for API requests (ms)
    API_TIMEOUT: 30000,
};

export default config;
