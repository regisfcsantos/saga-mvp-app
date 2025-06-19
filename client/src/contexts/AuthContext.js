// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// client/src/contexts/AuthContext.js
// ... (imports e início do componente)

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!currentUser) return;
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data);
            const count = response.data.filter(n => !n.is_read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
        }
    }, [currentUser]);

    // ... (useEffect para buscar current_user e fetchNotifications)
    useEffect(() => {
        axios.get('/api/auth/current_user')
            .then(response => {
                if (response.data && response.data.user) {
                    setCurrentUser(response.data.user);
                } else {
                    setCurrentUser(null);
                }
            })
            .catch(error => {
                console.error('AuthContext: Erro ao buscar current_user:', error.message);
                setCurrentUser(null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
        }
    }, [currentUser, fetchNotifications]);


    const logout = async () => {
        try {
            await axios.get('/api/auth/logout');
            setCurrentUser(null);
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('AuthContext: Erro ao fazer logout:', error);
        }
    };
    
    // --- INÍCIO DAS NOVAS FUNÇÕES ---

    // Função para atualizar o estado de uma notificação no frontend
    const setNotificationAsRead = (notificationId) => {
        // Encontra a notificação no array de estado
        const notification = notifications.find(n => n.id === notificationId);
        // Se ela existir e não estiver lida, atualiza o estado
        if (notification && !notification.is_read) {
            setNotifications(prevNotifications =>
                prevNotifications.map(n =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            // Diminui o contador de não lidas
            setUnreadCount(prevCount => (prevCount > 0 ? prevCount - 1 : 0));
        }
    };
    
    // Função para limpar o contador quando marcamos todas como lidas
    const setAllNotificationsAsRead = () => {
        setNotifications(prevNotifications =>
            prevNotifications.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
    };

    // --- FIM DAS NOVAS FUNÇÕES ---

    const value = {
        currentUser,
        setCurrentUser,
        isLoading,
        logout,
        notifications, // Mantemos para acesso geral
        unreadCount,
        fetchNotifications,
        // Exportamos as novas funções para serem usadas na página de notificações
        setNotificationAsRead,
        setAllNotificationsAsRead,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};