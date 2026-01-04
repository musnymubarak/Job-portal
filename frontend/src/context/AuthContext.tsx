import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login as loginApi, register as registerApi, type RegisterData } from '../api/auth';
import { getMe } from '../api/users';

export interface User {
    id: number;
    email: string;
    role: string;
    full_name?: string;
    cv_filename?: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState<boolean>(!!localStorage.getItem('token'));

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const userData = await getMe();
                    if (userData.role !== 'student') {
                        throw new Error("Unauthorized Access: Students Only");
                    }
                    setUser(userData);
                } catch (e) {
                    console.error("Failed to fetch user or unauthorized", e);
                    logout();
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        initAuth();
    }, [token]);

    const login = async (username: string, password: string) => {
        try {
            const data = await loginApi(username, password);
            setToken(data.access_token);
            localStorage.setItem('token', data.access_token);

            try {
                const userData = await getMe();
                if (userData.role !== 'student') {
                    throw new Error("Access Denied: You must be a Student.");
                }
                setUser(userData);
            } catch (err) {
                logout();
                throw err;
            }
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const register = async (userData: RegisterData) => {
        await registerApi(userData);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated: !!token, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
