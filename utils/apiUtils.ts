// utils/apiUtils.ts
import { decodeAuthToken } from './authUtils';

// Base API URL from environment
const getApiUrl = () => {
  return import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';
};

/**
 * Get authentication token directly from localStorage
 * This avoids circular dependency with sessionService
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Track in-flight requests to prevent duplicate calls
const inFlightRequests: Map<string, Promise<any>> = new Map();

// Retry configuration for 429 errors
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Sleep for a specified duration
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate retry delay with exponential backoff and jitter
 */
const calculateRetryDelay = (retryCount: number, retryAfterHeader: string | null): number => {
  // If server provides Retry-After header, use it
  if (retryAfterHeader) {
    const retryAfterSeconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(retryAfterSeconds)) {
      return retryAfterSeconds * 1000;
    }
  }
  
  // Exponential backoff: baseDelay * 2^retryCount + jitter
  const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000; // Add up to 1s jitter to prevent thundering herd
  return exponentialDelay + jitter;
};

/**
 * Check if an error is a rate limit error (429)
 */
const isRateLimitError = (error: any): boolean => {
  return error?.status === 429 || error?.data?.error?.toLowerCase().includes('too many requests');
};

/**
 * Make authenticated API request with automatic token validation
 * Includes request deduplication to prevent duplicate simultaneous calls
 * Automatically retries on 429 (Too Many Requests) errors with exponential backoff
 */
export const makeAuthenticatedRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  // Check if token is expired before making the request
  const decodedToken = decodeAuthToken(token);
  if (!decodedToken) {
    throw new Error('Invalid token');
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (decodedToken.exp && decodedToken.exp <= currentTime) {
    // Token is expired, remove it
    localStorage.removeItem('auth_token');
    throw new Error('Token has expired');
  }

  const apiUrl = getApiUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;

  // Create a unique key for this request (method + URL)
  const method = options.method || 'GET';
  const requestKey = `${method}:${url}`;

  // Check if there's already an in-flight request for this endpoint
  if (inFlightRequests.has(requestKey)) {
    console.log(`[Request Dedup] Reusing in-flight request: ${requestKey}`);
    return inFlightRequests.get(requestKey) as Promise<T>;
  }

  const defaultOptions: RequestInit = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Create the fetch promise and store it
  const requestPromise = (async () => {
    try {
      const response = await fetch(url, mergedOptions);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Unauthorized or forbidden, remove the token
          localStorage.removeItem('auth_token');
        }

        let errorMessage = `API request failed: ${response.statusText}`;
        let errorData = null;
        try {
          errorData = await response.json();
          // Prefer Arabic error messages from backend
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } catch {
          // Response is not JSON, use status text
          try {
            const textError = await response.text();
            errorMessage = textError || errorMessage;
          } catch {
            // Can't read response body
          }
        }

        const error: any = new Error(typeof errorMessage === 'string' ? errorMessage : 'حدث خطأ في الاتصال بالخادم');
        error.status = response.status;
        error.data = errorData;
        
        // Handle 429 Too Many Requests with retry logic
        if (response.status === 429 && retryCount < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After') || response.headers.get('RateLimit-Reset');
          const delay = calculateRetryDelay(retryCount, retryAfter);
          
          console.warn(`[Rate Limit] Hit 429 error. Retry ${retryCount + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`);
          
          // Wait before retrying
          await sleep(delay);
          
          // Retry the request
          return makeAuthenticatedRequest<T>(endpoint, options, retryCount + 1);
        }
        
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (!text || text.trim() === '') {
          return {} as T;
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          throw new Error('Invalid JSON response from server');
        }
      }

      return {} as T;
    } finally {
      // Remove from in-flight requests after completion
      inFlightRequests.delete(requestKey);
    }
  })();

  // Store the promise in the map
  inFlightRequests.set(requestKey, requestPromise);

  return requestPromise;
};

/**
 * Make public (unauthenticated) API request
 * Automatically retries on 429 (Too Many Requests) errors with exponential backoff
 */
export const makePublicRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> => {
  const apiUrl = getApiUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.statusText}`;
      let errorData = null;
      try {
        errorData = await response.json();
        errorMessage = errorData?.error || errorData?.message || errorMessage;
      } catch {
        try {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        } catch {
          // Can't read response body
        }
      }

      const error: any = new Error(typeof errorMessage === 'string' ? errorMessage : 'حدث خطأ في الاتصال بالخادم');
      error.status = response.status;
      error.data = errorData;
      
      // Handle 429 Too Many Requests with retry logic
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const retryAfter = response.headers.get('Retry-After') || response.headers.get('RateLimit-Reset');
        const delay = calculateRetryDelay(retryCount, retryAfter);
        
        console.warn(`[Rate Limit] Hit 429 error. Retry ${retryCount + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`);
        
        // Wait before retrying
        await sleep(delay);
        
        // Retry the request
        return makePublicRequest<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }

    return response.json();
  } catch (error) {
    // Re-throw non-429 errors or errors after max retries
    throw error;
  }
};