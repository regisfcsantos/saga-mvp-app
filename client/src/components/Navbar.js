// client/src/components/Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';
import Searchbar from './Searchbar';
// import './Navbar.css'; 

const notificationIconStyle = {
    position: 'relative',
    cursor: 'pointer',
    color: 'white',
    fontSize: '1.5em',
    marginRight: '20px'
};

const notificationBadgeStyle = {
    position: 'absolute',
    top: '-5px',
    right: '-10px',
    background: 'red',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 6px',
    fontSize: '0.7em',
    fontWeight: 'bold'
};

const Navbar = () => {
    const { currentUser, logout, isLoading, unreadCount } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);

    // console.log("Navbar currentUser:", currentUser); // Você pode manter para debug se quiser
    // console.log("Navbar isLoading:", isLoading);

    if (isLoading) {
        return null; 
    }

    return (
        <nav style={{ background: '#333', padding: '1rem', display: 'flex', alignItems: 'center' }}> {/* Mudei para flex para melhor alinhamento */}
            {/* Links principais à esquerda */}
            <div>
                <Link to="/" style={{ color: 'white', margin: '0 15px 0 0', textDecoration: 'none', fontSize: '1.1em' }}>Home SAGA</Link>
                {/* Exemplo: <Link to="/competicoes" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>Competições</Link> */}
            </div>

            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                <Searchbar />
            </div>
            
            {/* Links de usuário/admin à direita */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                {currentUser ? (
                    <>
                        {/* <<--- ÍCONE DE NOTIFICAÇÃO (SINO) ---<<< */}
                        <div style={notificationIconStyle} onClick={() => setShowNotifications(!showNotifications)}>
                            <i className="fas fa-bell"></i> {/* Ícone de sino do Font Awesome */}
                            {unreadCount > 0 && (
                                <span style={notificationBadgeStyle}>{unreadCount}</span>
                            )}
                        </div>
                        {currentUser.role === 'admin' && ( 
                            <Link to="/admin/aprovar-boxes" style={{ color: 'yellow', fontWeight: 'bold', marginRight: '15px', textDecoration: 'none' }}>
                                Painel Admin
                            </Link>
                        )}
                        {/* ***** FIM DA ADIÇÃO/CORREÇÃO ***** */}

                        <Link to="/perfil" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>
                            Perfil ({currentUser.username || currentUser.email})
                        </Link>
                        <button onClick={logout} style={{ padding: '8px 12px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/login" style={{ color: 'white', textDecoration: 'none', padding: '8px 12px', background: '#007bff', borderRadius: '4px' }}>
                        Login
                    </Link>
                )}
            </div>

            {/* <<--- RENDERIZAÇÃO CONDICIONAL DO DROPDOWN ---<<< */}
            {showNotifications && <NotificationsDropdown closeDropdown={() => setShowNotifications(false)} />}
        </nav>
    );
};

export default Navbar;