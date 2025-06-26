import axios from 'axios';

// You can adjust the baseURL to match your backend API endpoint
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://0d62-203-177-60-24.ngrok-free.app/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optionally, add interceptors for auth tokens, logging, etc.
// api.interceptors.request.use(config => { ... });
// api.interceptors.response.use(response => { ... }, error => { ... });
