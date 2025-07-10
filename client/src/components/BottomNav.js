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
                <span className="material-symbols-outlined">emoji_events</span>
            </NavLink>
            {/* O novo link para Desafios */}
            <NavLink to="/desafios" className="nav-link">
                <span className="material-symbols-outlined">military_tech</span>
            </NavLink>
            <NavLink to="/buscar-usuarios" className="nav-link">
                <span className="material-symbols-outlined">search</span>
            </NavLink>
            <NavLink to="/notificacoes" className="nav-link notification-link">
                {unreadCount > 0 && <span className="notification-badge-bottom">{unreadCount}</span>}
                <span className="material-symbols-outlined">notifications</span>
            </NavLink>
            <NavLink to="/perfil" className="nav-link">
                <span className="material-symbols-outlined">person</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;