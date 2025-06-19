// client/src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
// ... import do seu menu lateral (sidenav) se for separado
import './Navbar.css';

const Navbar = ({ onBurgerClick }) => {

    return (
        <header className="navbar">
            <Link to="/" className="nav-logo">SAGA</Link>
            <div className="nav-burger-menu" onClick={onBurgerClick}>
                <i className="fas fa-bars"></i>
            </div>
        </header>
    );
};

export default Navbar;