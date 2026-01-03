import api from './client';

export interface UserSummary {
    id: number;
    email: string;
    full_name?: string;
    cv_filename?: string;
}

export interface Job {
    id: number;
    title: string;
    description: string;
    requirements: string;
    created_at: string;
    admin_id: number;
}

export interface JobCreate {
    title: string;
    description: string;
    requirements: string;
}

export interface Application {
    id: number;
    job_id: number;
    student_id: number;
    status: string;
    ats_score: number;
    created_at: string;
    student?: UserSummary; // Now included from backend
    cv_snapshot_path?: string;
}

export const getJobs = async (): Promise<Job[]> => {
    const response = await api.get('/api/v1/jobs/');
    return response.data;
};

export const createJob = async (jobData: JobCreate): Promise<Job> => {
    const response = await api.post('/api/v1/jobs/', jobData);
    return response.data;
};

export const applyForJob = async (jobId: number): Promise<Application> => {
    const response = await api.post(`/api/v1/applications/${jobId}/apply`);
    return response.data;
};

export const getAdminApplications = async (jobId?: number): Promise<Application[]> => {
    const params = jobId ? { job_id: jobId } : {};
    const response = await api.get('/api/v1/applications/admin/list', { params });
    return response.data;
};

export const getMyApplications = async (): Promise<Application[]> => {
    const response = await api.get('/api/v1/applications/my-applications');
    return response.data;
};
