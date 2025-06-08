// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!currentUser) return; // Só busca se houver usuário
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data);
            // Calcula a contagem de notificações não lidas
            const count = response.data.filter(n => !n.is_read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
        }
    }, [currentUser]); // Depende do currentUser

    useEffect(() => {
        console.log("AuthContext: useEffect para buscar current_user disparado."); // LOG A
        axios.get('/api/auth/current_user')
            .then(response => {
                console.log("AuthContext: Resposta de /api/auth/current_user:", response.data); // LOG B
                if (response.data && response.data.user) {
                    console.log("AuthContext: Definindo currentUser com:", response.data.user); // LOG C
                    setCurrentUser(response.data.user);
                } else {
                    console.log("AuthContext: Nenhum usuário na resposta, definindo currentUser como null."); // LOG D
                    setCurrentUser(null);
                }
            })
            .catch(error => {
                console.error('AuthContext: Erro ao buscar current_user:', error.message); // LOG E
                setCurrentUser(null);
            })
            .finally(() => {
                console.log("AuthContext: Verificação inicial de usuário concluída."); // LOG F
                setIsLoading(false);
            });
    }, []); // Roda apenas uma vez na montagem

    useEffect(() => {
        if (currentUser) {
            fetchNotifications(); // Busca as notificações assim que o usuário é definido
        }
    }, [currentUser, fetchNotifications]);

    const login = (userData) => { // Esta função 'login' não está sendo usada no fluxo atual de redirect
        console.log("AuthContext: Função login manual chamada com:", userData); // LOG G
        setCurrentUser(userData);
    };

    const logout = async () => {
        console.log("AuthContext: Função logout chamada."); // LOG H
        try {
            await axios.get('/api/auth/logout');
            console.log("AuthContext: Logout no backend bem-sucedido, definindo currentUser como null."); // LOG I
            setCurrentUser(null);
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('AuthContext: Erro ao fazer logout:', error); // LOG J
        }
    };

    const value = {
        currentUser,
        setCurrentUser,
        isLoading,
        logout,
        notifications,
        unreadCount,
        fetchNotifications // Exporta a função para poder recarregar as notificações de outros componentes
    };

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado para usar o AuthContext mais facilmente
export const useAuth = () => {
    return useContext(AuthContext);
};