// client/src/components/BottomNav.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
    const { unreadCount } = useAuth();

    return (
        <nav className="bottom-nav">
            <NavLink to="/" className="nav-link" end>
                {/* Ícone Home do Google */}
                <span className="material-symbols-outlined">home</span>
            </NavLink>
            <NavLink to="/buscar-usuarios" className="nav-link">
                {/* Ícone de Busca do Google */}
                <span className="material-symbols-outlined">search</span>
            </NavLink>
            <NavLink to="/notificacoes" className="nav-link notification-link">
                {unreadCount > 0 && <span className="notification-badge-bottom">{unreadCount}</span>}
                {/* Ícone de Notificações do Google */}
                <span className="material-symbols-outlined">notifications</span>
            </NavLink>
            <NavLink to="/perfil" className="nav-link">
                {/* Ícone de Perfil do Google */}
                <span className="material-symbols-outlined">person</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;