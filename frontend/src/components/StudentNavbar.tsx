import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '../api/notifications';
import { LogOut, User as UserIcon, Briefcase, Bell, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useWebSocket } from '../context/WebSocketContext';

interface StudentNavbarProps {
    onTabChange?: (tab: 'jobs' | 'applications' | 'profile') => void;
}

const StudentNavbar = ({ onTabChange }: StudentNavbarProps) => {
    const { user, logout } = useAuth();
    const { lastEvent } = useWebSocket();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Initial Fetch & WebSocket Listener
    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    useEffect(() => {
        if (!lastEvent) return;
        // Refresh notifications on relevant events
        if (lastEvent.event === 'status_updated') {
            fetchNotifications();
        }
    }, [lastEvent]);

    // Poll for notifications (backup)
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

    const handleProfileClick = () => {
        if (onTabChange) {
            onTabChange('profile');
        } else {
            navigate('/dashboard');
            // NOTE: Ideally we would pass state to open profile tab, but for now dashboard default is acceptable or we can add URL param handling in StudentPortal later.
        }
        setIsMenuOpen(false);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 z-20 sticky top-0 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link to="/dashboard" className="flex items-center">
                        <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                        <span className="font-bold text-xl text-gray-900 dark:text-white">InternHub</span>
                    </Link>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        {/* ThemeToggle removed from shared mobile view in previous refactor? 
                            Checking StudentPortal reference: It had ThemeToggle removed from shared div. 
                            But we want ThemeToggle VISIBLE in Mobile Menu inside Dropdown. 
                            Wait, the previous refactor moved it to Mobile Menu Dropdown. 
                            So here in shared Desktop/Mobile bar, it should NOT be present for mobile?
                            Actually, typically ThemeToggle is nice to have always visible, but per previous user request we moved it to hamburger menu.
                            So I will respect that: Hidden on mobile, visible on desktop.
                         */}

                        {/* Notifications - Always Visible */}
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
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notifications</h3>
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
                                                    className={`p-4 border-b border-gray-50 dark:border-gray-700 cursor-pointer transition-colors ${notif.is_read ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'}`}
                                                >
                                                    <p className={`text-sm ${notif.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Only Items */}
                        <div className="hidden md:flex items-center space-x-4">
                            <ThemeToggle />
                            <button
                                onClick={handleProfileClick}
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

                        {/* Mobile Hamburger */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                {isMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
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
                            onClick={handleProfileClick}
                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => { logout(); setIsMenuOpen(false); }}
                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default StudentNavbar;
