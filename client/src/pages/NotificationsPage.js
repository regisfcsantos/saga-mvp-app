// client/src/pages/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './NotificationsPage.css'; // Criaremos este arquivo para os estilos

// Função auxiliar para formatar datas de forma amigável
const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `há ${Math.floor(interval)} anos`;
    interval = seconds / 2592000;
    if (interval > 1) return `há ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `há ${Math.floor(interval)} dias`;
    interval = seconds / 3600;
    if (interval > 1) return `há ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `há ${Math.floor(interval)} minutos`;
    return `há ${Math.floor(seconds)} segundos`;
};

const NotificationsPage = () => {
    const [localNotifications, setLocalNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setNotificationAsRead, setAllNotificationsAsRead, unreadCount } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAndSetNotifications = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('/api/notifications');
                setLocalNotifications(response.data);
            } catch (error) {
                console.error("Falha ao buscar notificações na página:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndSetNotifications();
    }, []);

    const handleNotificationClick = async (notification) => {
        // 1. Atualiza o estado visual e o contador global IMEDIATAMENTE
        setNotificationAsRead(notification.id);

        // 2. Navega para o link da notificação
        navigate(notification.link);

        // 3. Informa a API no backend que a notificação foi lida (sem bloquear a navegação)
        try {
            await axios.put(`/api/notifications/${notification.id}/read`);
        } catch (error) {
            console.error('Falha ao marcar notificação como lida no servidor:', error);
        }
    };
    
    const handleMarkAllAsRead = async () => {
        // Atualiza a UI primeiro
        setAllNotificationsAsRead();
        setLocalNotifications(prev => prev.map(n => ({...n, is_read: true})));

        // Chama a API
        try {
            await axios.put('/api/notifications/read-all');
        } catch (error) {
            console.error('Falha ao marcar todas como lidas no servidor:', error);
        }
    };

    return (
        <div className="notifications-page-container">
            <div className="notifications-header">
                <h1>Minhas Notificações</h1>
                {unreadCount > 0 && (
                     <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {isLoading ? (
                <p>Carregando notificações...</p>
            ) : localNotifications.length > 0 ? (
                <div className="notifications-list">
                    {localNotifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`notification-item ${!notif.is_read ? 'unread' : 'read'}`}
                            onClick={() => handleNotificationClick(notif)}
                        >
                            {!notif.is_read && <div className="unread-dot"></div>}
                            <div className="notification-content">
                                <p className="notification-message" dangerouslySetInnerHTML={{ __html: notif.message }}></p>
                                <small className="notification-time">{formatTimeAgo(notif.created_at)}</small>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-notifications-message">Nenhuma notificação por enquanto.</p>
            )}
        </div>
    );
};

export default NotificationsPage;