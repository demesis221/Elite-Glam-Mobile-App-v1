import axios from 'axios';

// You can adjust the baseURL to match your backend API endpoint
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optionally, add interceptors for auth tokens, logging, etc.
// api.interceptors.request.use(config => { ... });
// api.interceptors.response.use(response => { ... }, error => { ... });
