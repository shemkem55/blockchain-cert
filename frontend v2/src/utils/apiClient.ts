export class APIError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

export const API_BASE_URL = import.meta.env.PROD
    ? 'https://blockchain-cert-backend.onrender.com'
    : '';

/**
 * Enhanced fetch wrapper that continuously validates JSON responses
 * and handles errors consistently.
 */
export async function safeFetch(endpoint: string, options: RequestInit = {}) {
    // Construct full URL if endpoint is relative path
    let url = endpoint;
    if (endpoint.startsWith('/')) {
        url = `${API_BASE_URL}${endpoint}`;
    }

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        },
        credentials: 'include' as RequestCredentials
    };

    try {
        const res = await fetch(url, config);
        const contentType = res.headers.get('content-type');

        // Phase 3: Client-Side AI Guardrail - VALIDATOR
        if (!contentType || !contentType.includes('application/json')) {
            const rawText = await res.text();

            // Phase 1: Capture Raw Response
            console.error('🛑 LOGIN FAILURE DIAGNOSIS');
            console.error('URL:', url);
            console.error('STATUS:', res.status);
            console.error('RAW RESPONSE HEAD:', rawText.slice(0, 500));

            throw new APIError(
                `Server returned non-JSON response (${res.status}). this usually indicates a server crash or network proxy error.`,
                res.status,
                { raw: rawText }
            );
        }

        const data = await res.json();

        if (!res.ok) {
            // Normalize backend errors
            let errorMessage = data.error || data.message || 'Request failed';
            if (data.errors && Array.isArray(data.errors)) {
                errorMessage = data.errors.map((e: any) => e.msg || e.message).join(', ');
            }
            throw new APIError(errorMessage, res.status, data);
        }

        return data;
    } catch (error) {
        if (error instanceof APIError) throw error;
        // Network errors or other fetch failures
        throw new APIError(
            error instanceof Error ? error.message : 'Network connection failed',
            0
        );
    }
}
