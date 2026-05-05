/**
 * API 호출을 위한 공통 유틸리티
 * 모든 요청에 자동으로 인증 토큰(JWT)을 포함하고 에러 처리를 수행합니다.
 */

const API_BASE_URL = '/api';

export const api = {
  /**
   * 공통 fetch 래퍼
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // 401 Unauthorized 처리 (토큰 만료 등)
      if (response.status === 401) {
        console.error('인증 에러: 토큰이 없거나 만료되었습니다.');
        localStorage.removeItem('token');
        localStorage.removeItem('adminInfo');
        window.location.href = '/admin/login';
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API 요청 중 오류가 발생했습니다.');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

export default api;
