import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface WebSocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
    lastEvent: WebSocketEvent | null;
}

interface WebSocketEvent {
    event: string;
    data: any;
    timestamp: number;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<any>(undefined);

    const connectForUser = (accessToken: string) => {
        // Close existing connection if any
        if (socketRef.current) {
            socketRef.current.close();
        }

        const wsUrl = `ws://localhost:8000/api/v1/ws?token=${accessToken}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WS Message:', message);

                // Set last event for components to react to
                setLastEvent({
                    event: message.event,
                    data: message.data,
                    timestamp: Date.now()
                });

                // Global Toast Notifications
                switch (message.event) {
                    case 'job_posted':
                        if (user?.role === 'student') {
                            toast.success(`New Job Posted: ${message.data.title}`, { duration: 5000 });
                        }
                        break;
                    case 'application_submitted':
                        if (user?.role === 'admin') {
                            toast('New Application Received!', { icon: '📝' });
                        }
                        break;
                    case 'status_updated':
                        if (user?.role === 'student') {
                            toast(
                                message.data.status === 'accepted' ? '🎉 Application Accepted!' : 'ℹ️ Application Status Updated',
                                { duration: 5000 }
                            );
                        }
                        break;
                }

            } catch (error) {
                console.error('Error parsing WS message:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            socketRef.current = null;

            // Reconnect logic if user is still logged in
            if (token) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting Reconnect...');
                    connectForUser(accessToken); // Recursive reconnect
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            ws.close();
        };

        socketRef.current = ws;
    };

    useEffect(() => {
        if (token) {
            connectForUser(token);
        } else {
            // Logout cleanup
            if (socketRef.current) {
                socketRef.current.close();
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [token]); // Re-run when token changes (login/logout)

    return (
        <WebSocketContext.Provider value={{ socket: socketRef.current, isConnected, lastEvent }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
