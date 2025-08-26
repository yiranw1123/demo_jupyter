// API Configuration with dynamic base URL detection
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname
  
  // If accessing via localhost, use localhost backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000'
  }
  
  // For network/IP access, use same hostname with port 8000
  return `http://${hostname}:8000`
}

// Export the base URL for use in components
export const API_BASE_URL = getApiBaseUrl()