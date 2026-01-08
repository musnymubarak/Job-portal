import api from './client';

export const getStudentCVUrl = async (studentId: number): Promise<string> => {
    // Backend now returns { "url": "https://..." }
    const response = await api.get(`/api/v1/cv/download/${studentId}`);
    return response.data.url;
};
