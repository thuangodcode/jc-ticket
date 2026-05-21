import api from './api';

export const uploadService = {
  uploadImage: async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await api.post('/api/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // return the inner data object { url, public_id }
    return res.data.data;
  },
  deleteImage: async (publicId: string) => {
    const res = await api.delete('/api/upload', {
      params: { publicId },
    });
    return res.data;
  },
};
