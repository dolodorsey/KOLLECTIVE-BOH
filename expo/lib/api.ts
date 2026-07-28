// The API is served from this same Vercel project at /api.
// Native builds fall back to EXPO_PUBLIC_API_URL (the deployed BOH origin).
const API_BASE_URL =
  (typeof window !== 'undefined' && window.location?.origin) ||
  process.env.EXPO_PUBLIC_API_URL ||
  '';

if (!API_BASE_URL) {
  console.warn('[API] No base URL resolved. Set EXPO_PUBLIC_API_URL for native builds.');
}

if (API_BASE_URL.startsWith('http://')) {
  console.warn('⚠️ [API] Using HTTP instead of HTTPS. iOS will block these requests:', API_BASE_URL);
}

if (API_BASE_URL.includes('localhost')) {
  console.warn('⚠️ [API] Using localhost URL. This will not work on physical devices:', API_BASE_URL);
}

console.log('🔗 [API] Configured base URL:', API_BASE_URL);

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

class ApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  clearAuthToken() {
    const { Authorization, ...rest } = this.headers as Record<string, string>;
    this.headers = rest;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    
    try {
      console.log(`📡 [API] ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ [API] Request took ${duration}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [API] Error ${response.status}:`, {
          url,
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        if (response.status === 404) {
          console.error('🔍 [API] 404 NOT FOUND: Endpoint does not exist:', url);
        } else if (response.status === 403 || response.status === 401) {
          console.error('🔒 [API] Authentication/Authorization error');
        } else if (response.status >= 500) {
          console.error('🔥 [API] Server error - backend may be down');
        }
        
        return {
          data: null,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      console.log(`✅ [API] Success:`, data);

      return {
        data,
        error: null,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [API] Request failed after ${duration}ms:`, {
        url,
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
        } : error,
      });
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          console.error('🌐 [API] NETWORK ERROR: Cannot reach server');
          console.error('💡 Possible causes:');
          console.error('   1. Server is down');
          console.error('   2. No internet connection');
          console.error('   3. CORS policy blocking request');
          console.error('   4. iOS blocking HTTP (non-HTTPS) request');
          console.error('   5. Server URL is incorrect:', this.baseUrl);
        } else if (error.message.includes('Failed to fetch')) {
          console.error('🌐 [API] FETCH ERROR: Network or CORS issue');
          console.error('💡 Check:');
          console.error('   1. Is the API URL correct?', this.baseUrl);
          console.error('   2. Is the server running?');
          console.error('   3. CORS headers configured?');
        }
      }
      
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
