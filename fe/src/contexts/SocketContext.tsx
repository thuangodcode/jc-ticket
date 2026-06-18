import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserAuth } from './useUserAuth';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useUserAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Nếu chưa xác thực, ngắt kết nối socket nếu có
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('accessToken');

    // Khởi tạo kết nối socket.io client
    const newSocket = io(serverUrl, {
      auth: {
        token: token ? `Bearer ${token}` : '',
      },
      autoConnect: true,
      transports: ['websocket', 'polling'], // Fallback nếu websocket bị chặn
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.io connected to backend');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket.io disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
