export const API_BASE_URL = 'http://192.168.0.12:3000';
export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  donation: `${API_BASE_URL}/api/donation`,
  checkUserExists: `${API_BASE_URL}/api/auth/check-user-exists`,
  resetPassword: `${API_BASE_URL}/api/auth/reset-password-final`,
};
