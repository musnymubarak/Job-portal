import api from './client';

export interface RegisterData {
    email: string;
    password: string;
    full_name?: string;
    role?: string;
}

export const login = async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const response = await api.post('/api/v1/login/access-token', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
};

export const register = async (userData: RegisterData) => {
    const response = await api.post('/api/v1/register', userData);
    return response.data;
};
