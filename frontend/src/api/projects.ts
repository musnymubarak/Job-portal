import api from './client';

export interface Project {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface ProjectCreate {
    title: string;
    description: string;
}

export const getProjects = async (): Promise<Project[]> => {
    const response = await api.get('/api/v1/projects/');
    return response.data;
};

export const createProject = async (projectData: ProjectCreate): Promise<Project> => {
    const response = await api.post('/api/v1/projects/', projectData);
    return response.data;
};
