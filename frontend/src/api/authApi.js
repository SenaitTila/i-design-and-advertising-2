import axios from 'axios';
import { io } from 'socket.io-client';

// Create an instance that sends cookies automatically with requests
const API = axios.create({
  // 💡 Using template literals to cleanly append strings together
  baseURL: import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api/v1` 
    : 'http://localhost:5000/api/v1',
    
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  }
});

// --- Socket.io Setup ---
// Strips `/api/v1` off the base API URL to target the WebSocket server root
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const SOCKET_URL = rawBaseUrl.replace(/\/api\/v1\/?$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Prevents automatic connection before auth credentials are passed
  withCredentials: true,
});

// Dynamic hooks placeholders linked to your React Loading Context
let showLoadingFn = () => {};
let hideLoadingFn = () => {};

export const injectLoadingMethods = (show, hide) => {
  showLoadingFn = show;
  hideLoadingFn = hide;
};

// --- Request Interceptor ---
// Triggers the loading overlay right before the network request goes out
API.interceptors.request.use(
  (config) => {
    // 🚀 FIXED: Skip global loader trigger if the specific call flags it
    if (!config._skipGlobalLoading) {
      showLoadingFn('Processing request...');
    }
    return config;
  },
  (error) => {
    hideLoadingFn();
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Hides the loading overlay and handles errors globally
API.interceptors.response.use(
  (response) => {
    hideLoadingFn();
    return response;
  },
  (error) => {
    hideLoadingFn(); // Ensure loading indicator is always cleared

    // 🚀 ADDED: Global error parsing and handling logic
    const backendMessage = error.response?.data?.error || error.response?.data?.message;
    const status = error.response?.status;

    // Handle global authentication loss (e.g., expired tokens / cleared sessions)
    if (status === 401) {
      // Optional: trigger a clean state reset or redirect if unauthorized
      console.warn("Session unauthorized or expired.");
    }

    // Handle server-side database/backend crashes gracefully
    if (status >= 500) {
      console.error("Internal Server/Database Error:", backendMessage || error.message);
    }

    // Standardize error rejection object so components catch a clean message string
    const enhancedError = new Error(backendMessage || error.message || "An unexpected error occurred.");
    enhancedError.status = status;
    enhancedError.response = error.response;

    return Promise.reject(enhancedError);
  }
);

// --- Auth Endpoints ---

export const loginUser = async (formData) => {
  const { data } = await API.post('/auth/login', formData);
  return data;
};

export const registerUser = async (formData) => {
  const { data } = await API.post('/auth/register', formData);
  return data;
};

export const getMe = async () => {
  const { data } = await API.get('/auth/me');
  return data;
};

export const logoutUser = async (formData) => {
  const { data } = await API.post('/auth/logout', formData);
  return data;
};

export default API;