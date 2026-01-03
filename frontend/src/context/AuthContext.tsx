import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login as loginApi, register as registerApi, type RegisterData } from '../api/auth';

// Note: In a real app we would decode the token to get the user info or fetch /users/me
// For now we will just store the token and a simple user object
export interface User {
    id: number;
    email: string;
    role: string;
    cv_filename?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            // Here we ideally fetch user data using the token
            // For simplicity in this step, we'll try to decode if possible or just assume logged in
            // In a production app, verify token validity
            try {
                // Logic to decode token would go here
                // setUser({ email: decoded.sub, role: 'student' }); // Mock
            } catch (e) {
                logout();
            }
        }
    }, [token]);

    const login = async (username: string, password: string) => {
        try {
            const data = await loginApi(username, password);
            setToken(data.access_token);
            localStorage.setItem('token', data.access_token);
            // We really should fetch the user details here
            // For now, let's mock the user state update so the UI reacts
            // Mock update, should be replaced by fetch
            setUser({ email: username, role: 'student', id: 1 });
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
        <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated: !!token, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
