import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Successfully logged in!');
            navigate('/dashboard');
        } catch (err) {
            toast.error('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            {/* Branding Section */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
                {/* Decorative background elements could go here */}
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">InternHub</h1>
                    <p className="text-xl md:text-2xl text-blue-100 font-medium">
                        Find internships. Apply smarter. <br />Track your future.
                    </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>

            {/* Login Form Section */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-blue-50 rounded-full">
                                <Lock className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Log in to manage your internship applications
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Enter your email"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors bg-gray-50 hover:bg-white"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors bg-gray-50 hover:bg-white"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            Your credentials are securely encrypted.
                        </p>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default Login;
