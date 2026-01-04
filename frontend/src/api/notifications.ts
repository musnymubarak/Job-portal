import api from './client';

export interface Notification {
    id: number;
    recipient_id: number;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
    const response = await api.get('/api/v1/notifications/');
    return response.data;
};

export const markAsRead = async (id: number): Promise<Notification> => {
    const response = await api.put(`/api/v1/notifications/${id}/read`);
    return response.data;
};

export const markAllAsRead = async (): Promise<Notification[]> => {
    const response = await api.put('/api/v1/notifications/read-all');
    return response.data;
};
