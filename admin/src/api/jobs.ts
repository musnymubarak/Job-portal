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
    job_type?: string;
    department?: string;
    location?: string;
    duration?: string;
    deadline?: string;
    status?: string;
    responsibilities?: string[];
    required_skills?: string[];
    preferred_skills?: string[];
    tools?: string[];
    min_qualifications?: string;
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
    job?: { title: string }; // Assuming backend joins Job
}

export const getJobs = async (filters?: { status?: string }): Promise<Job[]> => {
    const response = await api.get('/api/v1/jobs/', { params: filters });
    return response.data;
};

export const createJob = async (jobData: JobCreate): Promise<Job> => {
    const response = await api.post('/api/v1/jobs/', jobData);
    return response.data;
};

export const updateJob = async (jobId: number, jobData: Partial<JobCreate>): Promise<Job> => {
    const response = await api.put(`/api/v1/jobs/${jobId}`, jobData);
    return response.data;
};

export const applyForJob = async (jobId: number): Promise<Application> => {
    const response = await api.post(`/api/v1/applications/${jobId}/apply`);
    return response.data;
};

export const getAdminApplications = async (
    jobId?: number | null,
    filters?: { status?: string; min_score?: number; sort_by?: string }
): Promise<Application[]> => {
    // If jobId is provided, use it; otherwise don't send it or send empty
    const params: any = { ...filters };
    if (jobId) params.job_id = jobId;

    const response = await api.get('/api/v1/applications/admin/list', { params });
    return response.data;
};

export const getMyApplications = async (): Promise<Application[]> => {
    const response = await api.get('/api/v1/applications/my-applications');
    return response.data;
};
