import axios from 'axios';

const API = axios.create({
  baseURL: 'https://hot-dominant-horizon-larry.trycloudflare.com',
});
export const registerUser = (credentials) => API.post('/register', credentials);
export const loginUser = (credentials) => API.post('/login', credentials);

// Upload file
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload', formData);
};

// Download file
export const downloadFile = (filename) => {
  return API.get(`/download/${filename}`, { responseType: 'blob' });
};

// List all files
export const listFiles = () => {
  return API.get('/list-files');
};
