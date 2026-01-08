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
    const { token } = useAuth();
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
            console.log('Admin WebSocket Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WS Message:', message);

                setLastEvent({
                    event: message.event,
                    data: message.data,
                    timestamp: Date.now()
                });

                // Toast Notifications for Admin
                if (message.event === 'application_submitted') {
                    toast('New Application Received!', { icon: '📝' });
                }

            } catch (error) {
                console.error('Error parsing WS message:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            socketRef.current = null;

            if (token) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectForUser(accessToken);
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
    }, [token]);

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
