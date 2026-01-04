import api from './client';

export interface Application {
    id: number;
    job_id: number;
    student_id: number;
    status: string;
    ats_score: number;
    created_at: string;
    cv_snapshot_path: string;
    student?: {
        full_name: string;
        email: string;
    };
}

export const getAdminApplications = async (
    jobId?: number,
    filters?: { status?: string; min_score?: number; sort_by?: string }
): Promise<Application[]> => {
    const params = { job_id: jobId, ...filters };
    const response = await api.get('/api/v1/applications/admin/list', { params });
    return response.data;
};

export const updateApplicationStatus = async (id: number, status: string): Promise<Application> => {
    const response = await api.put(`/api/v1/applications/${id}/status`, { status });
    return response.data;
};
