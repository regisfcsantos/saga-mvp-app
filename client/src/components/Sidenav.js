// client/src/components/Sidenav.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidenav.css';

const Sidenav = ({ isOpen, onClose }) => {

    const { currentUser, logout } = useAuth();

    const handleLogout = () => {
        onClose(); // Fecha o menu lateral primeiro para uma melhor experiência
        logout();  // Chama a função de logout do AuthContext
    };

    return (
        <div className={`sidenav ${isOpen ? 'open' : ''}`}>
            <div className="sidenav-content">
                <div className="sidenav-header">
                    <Link to="/" className="logo">SAGA</Link>
                    <span className="closebtn" onClick={onClose}>&times;</span>
                </div>

                <nav className="sidenav-links">
                    <Link to="/perfil" onClick={onClose}>Meu Perfil</Link>
                    <Link to="/contato" onClick={onClose}>Contato</Link>
                    <Link to="/termos-de-servico" onClick={onClose}>Termos de Serviço</Link>
                    <Link to="/politica-de-privacidade" onClick={onClose}>Política de Privacidade</Link>
                    <Link to="/creditos" onClick={onClose}>Créditos</Link>
                </nav>
            </div>

            <div className="sidenav-footer">
                {/* Renderização condicional: só mostra se houver um usuário logado */}
                {currentUser ? (
                    <a href="#!" onClick={handleLogout} className="sidenav-action-link">
                        <span className="material-symbols-outlined">logout</span>
                        <span>Sair</span>
                    </a>
                ) : (
                    <Link to="/login" onClick={onClose} className="sidenav-action-link login">
                        <span className="material-symbols-outlined">login</span>
                        <span>Login / Cadastro</span>
                    </Link>
                )}
                <div className="sidenav-footer-links">
                    <Link to="/termos-de-servico" onClick={onClose}>Termos</Link>
                    <span>•</span>
                    <Link to="/politica-de-privacidade" onClick={onClose}>Privacidade</Link>
                    <span>•</span>
                    <Link to="/creditos" onClick={onClose}>Créditos</Link>
                </div>
            </div>
        </div>
    );
};

export default Sidenav;