// client/src/components/HeaderTabs.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './HeaderTabs.css';

const HeaderTabs = () => {
    return (
        <div className="header-tabs-container">
            <NavLink to="/" className="header-tab" end>
                <span className="material-symbols-outlined">emoji_events</span>
                <span>Competições</span>
            </NavLink>
            <NavLink to="/desafios" className="header-tab">
                <span className="material-symbols-outlined">military_tech</span>
                <span>Desafios</span>
            </NavLink>
        </div>
    );
};

export default HeaderTabs;