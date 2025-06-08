// client/src/components/NotificationsDropdown.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './NotificationsDropdown.css';

const NotificationsDropdown = ({ closeDropdown }) => {
    const { notifications = [], fetchNotifications } = useAuth();
    const navigate = useNavigate();

    const handleNotificationClick = async (notification) => {
        // Se a notificação não estiver lida, marca como lida no backend
        if (!notification.is_read) {
            try {
                await axios.put(`/api/notifications/${notification.id}/read`);
                fetchNotifications(); // Recarrega as notificações para atualizar o estado
            } catch (error) {
                console.error("Erro ao marcar notificação como lida:", error);
            }
        }
        // Navega para o link da notificação e fecha o dropdown
        navigate(notification.link);
        closeDropdown();
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.put(`/api/notifications/read-all`);
            fetchNotifications();
        } catch (error) {
             console.error("Erro ao marcar todas como lidas:", error);
        }
    };

    return (
        <div className="notifications-dropdown">
            <div className="notifications-header">
                <h4>Notificações</h4>
                <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">Marcar todas como lidas</button>
            </div>
            {notifications.length === 0 ? (
                <p className="no-notifications">Nenhuma notificação por enquanto.</p>
            ) : (
                <ul className="notification-list">
                    {notifications.map(notif => (
                        <li key={notif.id}>
                            {/* Usamos um <a> com onClick em vez de <Link> para ter mais controle sobre a ação */}
                            <a 
                                href={notif.link}
                                className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNotificationClick(notif);
                                }}
                            >
                                {notif.message}
                                <div style={{fontSize: '0.8em', color: '#777', marginTop: '4px'}}>
                                    {new Date(notif.created_at).toLocaleString('pt-BR')}
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NotificationsDropdown;