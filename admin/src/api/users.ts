import api from './client';
import type { User } from '../context/AuthContext';

export const uploadCV = async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/v1/users/upload-cv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getMe = async (): Promise<User> => {
    const response = await api.get('/api/v1/users/me');
    return response.data;
};

export const updateProfile = async (data: { full_name?: string; email?: string }): Promise<User> => {
    const response = await api.put('/api/v1/users/me', data);
    return response.data;
};

export const changePassword = async (data: { current_password: string; new_password: string }) => {
    const response = await api.post('/api/v1/users/change-password', data);
    return response.data;
};
