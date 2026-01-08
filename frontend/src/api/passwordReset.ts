import api from './client';

export const requestPasswordReset = async (email: string) => {
    const response = await api.post(`/api/v1/password-recovery/${email}`);
    return response.data;
};

export const resetPassword = async (token: string, new_password: string) => {
    const response = await api.post('/api/v1/reset-password', {
        token,
        new_password
    });
    return response.data;
};
