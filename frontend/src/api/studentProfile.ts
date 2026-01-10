import api from './client';

export interface PortfolioProject {
    id?: number;
    title: string;
    description?: string;
    link?: string;
}

export interface StudentSkill {
    id?: number;
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced';
}

export interface StudentProfile {
    id?: number;
    user_id?: number;
    github_url?: string;
    linkedin_url?: string;
    portfolio_url?: string;
    projects: PortfolioProject[];
    skills: StudentSkill[];
}

export const getStudentProfile = async (): Promise<StudentProfile> => {
    const response = await api.get('/api/v1/student-profile/me');
    return response.data;
};

export const createStudentProfile = async (data: StudentProfile): Promise<StudentProfile> => {
    // remove IDs for new creation if present, though backend usually ignores or handles
    const response = await api.post('/api/v1/student-profile/', data);
    return response.data;
};

export const updateStudentProfile = async (data: StudentProfile): Promise<StudentProfile> => {
    const response = await api.put('/api/v1/student-profile/me', data);
    return response.data;
};
