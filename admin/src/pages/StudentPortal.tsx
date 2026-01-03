import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getJobs, applyForJob, getMyApplications, type Job, type Application } from '../api/jobs';
import { uploadCV, getMe } from '../api/users';
import { LogOut, Upload, Briefcase, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const StudentPortal = () => {
    const { user, logout, setUser } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [jobsData, appsData, userData] = await Promise.all([
                getJobs(),
                getMyApplications(),
                getMe()
            ]);
            setJobs(jobsData);
            setApplications(appsData);
            // Update user context with latest data (cv_filename)
            if (setUser) setUser(userData);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (file.type !== "application/pdf") {
            alert("Only PDF files are allowed");
            return;
        }

        setUploading(true);
        try {
            const updatedUser = await uploadCV(file);
            if (setUser) setUser(updatedUser);
            alert("CV Uploaded Successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to upload CV");
        } finally {
            setUploading(false);
        }
    };

    const handleApply = async (jobId: number) => {
        if (!user?.cv_filename) {
            alert("Please upload your CV before applying.");
            return;
        }

        if (!confirm("Apply for this position?")) return;

        try {
            await applyForJob(jobId);
            loadData(); // Refresh to show "Applied" status
            alert("Application Submitted!");
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Failed to apply";
            alert(msg);
        }
    };

    const hasApplied = (jobId: number) => {
        return applications.some(app => app.job_id === jobId);
    };

    const getStatusToken = (jobId: number) => {
        const app = applications.find(app => app.job_id === jobId);
        if (!app) return null;
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle size={12} className="mr-1" /> Applied (Score: {app.ats_score})
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <Briefcase className="h-6 w-6 text-indigo-600 mr-2" />
                            <span className="font-bold text-xl text-gray-900">JobPortal</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">{user?.email}</span>
                            <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Profile Section */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <FileText className="mr-2" size={24} /> My Profile
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500">Current CV</p>
                            <p className="text-lg text-gray-900">
                                {user?.cv_filename ? (
                                    <span className="flex items-center text-green-600">
                                        <CheckCircle size={16} className="mr-1" /> {user.cv_filename}
                                    </span>
                                ) : (
                                    <span className="flex items-center text-red-500">
                                        <AlertCircle size={16} className="mr-1" /> No CV Uploaded
                                    </span>
                                )}
                            </p>
                        </div>
                        <div>
                            <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors">
                                <Upload size={20} className="mr-2" />
                                {uploading ? "Uploading..." : "Upload New CV"}
                                <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                </section>

                {/* Job Board */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
                    {loading ? (
                        <div className="text-center py-12">Loading jobs...</div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                            <p className="text-gray-500">No jobs posted yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Posted {new Date(job.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="prose prose-sm text-gray-600 mb-4 flex-grow">
                                        <p className="line-clamp-3">{job.description}</p>
                                    </div>
                                    <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-50">
                                        <div>{getStatusToken(job.id)}</div>
                                        {hasApplied(job.id) ? (
                                            <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                                                Applied
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApply(job.id)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                            >
                                                Apply Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
};

export default StudentPortal;
