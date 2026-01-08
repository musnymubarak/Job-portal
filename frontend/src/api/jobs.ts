import api from './client';

export interface Job {
    id: number;
    title: string;
    description: string;
    requirements: string;
    job_type?: string;
    department?: string;
    location?: string;
    duration?: string;
    deadline?: string;
    status: string;
    responsibilities?: string[];
    required_skills?: string[];
    preferred_skills?: string[];
    tools?: string[];
    min_qualifications?: string;
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
}

export const getJobs = async (
    filters?: { job_type?: string; department?: string; sort_by?: string; application_status?: string }
): Promise<Job[]> => {
    const response = await api.get('/api/v1/jobs/', { params: filters });
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

export const getAdminApplications = async (): Promise<Application[]> => {
    const response = await api.get('/api/v1/applications/admin/list');
    return response.data;
};

export const getMyApplications = async (): Promise<Application[]> => {
    const response = await api.get('/api/v1/applications/my-applications');
    return response.data;
};
