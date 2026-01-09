import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { createJob, updateJob, getAdminApplications, getJobs, extractJobDetails, type Job, type JobCreate, type Application } from '../api/jobs';
import { updateApplicationStatus } from '../api/applications';
import { updateProfile, changePassword } from '../api/users';
import { LogOut, Plus, Briefcase, FileText, BarChart2, User as UserIcon, Filter, Lock, Check, X, Edit, Loader, Menu, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import { useWebSocket } from '../context';
import { getStudentCVUrl } from '../api/cv';

const AdminPortal = () => {
    const { user, logout, setUser } = useAuth();
    const { lastEvent, isConnected } = useWebSocket();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'post-job' | 'profile'>('dashboard');

    // Dashboard State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);
    const [appPage, setAppPage] = useState(1);
    const APPS_PER_PAGE = 6;

    // Filters State
    const [downloadingCvId, setDownloadingCvId] = useState<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);


    // Autofill State
    const [autofillUrl, setAutofillUrl] = useState('');
    const [autofillLoading, setAutofillLoading] = useState(false);

    const handleAutofill = async () => {
        if (!autofillUrl) return;
        setAutofillLoading(true);
        try {
            const extracted = await extractJobDetails(autofillUrl);
            setJobData(prev => ({
                ...prev,
                title: extracted.title || prev.title,
                description: extracted.description || prev.description,
                location: extracted.location || prev.location,
                // We could map others if available
            }));
            toast.success("Job details autofilled!");
        } catch (error) {
            console.error("Autofill error:", error);
            toast.error("Failed to fetch job details. Check URL.");
        } finally {
            setAutofillLoading(false);
        }
    };

    const handleViewCV = async (studentId: number) => {
        setDownloadingCvId(studentId);
        // Open window immediately to bypass mobile popup blockers
        const newWindow = window.open('', '_blank');

        try {
            if (newWindow) {
                newWindow.document.write('Loading CV...');
            }

            const url = await getStudentCVUrl(studentId);

            if (newWindow) {
                newWindow.location.href = url;
            } else {
                // Fallback if popup was blocked despite our best efforts
                window.location.href = url;
            }
        } catch (error: any) {
            console.error("View CV Error:", error);
            if (newWindow) newWindow.close();

            const msg = error.response?.data?.detail || "Failed to load CV (File might be missing)";
            toast.error(msg);
        } finally {
            setDownloadingCvId(null);
        }
    };

    // Filter State
    const [filters, setFilters] = useState({
        status: '',
        min_score: '',
        sort_by: 'date_desc'
    });
    const [jobSearch, setJobSearch] = useState('');

    // Filtered Jobs for Sidebar
    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        job.status.toLowerCase().includes(jobSearch.toLowerCase())
    );

    // Job Form State
    const [editingJobId, setEditingJobId] = useState<number | null>(null);
    const [jobData, setJobData] = useState<JobCreate>({
        title: '',
        description: '',
        requirements: '',
        job_type: '',
        department: '',
        location: 'Onsite',
        status: 'Draft',
        responsibilities: [],
        required_skills: [],
        preferred_skills: [],
        tools: [],
        min_qualifications: ''
    });
    const [posting, setPosting] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({ full_name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '' });

    // UseRef for WebSocket
    const processedEventTimestamp = useRef<number>(0);
    useEffect(() => {
        if (!lastEvent) return;

        // Prevent processing the same event multiple times
        if (lastEvent.timestamp <= processedEventTimestamp.current) return;
        processedEventTimestamp.current = lastEvent.timestamp;

        if (lastEvent.event === 'application_submitted') {
            const { job_id } = lastEvent.data;
            // Refresh if viewing All Jobs (null) OR the specific job for this application
            if (!selectedJob || selectedJob.id === job_id) {
                fetchApplications(selectedJob ? selectedJob.id : null);
                toast.success("New Application Received!", { icon: '🔔' });
            }
        }

        if (lastEvent.event === 'status_updated') {
            const { application_id, status } = lastEvent.data;
            // Update the application status in the local list immediately
            setApplications(prevApps => prevApps.map(app =>
                app.id === application_id ? { ...app, status } : app
            ));
        }
    }, [lastEvent, selectedJob]);

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
        fetchApplications(selectedJob ? selectedJob.id : null);
    }, [selectedJob, filters]);

    const fetchJobs = async () => {
        try {
            const data = await getJobs();
            const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setJobs(sorted);
        } catch (error) {
            console.error("Failed to load jobs", error);
        }
    };

    const fetchApplications = async (jobId: number | null) => {
        setLoadingApps(true);
        try {
            const appFilters: any = { ...filters };
            if (!appFilters.status || appFilters.status === 'all') delete appFilters.status;
            if (!appFilters.min_score) delete appFilters.min_score;

            const data = await getAdminApplications(jobId, appFilters);
            setApplications(data);
            setAppPage(1); // Reset to first page on new fetch
        } catch (error) {
            console.error("Failed to load applications", error);
            toast.error("Failed to load applications");
        } finally {
            setLoadingApps(false);
        }
    };

    const handleEditJob = (job: Job) => {
        setEditingJobId(job.id);
        setJobData({
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            job_type: job.job_type || '',
            department: job.department || '',
            location: job.location || 'Onsite',
            status: job.status || 'Draft',
            duration: job.duration,
            deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 16) : undefined,
            responsibilities: job.responsibilities || [],
            required_skills: job.required_skills || [],
            preferred_skills: job.preferred_skills || [],
            tools: job.tools || [],
            min_qualifications: job.min_qualifications
        });
        setActiveTab('post-job');
    };

    const handlePostJob = async (e: FormEvent) => {
        e.preventDefault();
        setPosting(true);

        try {
            const finalData = {
                ...jobData,
                requirements: jobData.requirements || jobData.required_skills?.join(', ') || 'See details'
            };

            if (editingJobId) {
                await updateJob(editingJobId, finalData);
                toast.success('Job Updated Successfully!');
            } else {
                await createJob(finalData);
                toast.success('Job Posted Successfully!');
            }

            setJobData({
                title: '', description: '', requirements: '', job_type: '', department: '',
                location: 'Onsite', status: 'Draft', responsibilities: [], required_skills: [], preferred_skills: [], tools: [],
                min_qualifications: ''
            });
            setEditingJobId(null);
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
            {/* Navbar */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 z-20 sticky top-0 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                            <span className="font-bold text-xl text-gray-900 dark:text-white">AdminHub</span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            <div
                                title={isConnected ? "Real-time updates active" : "Disconnected"}
                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}
                            />
                            <ThemeToggle />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                ADMIN
                            </span>
                            <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <LogOut size={20} />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex md:hidden items-center space-x-2">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                {isMenuOpen ? (
                                    <X className="block h-6 w-6" />
                                ) : (
                                    <Menu className="block h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 mb-2">
                                Signed in as <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
                            </div>

                            <div className="px-3 py-2 flex items-center justify-between">
                                <span className="text-base font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
                                <ThemeToggle />
                            </div>

                            <button
                                onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${activeTab === 'dashboard'
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('post-job');
                                    setIsMenuOpen(false);
                                }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${activeTab === 'post-job'
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Post New Job
                            </button>
                            <button
                                onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${activeTab === 'profile'
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Profile
                            </button>

                            <button
                                onClick={logout}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-6 overflow-hidden h-[calc(100vh-64px)]">

                {/* Mobile Search Bar (Outside Menu) */}
                {activeTab === 'dashboard' && (
                    <div className="md:hidden mb-4 relative z-10">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search & Filter Jobs..."
                                className="w-full pl-10 pr-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-white text-base"
                                value={jobSearch}
                                onChange={(e) => setJobSearch(e.target.value)}
                            />
                            <div className="absolute left-3.5 top-3.5 pointer-events-none text-gray-400">
                                <Filter size={20} />
                            </div>
                        </div>
                        {/* Dropdown Results for Mobile Search */}
                        {jobSearch && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg bg-white dark:bg-gray-800 z-50">
                                <button
                                    onClick={() => { setSelectedJob(null); setJobSearch(''); }}
                                    className="block w-full text-left px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    View All Jobs
                                </button>
                                {filteredJobs.map(job => (
                                    <button
                                        key={job.id}
                                        onClick={() => { setSelectedJob(job); setJobSearch(''); }} // Clear search after selection to hide dropdown
                                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-0"
                                    >
                                        {job.title}
                                    </button>
                                ))}
                                {filteredJobs.length === 0 && <div className="p-4 text-center text-sm text-gray-400">No matching jobs</div>}
                            </div>
                        )}
                        {/* Selected Filter Badge */}
                        {selectedJob && !jobSearch && (
                            <div className="mt-2 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300 truncate">
                                    Filter: {selectedJob.title}
                                </span>
                                <button onClick={() => setSelectedJob(null)} className="text-indigo-500 hover:text-indigo-700">
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* SIDEBAR (Desktop Only) */}
                <aside className="hidden md:flex w-64 flex-shrink-0 flex-col gap-4">

                    <div className="flex flex-col space-y-1">
                        <button
                            onClick={() => { setActiveTab('dashboard'); }}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <BarChart2 size={18} className="mr-3" /> Dashboard
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('post-job');
                                setEditingJobId(null); // Reset to create mode if clicked from sidebar
                                setJobData({
                                    title: '', description: '', requirements: '', job_type: '', department: '',
                                    location: 'Onsite', status: 'Draft', responsibilities: [], required_skills: [], preferred_skills: [], tools: [],
                                    min_qualifications: ''
                                });
                            }}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'post-job'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Plus size={18} className="mr-3" /> Post New Job
                        </button>
                        <button
                            onClick={() => { setActiveTab('profile'); }}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <UserIcon size={18} className="mr-3" /> Admin Profile
                        </button>
                    </div>

                    {/* Job List for Filtering (Only show in dashboard) */}
                    {activeTab === 'dashboard' && (
                        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[300px]">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Filter by Job</h3>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search jobs..."
                                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                                        value={jobSearch}
                                        onChange={(e) => setJobSearch(e.target.value)}
                                    />
                                    <div className="absolute left-2.5 top-2 pointer-events-none text-gray-400">
                                        <Filter size={14} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {!jobSearch && (
                                    <button
                                        onClick={() => { setSelectedJob(null); }}
                                        className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedJob === null ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600 dark:border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <p className={`text-sm font-medium ${selectedJob === null ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                                            All Jobs
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            View all applications
                                        </p>
                                    </button>
                                )}
                                {filteredJobs.map(job => (
                                    <button
                                        key={job.id}
                                        onClick={() => { setSelectedJob(job); }}
                                        className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedJob?.id === job.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600 dark:border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <p className={`text-sm font-medium ${selectedJob?.id === job.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                                            {job.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </p>
                                    </button>
                                ))}
                                {filteredJobs.length === 0 && <div className="p-4 text-sm text-gray-400 text-center">No jobs match search</div>}
                            </div>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT Area */}
                <main className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">

                    {activeTab === 'post-job' && (
                        <div className="p-8 max-w-4xl mx-auto w-full overflow-y-auto pb-20">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingJobId ? 'Edit Job Posting' : 'Create New Job Posting'}</h2>

                            {/* Auto-Fill Section (Only for new jobs) */}
                            {!editingJobId && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-lg border border-indigo-100 dark:border-indigo-800 mb-8">
                                    <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-300 mb-4 flex items-center">
                                        <Sparkles size={20} className="mr-2" /> Auto-Fill Data
                                    </h3>
                                    <div className="flex gap-4">
                                        <input
                                            type="url"
                                            placeholder="Paste job posting URL (e.g. LinkedIn, Company Page)..."
                                            className="flex-1 block w-full border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={autofillUrl}
                                            onChange={(e) => setAutofillUrl(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAutofill}
                                            disabled={autofillLoading || !autofillUrl}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {autofillLoading ? (
                                                <>
                                                    <Loader size={16} className="animate-spin mr-2" />
                                                    Fetching...
                                                </>
                                            ) : (
                                                'Fetch'
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-indigo-500 dark:text-indigo-400">
                                        We'll try to extract title, company, location, and description from the link.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handlePostJob} className="space-y-8">

                                {/* Section 1: Basic Info */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title *</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                value={jobData.title}
                                                onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                                            <select
                                                required
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Type *</label>
                                            <select
                                                required
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
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
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location *</label>
                                            <select
                                                required
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                value={jobData.location}
                                                onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                                            >
                                                <option value="Onsite">Onsite</option>
                                                <option value="Remote">Remote</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 3 months"
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                value={jobData.duration || ''}
                                                onChange={(e) => setJobData({ ...jobData, duration: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Application Deadline</label>
                                            <input
                                                type="datetime-local"
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                value={jobData.deadline || ''}
                                                onChange={(e) => setJobData({ ...jobData, deadline: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Overview / Description *</label>
                                        <textarea
                                            required
                                            rows={4}
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                            value={jobData.description}
                                            onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Detailed Requirements (Lists) */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b pb-2">Details & Requirements</h3>

                                    {/* Helper for Lists */}
                                    {[
                                        { label: 'Key Responsibilities', field: 'responsibilities' as keyof JobCreate },
                                        { label: 'Required Skills', field: 'required_skills' as keyof JobCreate },
                                        { label: 'Preferred Skills', field: 'preferred_skills' as keyof JobCreate },
                                        { label: 'Tools & Technologies', field: 'tools' as keyof JobCreate },
                                    ].map((section) => (
                                        <div key={section.field}>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{section.label}</label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    id={`input-${section.field}`}
                                                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                                                    placeholder="Type and press Enter or Add"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = e.currentTarget.value.trim();
                                                            if (val) {
                                                                setJobData(prev => ({
                                                                    ...prev,
                                                                    [section.field]: [...(prev[section.field] as string[] || []), val]
                                                                }));
                                                                e.currentTarget.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.getElementById(`input-${section.field}`) as HTMLInputElement;
                                                        const val = input.value.trim();
                                                        if (val) {
                                                            setJobData(prev => ({
                                                                ...prev,
                                                                [section.field]: [...(prev[section.field] as string[] || []), val]
                                                            }));
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 focus:outline-none"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(jobData[section.field] as string[])?.map((item, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                        {item}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setJobData(prev => ({
                                                                    ...prev,
                                                                    [section.field]: (prev[section.field] as string[]).filter((_, i) => i !== idx)
                                                                }));
                                                            }}
                                                            className="ml-1.5 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Qualifications</label>
                                        <textarea
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                            value={jobData.min_qualifications || ''}
                                            onChange={(e) => setJobData({ ...jobData, min_qualifications: e.target.value })}
                                        />
                                    </div>

                                    {/* Fallback for simple requirements string if needed (hidden or automated) */}
                                    <input
                                        type="hidden"
                                        value={jobData.requirements}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setJobData({ ...jobData, status: 'Draft' });
                                        }}
                                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 mr-auto"
                                    >
                                        Save as Draft
                                    </button>

                                    <button
                                        type="submit"
                                        onClick={() => setJobData(prev => ({ ...prev, status: 'Open' }))}
                                        disabled={posting}
                                        className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md disabled:opacity-50"
                                    >
                                        {posting ? 'Publishing...' : 'Publish Job'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="p-8 max-w-xl mx-auto w-full overflow-y-auto space-y-8">
                            {/* Account Details */}
                            <div className="bg-white dark:bg-gray-800 p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <UserIcon className="mr-2" /> Account Details
                                </h2>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                            value={profileData.full_name}
                                            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                            placeholder="Your Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                        <input
                                            type="email"
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
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
                            <div className="bg-white dark:bg-gray-800 p-6 border-t border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <Lock className="mr-2" /> Security
                                </h2>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
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
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                        {selectedJob ? selectedJob.title : 'All Applications'}
                                        {selectedJob && (
                                            <button
                                                onClick={() => handleEditJob(selectedJob)}
                                                className="ml-3 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                                title="Edit Job Details"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {selectedJob ? `Managing Applications • ${selectedJob.status}` : 'Overview of all candidates'}
                                    </p>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {applications.length} Applicants
                                </div>
                            </div>

                            {/* Filter Bar */}
                            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 shadow-sm z-10">
                                <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wide">
                                    <Filter size={14} className="mr-2" /> Filters
                                </div>

                                <select
                                    className="border-gray-200 dark:border-gray-600 rounded text-sm py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
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
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Min Score:</label>
                                    <input
                                        type="number"
                                        min="0" max="100"
                                        className="w-16 border-gray-200 dark:border-gray-600 rounded text-sm py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                                        placeholder="0"
                                        value={filters.min_score}
                                        onChange={(e) => setFilters({ ...filters, min_score: e.target.value })}
                                    />
                                </div>

                                <div className="flex-1"></div>

                                <select
                                    className="border-gray-200 dark:border-gray-600 rounded text-sm py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                                    value={filters.sort_by}
                                    onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                                >
                                    <option value="date_desc">Newest First</option>
                                    <option value="date_asc">Oldest First</option>
                                    <option value="score_desc">Highest Score</option>
                                </select>
                            </div>

                            {/* Table Area */}
                            <div className="flex-1 overflow-auto">
                                {loadingApps ? (
                                    <div className="flex items-center justify-center h-full text-gray-500">Loading candidates...</div>
                                ) : applications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <UserIcon size={48} className="mb-4 opacity-20" />
                                        <p>No applications found.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Responsive Table/Card Switch */}

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Candidate</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied On</th>
                                                        {!selectedJob && (
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Title</th>
                                                        )}
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ATS Score</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {applications.slice((appPage - 1) * APPS_PER_PAGE, appPage * APPS_PER_PAGE).map((app) => (
                                                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                                        {app.student?.full_name?.charAt(0) || 'U'}
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {app.student?.full_name || `User #${app.student_id}`}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                            <button
                                                                                onClick={() => handleViewCV(app.student_id)}
                                                                                disabled={downloadingCvId === app.student_id}
                                                                                className="flex items-center hover:text-indigo-600 disabled:opacity-50"
                                                                            >
                                                                                {downloadingCvId === app.student_id ? (
                                                                                    <Loader size={12} className="mr-1 animate-spin" />
                                                                                ) : (
                                                                                    <FileText size={12} className="mr-1" />
                                                                                )}
                                                                                View CV
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {new Date(app.created_at).toLocaleDateString()}
                                                            </td>
                                                            {!selectedJob && (
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                    {app.job?.title || `#${app.job_id}`}
                                                                </td>
                                                            )}
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <span className={getScoreColor(app.ats_score)}>{app.ats_score}%</span>
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
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="md:hidden space-y-4 p-4"> {/* Added p-4 for padding on mobile */}
                                            {applications.slice((appPage - 1) * APPS_PER_PAGE, appPage * APPS_PER_PAGE).map((app) => (
                                                <div key={app.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-500 uppercase">Candidate</span>
                                                            <div className="font-medium text-gray-900 dark:text-white">{app.student?.full_name || `User #${app.student_id}`}</div>
                                                            <div className="text-xs text-gray-500">{app.student?.email}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase">Score</span>
                                                            <div className={`font-bold ${getScoreColor(app.ats_score)}`}>{app.ats_score}%</div>
                                                        </div>
                                                    </div>

                                                    {!selectedJob && (
                                                        <div className="mb-3">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase">Job Title</span>
                                                            <div className="font-medium text-gray-900 dark:text-white">{app.job?.title || `#${app.job_id}`}</div>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="text-sm text-gray-500">
                                                            Applied: {new Date(app.created_at).toLocaleDateString()}
                                                        </div>
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full uppercase ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </div> {/* Closing the div for applied date and status */}
                                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700 mt-3">
                                                        <button
                                                            onClick={() => handleViewCV(app.student_id)}
                                                            disabled={downloadingCvId === app.student_id}
                                                            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                                                        >
                                                            {downloadingCvId === app.student_id ? (
                                                                <Loader size={12} className="mr-1 animate-spin" />
                                                            ) : (
                                                                <FileText size={12} className="mr-1" />
                                                            )}
                                                            View CV
                                                        </button>

                                                        <div className="flex space-x-2">
                                                            {app.status === 'applied' || app.status === 'reviewed' ? (
                                                                <>
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
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination Controls */}
                                        {applications.length > APPS_PER_PAGE && (
                                            <div className="flex justify-center items-center space-x-4 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                <button
                                                    onClick={() => setAppPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={appPage === 1}
                                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    Page {appPage} of {Math.ceil(applications.length / APPS_PER_PAGE)}
                                                </span>
                                                <button
                                                    onClick={() => setAppPage(prev => Math.min(prev + 1, Math.ceil(applications.length / APPS_PER_PAGE)))}
                                                    disabled={appPage === Math.ceil(applications.length / APPS_PER_PAGE)}
                                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
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
