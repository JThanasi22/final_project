import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../../dash.css';

const Sidebar = ({ sidebarOpen, toggleSidebar, isActiveRoute }) => {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role); // Assuming 'role' is part of the token payload
            } catch (error) {
                console.error('Invalid token:', error);
            }
        }
    }, []);

    return (
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-logo">
                <h2><span className="studio-text">Studio</span> <span className="studio-number">21</span></h2>
            </div>
            <div className="sidebar-menu">
                <div
                    className={`nav-item ${isActiveRoute('/dashboard') ? 'active' : ''}`}
                    onClick={() => navigate('/dashboard')}
                >
                    <span className="nav-label">Dashboard</span>
                </div>
                <div
                    className={`nav-item ${isActiveRoute('/projects') ? 'active' : ''}`}
                    onClick={() => navigate('/projects')}
                >
                    <span className="nav-label">Projects</span>
                </div>
                <div className="nav-item">
                    <span className="nav-label">Billing</span>
                </div>
                <div
                    className={`nav-item ${isActiveRoute('/portfolio') ? 'active' : ''}`}
                    onClick={() => navigate('/portfolio')}
                >
                    <span className="nav-label">Portfolio</span>
                </div>
                {userRole !== 'c' && (
                    <div
                        className={`nav-item ${isActiveRoute('/tasks') ? 'active' : ''}`}
                        onClick={() => navigate('/tasks')}
                    >
                        <span className="nav-label">Tasks</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
