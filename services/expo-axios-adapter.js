// expo-axios-adapter.js
// This is a simple adapter that uses Fetch API instead of Node's http/https modules

export default function createFetchAdapter() {
  return async function fetchAdapter(config) {
    // Extract request info from axios config
    const { url, method = 'GET', data, headers = {}, params } = config;
    
    // Build URL with params
    let fullUrl = url;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      const queryString = queryParams.toString();
      fullUrl = queryString ? `${url}?${queryString}` : url;
    }
    
    // Build request options
    const options = {
      method,
      headers: headers,
    };
    
    // Add body for non-GET requests
    if (data && method !== 'GET') {
      if (typeof data === 'object') {
        options.body = JSON.stringify(data);
      } else {
        options.body = data;
      }
    }
    
    // Execute fetch request
    try {
      const response = await fetch(fullUrl, options);
      
      // Build response object
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      // Format response to match axios format
      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  };
} 