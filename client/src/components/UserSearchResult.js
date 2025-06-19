// client/src/components/UserSearchResult.js
import React from 'react';
import { Link } from 'react-router-dom';
import './UserSearchResult.css';

const UserSearchResult = ({ user }) => {
    const defaultImage = `${process.env.PUBLIC_URL}/default-avatar.png`;

    // CORREÇÃO 1: O link deve usar user.username para corresponder à sua rota
    return (
        <Link to={`/perfil/${user.username}`} className="result-item-link">
            <img 
                src={user.profile_photo_url || defaultImage} 
                // CORREÇÃO 2: O alt text também deve usar username
                alt={`Foto de ${user.username}`} 
                className="result-item-avatar"
                onError={(e) => { e.target.onerror = null; e.target.src=defaultImage; }}
            />
            {/* CORREÇÃO 3: O nome exibido também é username */}
            <span className="result-item-name">{user.username}</span>
        </Link>
    );
};

export default UserSearchResult;