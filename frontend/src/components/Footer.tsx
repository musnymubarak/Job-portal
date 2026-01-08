import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 border-t border-gray-800 dark:border-gray-900 text-sm mt-auto relative z-10 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Brand & Purpose */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-gray-200 tracking-wide">CareerConnect</h3>
                        <p className="leading-relaxed max-w-xs">
                            A centralized internship and job management platform designed to streamline applications, reviews, and hiring decisions through a secure and intelligent workflow.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-base font-semibold text-gray-200 mb-3">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><Link to="/dashboard" className="hover:text-gray-200 transition-colors">Jobs</Link></li>
                            <li><Link to="/dashboard" className="hover:text-gray-200 transition-colors">Dashboard</Link></li>
                            <li><Link to="/dashboard" className="hover:text-gray-200 transition-colors">Applications</Link></li>
                            <li><a href="http://localhost:5174" target="_blank" rel="noreferrer" className="hover:text-gray-200 transition-colors">Admin Portal</a></li>
                        </ul>
                    </div>

                    {/* Trust & Contact */}
                    <div>
                        <h4 className="text-base font-semibold text-gray-200 mb-3">Trust & Contact</h4>
                        <ul className="space-y-2">
                            <li>support@careerconnect.app</li>
                            <li>Built with FastAPI & React</li>
                            <li>Secure authentication and data handling</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-800 text-center">
                    <p>&copy; 2026 CareerConnect. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
