import axios from 'axios';

const API = axios.create({
  baseURL: 'https://hot-dominant-horizon-larry.trycloudflare.com',
});

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
