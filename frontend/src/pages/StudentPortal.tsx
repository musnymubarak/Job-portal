import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getJobs, getMyApplications, type Job, type Application } from '../api/jobs';
import { uploadCV, updateProfile, changePassword } from '../api/users';
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '../api/notifications';
import { LogOut, Upload, User as UserIcon, Briefcase, FileText, CheckCircle, Filter, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentPortal = () => {
    const { user, logout, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'profile'>('jobs');

    // Notifications State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Jobs State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);

    // ... (filters state) ...
    const [filters, setFilters] = useState({
        job_type: '',
        department: '',
        sort_by: 'newest'
    });

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
            fetchNotifications();
            fetchApplications();
        }
    }, [user]);

    // Poll for notifications
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const handleMarkRead = async (id: number) => {
        try {
            await markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // ... (rest of effects) ...
    useEffect(() => {
        if (activeTab === 'jobs') fetchJobs();
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-100 z-20 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <Briefcase className="h-6 w-6 text-indigo-600 mr-2" />
                            <span className="font-bold text-xl text-gray-900">InternHub</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 relative transition-colors"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                                            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={() => { markAllAsRead(); setNotifications(notifications.map(n => ({ ...n, is_read: true }))); }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400 text-sm">
                                                    No notifications
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                                                        className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${notif.is_read ? 'bg-white hover:bg-gray-50' : 'bg-indigo-50 hover:bg-indigo-100'}`}
                                                    >
                                                        <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setActiveTab('profile')}
                                className="text-gray-600 hover:text-indigo-600 font-medium text-sm flex items-center"
                            >
                                <UserIcon size={16} className="mr-1" /> Profile
                            </button>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                STUDENT
                            </span>
                            <button onClick={logout} className="text-gray-400 hover:text-gray-600">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tabs */}
                <div className="flex space-x-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Open Positions
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'applications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My Applications
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My Profile
                    </button>
                </div>

                {/* CONTENT */}
                {activeTab === 'jobs' && (
                    <div className="space-y-6">
                        {/* Filters Bar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center text-gray-500 text-sm font-medium">
                                <Filter size={16} className="mr-2" /> Filters:
                            </div>

                            <select
                                className="border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                value={filters.job_type}
                                onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
                            >
                                <option value="">All Types</option>
                                <option value="Internship">Internship</option>
                                <option value="Full-time">Full-time</option>
                            </select>

                            <select
                                className="border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                                className="border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                value={filters.sort_by}
                                onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>

                        {/* Job List */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
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
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{job.description}</p>
                                    <Link
                                        to={`/jobs/${job.id}`}
                                        className={`w-full mt-auto text-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${myApplications.some(app => app.job_id === job.id)
                                            ? 'bg-white border border-gray-200 text-green-600'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        {myApplications.some(app => app.job_id === job.id) ? 'View Status' : 'View Details'}
                                    </Link>
                                </div>
                            ))}
                            {jobs.length === 0 && !loadingJobs && (
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    No jobs found matching your criteria.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'applications' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {myApplications.map((app) => (
                                    <tr key={app.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{app.job_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {app.status === 'accepted' ? '🎉 Accepted' : 'Pending Review'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {myApplications.length === 0 && <div className="p-8 text-center text-gray-500">You haven't applied to any jobs yet.</div>}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="max-w-xl mx-auto space-y-8">
                        {/* CV Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <FileText className="mr-2" /> CV Management
                            </h2>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Current CV</label>
                                {user?.cv_filename ? (
                                    <div className="flex items-center p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-700">
                                        <FileText size={20} className="mr-3" />
                                        <span className="flex-1 truncate text-sm font-medium">{user.cv_filename}</span>
                                        <CheckCircle size={18} className="text-green-500 ml-2" />
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No CV uploaded yet.</p>
                                )}
                            </div>
                            <div className="border-t border-gray-100 pt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload New CV (PDF)</label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <LogOut className="mr-2 rotate-90" /> Security
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
            </div>
        </div>
    );
};

export default StudentPortal;
