import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { createJob, getAdminApplications, getJobs, type Job, type JobCreate, type Application } from '../api/jobs';
import { updateApplicationStatus } from '../api/applications';
import { updateProfile, changePassword } from '../api/users';
import { LogOut, Plus, Briefcase, FileText, BarChart2, User as UserIcon, Filter, Lock, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPortal = () => {
    const { user, logout, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'post-job' | 'profile'>('dashboard');

    // Dashboard State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        status: '',
        min_score: '',
        sort_by: 'date_desc'
    });

    // Form State (Job)
    const [jobData, setJobData] = useState<JobCreate>({ title: '', description: '', requirements: '', job_type: '', department: '' });
    const [posting, setPosting] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({ full_name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '' });

    // Initial Load & Profile Sync
    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        if (user) {
            setProfileData({ full_name: user.full_name || '', email: user.email || '' });
        }
    }, [user]);

    // Fetch applications when a job is selected or filters change
    useEffect(() => {
        if (selectedJob) {
            fetchApplications(selectedJob.id);
        } else {
            setApplications([]);
        }
    }, [selectedJob, filters]);

    const fetchJobs = async () => {
        try {
            const data = await getJobs();
            // Sort by newest first
            const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setJobs(sorted);
            // Select first job by default if available and nothing selected
            if (sorted.length > 0 && !selectedJob) {
                setSelectedJob(sorted[0]);
            }
        } catch (error) {
            console.error("Failed to load jobs", error);
        }
    };

    const fetchApplications = async (jobId: number) => {
        setLoadingApps(true);
        try {
            // Clean filters
            const appFilters: any = { ...filters };
            if (!appFilters.status || appFilters.status === 'all') delete appFilters.status;
            if (!appFilters.min_score) delete appFilters.min_score;

            const data = await getAdminApplications(jobId, appFilters);
            setApplications(data);
        } catch (error) {
            console.error("Failed to load applications", error);
            toast.error("Failed to load applications");
        } finally {
            setLoadingApps(false);
        }
    };

    const handlePostJob = async (e: FormEvent) => {
        e.preventDefault();
        setPosting(true);

        const postPromise = createJob(jobData);

        toast.promise(postPromise, {
            loading: 'Posting Job...',
            success: 'Job Posted Successfully!',
            error: 'Failed to post job'
        });

        try {
            await postPromise;
            setJobData({ title: '', description: '', requirements: '', job_type: '', department: '' });
            fetchJobs(); // Refresh job list
            setActiveTab('dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setPosting(false);
        }
    };

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        const promise = updateProfile(profileData);
        toast.promise(promise, {
            loading: 'Updating Profile...',
            success: 'Profile Updated!',
            error: 'Failed to update profile'
        });

        try {
            const updated = await promise;
            if (setUser) setUser(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        const promise = changePassword(passwordData);
        toast.promise(promise, {
            loading: 'Updating Password...',
            success: 'Password Changed Successfully!',
            error: (err: any) => err.response?.data?.detail || 'Failed to change password'
        });

        try {
            await promise;
            setPasswordData({ current_password: '', new_password: '' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusUpdate = async (appId: number, newStatus: string) => {
        const promise = updateApplicationStatus(appId, newStatus);
        toast.promise(promise, {
            loading: 'Updating Status...',
            success: `Application ${newStatus.toUpperCase()}`,
            error: 'Failed to update status'
        });

        try {
            await promise;
            // Update local state
            setApplications(applications.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            console.error(error);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 font-bold bg-green-50 px-2 py-1 rounded';
        if (score >= 60) return 'text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded';
        return 'text-red-600 bg-red-50 px-2 py-1 rounded';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-100 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <Briefcase className="h-6 w-6 text-indigo-600 mr-2" />
                            <span className="font-bold text-xl text-gray-900">AdminPortal</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">{user?.email}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                ADMIN
                            </span>
                            <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6 overflow-hidden h-[calc(100vh-64px)]">

                {/* SIDERBAR / MENU */}
                <aside className="w-64 flex-shrink-0 flex flex-col gap-4">
                    <div className="flex flex-col space-y-1">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <BarChart2 size={18} className="mr-3" /> Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('post-job')}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'post-job'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Plus size={18} className="mr-3" /> Post New Job
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <UserIcon size={18} className="mr-3" /> Admin Profile
                        </button>
                    </div>

                    {/* Job List for Filtering (Only show in dashboard) */}
                    {activeTab === 'dashboard' && (
                        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Job</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {jobs.map(job => (
                                    <button
                                        key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedJob?.id === job.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'
                                            }`}
                                    >
                                        <p className={`text-sm font-medium ${selectedJob?.id === job.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                                            {job.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </p>
                                    </button>
                                ))}
                                {jobs.length === 0 && <div className="p-4 text-sm text-gray-400 text-center">No jobs found</div>}
                            </div>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT Area */}
                <main className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                    {activeTab === 'post-job' && (
                        <div className="p-8 max-w-2xl mx-auto w-full overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Job Posting</h2>
                            <form onSubmit={handlePostJob} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={jobData.title}
                                        onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        required
                                        rows={6}
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={jobData.description}
                                        onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Requirements (Keywords for ATS)</label>
                                    <p className="text-xs text-gray-500 mb-1">Separate keywords with commas.</p>
                                    <textarea
                                        required
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={jobData.requirements}
                                        onChange={(e) => setJobData({ ...jobData, requirements: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Job Type</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={jobData.job_type}
                                            onChange={(e) => setJobData({ ...jobData, job_type: e.target.value })}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Internship">Internship</option>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Contract">Contract</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Department</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={jobData.department}
                                            onChange={(e) => setJobData({ ...jobData, department: e.target.value })}
                                        >
                                            <option value="">Select Department</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Product">Product</option>
                                            <option value="Design">Design</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Sales">Sales</option>
                                            <option value="HR">HR</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={posting}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {posting ? 'Posting...' : 'Post Job'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="p-8 max-w-xl mx-auto w-full overflow-y-auto space-y-8">
                            {/* Account Details */}
                            <div className="bg-white p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <UserIcon className="mr-2" /> Account Details
                                </h2>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={profileData.full_name}
                                            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                            placeholder="Your Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                                        Update Profile
                                    </button>
                                </form>
                            </div>

                            {/* Change Password */}
                            <div className="bg-white p-6 border-t border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <Lock className="mr-2" /> Security
                                </h2>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900">
                                        Change Password
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        // DASHBOARD VIEW
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {selectedJob ? selectedJob.title : 'Select a Job'}
                                    </h2>
                                    {selectedJob && <p className="text-sm text-gray-500">Managing Applications</p>}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {applications.length} Applicants
                                </div>
                            </div>

                            {/* Filter Bar */}
                            {selectedJob && (
                                <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-white shadow-sm z-10">
                                    <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wide">
                                        <Filter size={14} className="mr-2" /> Filters
                                    </div>

                                    <select
                                        className="border-gray-200 rounded text-sm py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="applied">Applied</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>

                                    <div className="flex items-center space-x-2">
                                        <label className="text-xs text-gray-500">Min Score:</label>
                                        <input
                                            type="number"
                                            min="0" max="100"
                                            className="w-16 border-gray-200 rounded text-sm py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="0"
                                            value={filters.min_score}
                                            onChange={(e) => setFilters({ ...filters, min_score: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex-1"></div>

                                    <select
                                        className="border-gray-200 rounded text-sm py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={filters.sort_by}
                                        onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                                    >
                                        <option value="date_desc">Newest First</option>
                                        <option value="date_asc">Oldest First</option>
                                        <option value="score_desc">Highest Score</option>
                                    </select>
                                </div>
                            )}

                            {/* Table Area */}
                            <div className="flex-1 overflow-auto">
                                {!selectedJob ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <Briefcase size={48} className="mb-4 opacity-20" />
                                        <p>Select a job from the sidebar to view applications</p>
                                    </div>
                                ) : loadingApps ? (
                                    <div className="flex items-center justify-center h-full text-gray-500">Loading candidates...</div>
                                ) : applications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <UserIcon size={48} className="mb-4 opacity-20" />
                                        <p>No applications match your criteria.</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATS Score</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CV</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {applications.map((app) => (
                                                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                                {app.student?.full_name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {app.student?.full_name || `User #${app.student_id}`}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {app.student?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={getScoreColor(app.ats_score)}>{app.ats_score}%</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:text-indigo-900">
                                                        <a href="#" className="flex items-center group">
                                                            <FileText size={16} className="mr-1 group-hover:scale-110 transition-transform" />
                                                            {app.cv_snapshot_path || 'View CV'}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(app.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full uppercase ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {app.status === 'applied' || app.status === 'reviewed' ? (
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={() => handleStatusUpdate(app.id, 'accepted')}
                                                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1 rounded transition-colors"
                                                                    title="Accept Candidate"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1 rounded transition-colors"
                                                                    title="Reject Candidate"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminPortal;
