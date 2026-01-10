import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { getJobs, getMyApplications, type Job, type Application } from '../api/jobs';
import { uploadCV, updateProfile, changePassword } from '../api/users';
import { getStudentProfile, createStudentProfile, updateStudentProfile, type StudentProfile as IStudentProfile, type PortfolioProject, type StudentSkill } from '../api/studentProfile';
import { User as UserIcon, FileText, CheckCircle, Filter, Upload, LogOut, Github, Linkedin, Globe, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWebSocket } from '../context/WebSocketContext';
import StudentNavbar from '../components/StudentNavbar';

const StudentPortal = () => {
    const { user, setUser } = useAuth();
    const { lastEvent } = useWebSocket();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'profile'>('jobs');

    // Handle Hash Navigation (e.g. from external link to #profile)
    useEffect(() => {
        if (location.hash === '#profile') {
            setActiveTab('profile');
        }
    }, [location]);
    // Mobile menu state moved to Navbar

    // WebSocket Listener: Auto-refresh data on events
    useEffect(() => {
        if (!lastEvent) return;

        if (lastEvent.event === 'job_posted') {
            fetchJobs();
            // Optional: show a dot on jobs tab?
            // Optional: show a dot on jobs tab?
        } else if (lastEvent.event === 'status_updated') {
            fetchApplications();
            // Notifications handled in Navbar
        }
    }, [lastEvent]);

    // Notifications state moved to Navbar

    // Jobs State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);

    // ... (filters state) ...
    const [filters, setFilters] = useState({
        job_type: '',
        department: '',
        sort_by: 'newest',
        application_status: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const JOBS_PER_PAGE = 6;

    // Applications State
    const [myApplications, setMyApplications] = useState<Application[]>([]);

    // Profile State
    const [uploading, setUploading] = useState(false);
    const [profileData, setProfileData] = useState({ full_name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '' });

    // Sync profile data when user loads
    useEffect(() => {
        if (user) {
            setProfileData({ full_name: user.full_name || '', email: user.email || '' });
            fetchApplications();
            fetchStudentProfile(); // Fetch enhanced profile
        }
    }, [user]);

    // Enhanced Profile State
    const [studentProfile, setStudentProfile] = useState<IStudentProfile>({
        projects: [],
        skills: []
    });

    const fetchStudentProfile = async () => {
        try {
            const data = await getStudentProfile();
            setStudentProfile(data);
        } catch (error: any) {
            // If 404, it means profile doesn't exist yet, which is fine (we will create on save)
            if (error?.response?.status !== 404) {
                console.error("Error fetching profile", error);
            }
        }
    };




    // ... (rest of effects) ...
    useEffect(() => {
        if (activeTab === 'jobs') {
            fetchJobs();
            setCurrentPage(1); // Reset page on filter/tab change
        }
        if (activeTab === 'applications') fetchApplications();
    }, [activeTab, filters]);

    // ... (fetch jobs/apps functions) ...
    const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
            // Clean empty filters
            const activeFilters: any = { ...filters };
            if (!activeFilters.job_type) delete activeFilters.job_type;
            if (!activeFilters.department) delete activeFilters.department;
            if (!activeFilters.application_status) delete activeFilters.application_status;

            const data = await getJobs(activeFilters);
            setJobs(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load jobs");
        } finally {
            setLoadingJobs(false);
        }
    };

    const fetchApplications = async () => {
        try {
            const data = await getMyApplications();
            setMyApplications(data);
        } catch (error) {
            console.error(error);
        }
    };

    // ... (handle functions) ...

    const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            const uploadPromise = uploadCV(e.target.files[0]);

            toast.promise(uploadPromise, {
                loading: 'Uploading CV...',
                success: 'CV Uploaded Successfully!',
                error: 'Failed to upload CV'
            });

            try {
                const updatedUser = await uploadPromise;
                setUser(updatedUser);
            } catch (error) {
                console.error(error);
            } finally {
                setUploading(false);
            }
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

    const handleSaveEnhancedProfile = async (e: FormEvent) => {
        e.preventDefault();

        // logic: if id exists, update, else create
        // But create endpoint also handles logic? Or we use create for first time
        // Let's try update, if 404 then create? Or check ID

        let promise;
        if (studentProfile.id) {
            promise = updateStudentProfile(studentProfile);
        } else {
            promise = createStudentProfile(studentProfile);
        }

        toast.promise(promise, {
            loading: 'Saving Profile Details...',
            success: 'Profile Details Saved!',
            error: 'Failed to save details'
        });

        try {
            const updated = await promise;
            setStudentProfile(updated);
        } catch (error) {
            console.error(error);
        }
    };

    // Helper to update fields
    const updateProfileField = (field: keyof IStudentProfile, value: any) => {
        setStudentProfile(prev => ({ ...prev, [field]: value }));
    };

    // Helper for Projects
    const addProject = () => {
        setStudentProfile(prev => ({
            ...prev,
            projects: [...prev.projects, { title: '', description: '', link: '' }]
        }));
    };
    const removeProject = (index: number) => {
        setStudentProfile(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }));
    };
    const updateProject = (index: number, field: keyof PortfolioProject, value: string) => {
        const newProjects = [...studentProfile.projects];
        newProjects[index] = { ...newProjects[index], [field]: value };
        setStudentProfile(prev => ({ ...prev, projects: newProjects }));
    };

    // Helper for Skills
    const addSkill = () => {
        setStudentProfile(prev => ({
            ...prev,
            skills: [...prev.skills, { name: '', level: 'beginner' }]
        }));
    };
    const removeSkill = (index: number) => {
        setStudentProfile(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };
    const updateSkill = (index: number, field: keyof StudentSkill, value: string) => {
        const newSkills = [...studentProfile.skills];
        // @ts-ignore
        newSkills[index] = { ...newSkills[index], [field]: value };
        setStudentProfile(prev => ({ ...prev, skills: newSkills }));
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
            {/* Navbar */}
            <StudentNavbar onTabChange={setActiveTab} />

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tabs - Scrollable on mobile */}
                <div className="flex space-x-4 mb-8 border-b border-gray-200 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Open Positions
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'applications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My Applications
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My Profile
                    </button>
                </div>

                {/* CONTENT */}
                {activeTab === 'jobs' && (
                    <div className="space-y-6">
                        {/* Filters Bar */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                <Filter size={16} className="mr-2" /> Filters:
                            </div>

                            <select
                                className="border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                                value={filters.job_type}
                                onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
                            >
                                <option value="">All Types</option>
                                <option value="Internship">Internship</option>
                                <option value="Full-time">Full-time</option>
                            </select>

                            <select
                                className="border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                                value={filters.department}
                                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                            >
                                <option value="">All Departments</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Design">Design</option>
                                <option value="Product">Product</option>
                            </select>

                            <div className="flex-1"></div>

                            <select
                                className="border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                                value={filters.application_status}
                                onChange={(e) => setFilters({ ...filters, application_status: e.target.value })}
                            >
                                <option value="">All Applications</option>
                                <option value="applied">Applied</option>
                                <option value="not_applied">Not Applied</option>
                            </select>

                            <select
                                className="border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white"
                                value={filters.sort_by}
                                onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>

                        {/* Job List */}
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {jobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE).map(job => (
                                <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h3>
                                            <div className="flex gap-2 mt-1">
                                                {job.job_type && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{job.job_type}</span>
                                                )}
                                                {job.department && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{job.department}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-1">{job.description}</p>
                                    <Link
                                        to={`/jobs/${job.id}`}
                                        className={`w-full mt-auto text-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${myApplications.some(app => app.job_id === job.id)
                                            ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        {myApplications.some(app => app.job_id === job.id) ? 'View Status' : 'View Details'}
                                    </Link>
                                </div>
                            ))}
                            {jobs.length === 0 && !loadingJobs && (
                                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                                    No jobs found matching your criteria.
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {jobs.length > JOBS_PER_PAGE && (
                            <div className="flex justify-center items-center space-x-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Page {currentPage} of {Math.ceil(jobs.length / JOBS_PER_PAGE)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(jobs.length / JOBS_PER_PAGE)))}
                                    disabled={currentPage === Math.ceil(jobs.length / JOBS_PER_PAGE)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'applications' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {myApplications.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                You haven't applied to any jobs yet.
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Title</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied On</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Feedback</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {myApplications.map((app) => (
                                                <tr key={app.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{app.job?.title}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{app.job?.department}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(app.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="font-bold text-indigo-600">{app.ats_score}%</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full uppercase ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                        {app.ai_feedback || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {myApplications.map((app) => (
                                        <div key={app.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white">{app.job?.title}</h3>
                                                    <p className="text-xs text-gray-500">{app.job?.department}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                                                <span className="font-bold text-indigo-600">Score: {app.ats_score}%</span>
                                            </div>
                                            {app.ai_feedback && (
                                                <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                                    Feedback: {app.ai_feedback}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="max-w-xl mx-auto space-y-8">
                        {/* CV Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <FileText className="mr-2" /> CV Management
                            </h2>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current CV</label>
                                {user?.cv_filename ? (
                                    <div className="flex items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                                        <FileText size={20} className="mr-3" />
                                        <span className="flex-1 truncate text-sm font-medium">{user.cv_filename}</span>
                                        <CheckCircle size={18} className="text-green-500 ml-2" />
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No CV uploaded yet.</p>
                                )}
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload New CV (PDF)</label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                                            <p className="text-xs text-gray-500">PDF only (MAX. 5MB)</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={handleCVUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <LogOut className="mr-2 rotate-90" /> Security
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

                        {/* Enhanced Profile (GitHub, LinkedIn, Projects, Skills) */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <Globe className="mr-2" /> Professional Details
                            </h2>
                            <form onSubmit={handleSaveEnhancedProfile} className="space-y-6">
                                {/* Social Links */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><Github size={14} className="mr-1" /> GitHub URL</label>
                                        <input
                                            type="url"
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                            value={studentProfile.github_url || ''}
                                            onChange={(e) => updateProfileField('github_url', e.target.value)}
                                            placeholder="https://github.com/username"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><Linkedin size={14} className="mr-1" /> LinkedIn URL</label>
                                        <input
                                            type="url"
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                            value={studentProfile.linkedin_url || ''}
                                            onChange={(e) => updateProfileField('linkedin_url', e.target.value)}
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center"><Globe size={14} className="mr-1" /> Portfolio Website</label>
                                        <input
                                            type="url"
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                            value={studentProfile.portfolio_url || ''}
                                            onChange={(e) => updateProfileField('portfolio_url', e.target.value)}
                                            placeholder="https://myportfolio.com"
                                        />
                                    </div>
                                </div>

                                {/* Skills */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Skills</h3>
                                        <button type="button" onClick={addSkill} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                                            <Plus size={16} className="mr-1" /> Add Skill
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {studentProfile.skills.map((skill, index) => (
                                            <div key={index} className="flex gap-2 items-start">
                                                <input
                                                    type="text"
                                                    placeholder="Skill Name (e.g. React)"
                                                    className="flex-1 min-w-0 block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                    value={skill.name}
                                                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                                                />
                                                <select
                                                    className="block w-32 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                    value={skill.level}
                                                    onChange={(e) => updateSkill(index, 'level', e.target.value)}
                                                >
                                                    <option value="beginner">Beginner</option>
                                                    <option value="intermediate">Intermediate</option>
                                                    <option value="advanced">Advanced</option>
                                                </select>
                                                <button type="button" onClick={() => removeSkill(index)} className="p-2 text-red-500 hover:text-red-700">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        {studentProfile.skills.length === 0 && <p className="text-sm text-gray-500 italic">No skills added yet.</p>}
                                    </div>
                                </div>

                                {/* Projects */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Projects</h3>
                                        <button type="button" onClick={addProject} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                                            <Plus size={16} className="mr-1" /> Add Project
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        {studentProfile.projects.map((project, index) => (
                                            <div key={index} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg relative">
                                                <button type="button" onClick={() => removeProject(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Project Title"
                                                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                        value={project.title}
                                                        onChange={(e) => updateProject(index, 'title', e.target.value)}
                                                    />
                                                    <textarea
                                                        placeholder="Description"
                                                        rows={2}
                                                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                        value={project.description || ''}
                                                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                                                    />
                                                    <input
                                                        type="url"
                                                        placeholder="Project Link (URL)"
                                                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                                        value={project.link || ''}
                                                        onChange={(e) => updateProject(index, 'link', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {studentProfile.projects.length === 0 && <p className="text-sm text-gray-500 italic">No projects added yet.</p>}
                                    </div>
                                </div>

                                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 w-full md:w-auto">
                                    Save Detailed Profile
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPortal;
