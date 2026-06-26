import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://wandermeets-backend.onrender.com');

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Format validation errors (errors array) to a single error string for UI compatibility
    if (error.response?.data && error.response.data.errors && !error.response.data.error) {
      error.response.data.error = error.response.data.errors.map(e => e.msg).join(', ');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Activities endpoints
export const activitiesAPI = {
  getNearby: (lat, lng, radius, genderFilter) => 
    api.get('/activities/nearby', { params: { lat, lng, radius, gender_filter: genderFilter } }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  rsvp: (id) => api.post(`/activities/${id}/rsvp`),
  cancelRSVP: (id) => api.delete(`/activities/${id}/rsvp`),
  delete: (id) => api.delete(`/activities/${id}`),
};

// Users endpoints
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.patch('/users/me', data, {
    headers: {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  }),
  getMyActivities: () => api.get('/users/me/activities'),
};

// Private pins endpoints
export const pinsAPI = {
  getAll: (lat, lng, radius) => 
    api.get('/pins', { params: { lat, lng, radius } }),
  getById: (id) => api.get(`/pins/${id}`),
  create: (data) => api.post('/pins', data, {
    headers: {
      'Content-Type': data instanceof FormData ? undefined : 'application/json'
    }
  }),
  update: (id, data) => api.patch(`/pins/${id}`, data),
  delete: (id) => api.delete(`/pins/${id}`),
};

// Recommendations endpoints
export const recommendationsAPI = {
  getNearby: (lat, lng, radius, category) =>
    api.get('/recommendations/nearby', { params: { lat, lng, radius, category } }),
  getById: (id) => api.get(`/recommendations/${id}`),
};

// Marketplace endpoints
export const marketplaceAPI = {
  getListings: (params) => api.get('/marketplace/listings', { params }),
  getById: (id) => api.get(`/marketplace/listings/${id}`),
  create: (data) => api.post('/marketplace/listings', data),
  update: (id, data) => api.patch(`/marketplace/listings/${id}`, data),
  delete: (id) => api.delete(`/marketplace/listings/${id}`),
  getVendor: (id) => api.get(`/marketplace/vendors/${id}`),
  getMyListings: () => api.get('/marketplace/my-listings'),
};

// Booking endpoints
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getVendorBookings: () => api.get('/bookings/vendor'),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  cancel: (id) => api.delete(`/bookings/${id}`),
};

// Travel Packages endpoints
export const packagesAPI = {
  getAll: (params) => api.get('/packages', { params }),
  getById: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.patch(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`),
  book: (id, data) => api.post(`/packages/${id}/book`, data),
  getMyBookings: () => api.get('/packages/bookings/my'),
  getProviderBookings: () => api.get('/packages/bookings/provider'),
  updateBookingStatus: (id, status) => api.patch(`/packages/bookings/${id}/status`, { status }),
  getProviderProfile: () => api.get('/packages/provider/me'),
  updateProviderProfile: (data) => api.patch('/packages/provider/me', data),
  getProviderPackages: () => api.get('/packages/provider/packages'),
};

export const safetyAPI = {
  getAadhaarStatus: () => api.get('/safety/aadhaar-status'),
  verifyAadhaar: (data) => api.post('/safety/verify-aadhaar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getContacts: () => api.get('/safety/contacts'),
  addContact: (data) => api.post('/safety/contacts', data),
  deleteContact: (id) => api.delete(`/safety/contacts/${id}`),
  getSOSHistory: () => api.get('/safety/sos-history'),
  triggerSOS: (data) => api.post('/safety/sos', data),
  sendOTP: (data) => api.post('/safety/send-otp', data),
  verifyOTP: (data) => api.post('/safety/verify-otp', data),
  sendEmailOTP: () => api.post('/safety/verify-email/send-otp'),
  verifyEmailOTP: (data) => api.post('/safety/verify-email/confirm', data),
  addReview: (data) => api.post('/safety/review', data),
  reportFraud: (data) => api.post('/safety/report', data),
};

// Waves endpoints
export const wavesAPI = {
  getAll: (params) => api.get('/waves', { params }),
  getById: (id) => api.get(`/waves/${id}`),
  create: (data) => api.post('/waves', data),
  join: (id, data) => api.post(`/waves/${id}/join`, data),
  getMyWaves: () => api.get('/waves/my-waves'),
  getRequests: (id) => api.get(`/waves/${id}/requests`),
  processRequest: (reqId, status) => api.put(`/waves/requests/${reqId}`, { status }),
  deleteWave: (id) => api.delete(`/waves/${id}`),
  cancelMember: (reqId, reason) => api.patch(`/waves/requests/${reqId}/cancel`, { reason }),
};

export default api;
