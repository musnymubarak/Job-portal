import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { createJob, getAdminApplications, type JobCreate, type Application } from '../api/jobs';
import { LogOut, Plus, Briefcase, FileText, BarChart2 } from 'lucide-react';

const AdminPortal = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'applications' | 'post-job'>('applications');
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [jobData, setJobData] = useState<JobCreate>({ title: '', description: '', requirements: '' });
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        if (activeTab === 'applications') {
            fetchApplications();
        }
    }, [activeTab]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const data = await getAdminApplications();
            setApplications(data);
        } catch (error) {
            console.error("Failed to load applications", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostJob = async (e: FormEvent) => {
        e.preventDefault();
        setPosting(true);
        try {
            await createJob(jobData);
            alert("Job Posted Successfully!");
            setJobData({ title: '', description: '', requirements: '' });
            setActiveTab('applications'); // Switch back or stay?
        } catch (error) {
            console.error(error);
            alert("Failed to post job");
        } finally {
            setPosting(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 font-bold';
        if (score >= 60) return 'text-yellow-600 font-medium';
        return 'text-red-600';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-100">
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tabs */}
                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'applications'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <BarChart2 size={18} className="mr-2" /> ATS Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('post-job')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'post-job'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <Plus size={18} className="mr-2" /> Post New Job
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'applications' ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900">Application Review</h3>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading data...</div>
                        ) : applications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No applications received yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATS Score</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CV</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {applications.map((app) => (
                                            <tr key={app.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{app.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.job_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.student_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={getScoreColor(app.ats_score)}>{app.ats_score}%</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:text-indigo-900">
                                                    {/* In a real app, this would be a download link */}
                                                    <a href="#" className="flex items-center"><FileText size={16} className="mr-1" /> Download</a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {app.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900">Create New Job Posting</h3>
                        </div>
                        <form onSubmit={handlePostJob} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={jobData.title}
                                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={jobData.description}
                                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Requirements (Keywords for ATS)</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={jobData.requirements}
                                    onChange={(e) => setJobData({ ...jobData, requirements: e.target.value })}
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={posting}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {posting ? 'Posting...' : 'Post Job'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </main>
        </div>
    );
};

export default AdminPortal;
