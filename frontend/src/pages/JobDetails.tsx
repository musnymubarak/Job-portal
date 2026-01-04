import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applyForJob, getMyApplications, type Job, type Application } from '../api/jobs';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Building, Clock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const JobDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [application, setApplication] = useState<Application | null>(null);

    useEffect(() => {
        if (id && user) {
            loadData();
        }
    }, [id, user]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Job Details (We might need a specific endpoint, but filtering getJobs works for now if list is small, 
            // OR ideally we add a getJobById endpoint in api/jobs.ts using the backend endpoint we already have)
            // The backend HAS: @router.get("/{job_id}") -> read_job
            // Let's assume we update api/jobs.ts to include getJobById(id)

            // For now, I'll use a new function I will add to api/jobs.ts
            const jobData = await getJobById(Number(id));
            setJob(jobData);

            // Check if applied
            const myApps = await getMyApplications();
            const existingApp = myApps.find(app => app.job_id === Number(id));
            if (existingApp) {
                setHasApplied(true);
                setApplication(existingApp);
            }

        } catch (error) {
            console.error("Failed to load job details", error);
            toast.error("Job not found");
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!job) return;

        if (!user?.cv_filename) {
            toast.error("Please upload your CV in your profile before applying.");
            return;
        }

        setApplying(true);
        try {
            await applyForJob(job.id);
            setHasApplied(true);
            toast.success("Application submitted successfully!");
            // Refresh to get application details
            loadData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to apply");
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!job) return <div className="min-h-screen flex items-center justify-center">Job not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                            <div className="flex flex-wrap gap-4 text-indigo-100 text-sm mt-4">
                                {job.department && (
                                    <span className="flex items-center"><Building size={16} className="mr-1" /> {job.department}</span>
                                )}
                                {job.job_type && (
                                    <span className="flex items-center"><Briefcase size={16} className="mr-1" /> {job.job_type}</span>
                                )}
                                <span className="flex items-center"><Clock size={16} className="mr-1" /> Posted {new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
                    </div>

                    <div className="p-8">
                        {/* Job Description */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Job Description</h2>
                            <div className="prose text-gray-600 whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Requirements</h2>
                            <div className="prose text-gray-600 whitespace-pre-wrap">
                                {job.requirements}
                            </div>
                        </div>

                        {/* Application Section */}
                        <div className="mt-10 bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Application Status</h3>

                            {hasApplied ? (
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                    <CheckCircle size={48} className="text-green-500 mb-3" />
                                    <h4 className="text-xl font-bold text-gray-900">Applied</h4>
                                    <p className="text-gray-500">You applied for this position on {application ? new Date(application.created_at).toLocaleDateString() : 'recent'}.</p>
                                    <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 uppercase">
                                        Current Status: {application?.status || 'Applied'}
                                    </span>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-600 mb-4">
                                        Interested in this role? Apply now to share your profile and CV with the hiring team.
                                    </p>
                                    {!user?.cv_filename && (
                                        <div className="flex items-center p-4 bg-yellow-50 text-yellow-800 rounded-lg mb-4 text-sm">
                                            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                                            Please upload your CV in your profile before applying.
                                        </div>
                                    )}
                                    <button
                                        onClick={handleApply}
                                        disabled={applying || !user?.cv_filename}
                                        className="w-full bg-indigo-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {applying ? 'Submitting...' : 'Apply for this Job'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper to fetch single job (Need to add this to api/jobs.ts or define here temporarily)
import api from '../api/client';
const getJobById = async (id: number): Promise<Job> => {
    const response = await api.get(`/api/v1/jobs/${id}`);
    return response.data;
};

export default JobDetails;
