import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../../dash.css';

const Sidebar = ({ isOpen, isActiveRoute }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);
            } catch (error) {
                console.error('Invalid token:', error);
            }
        }
    }, []);

    const handleDashboardNavigation = () => {
        switch (userRole) {
            case 'a':
                navigate('/AdminDashboard');
                break;
            case 'c':
                navigate('/dashboard');
                break;
            case 'm':
                navigate('/manager_dashboard');
                break;
            case 'p':
                navigate('/photograph_Dashboard');
                break;
            case 'e':
                navigate('/editor_dashboard');
                break;
            case 's':
                navigate('/support_dashboard');
                break;
            default:
                navigate('/dashboard'); // fallback
                break;
        }
    };

    const checkActive = (path) => {
        return location.pathname === path || (isActiveRoute && isActiveRoute(path));
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-logo">
                <h2><span className="studio-text">Studio</span> <span className="studio-number">21</span></h2>
            </div>
            <div className="sidebar-menu">
                <div
                    className={`nav-item ${checkActive('/dashboard') ? 'active' : ''}`}
                    onClick={handleDashboardNavigation}
                >
                    <span className="nav-label">Dashboard</span>
                </div>
                <div
                    className={`nav-item ${checkActive('/projects') || checkActive('/staff_project') ? 'active' : ''}`}
                    onClick={() => {
                        if (['m', 'p', 'e'].includes(userRole)) {
                            navigate('/staff_project');
                        } else {
                            navigate('/projects');
                        }
                    }}
                >
                    <span className="nav-label">Projects</span>
                </div>
                <div
                    className={`nav-item ${checkActive('/invoices') ? 'active' : ''}`}
                    onClick={() => navigate('/invoices')}
                >
                    <span className="nav-label">Invoices</span>
                </div>
                <div
                    className={`nav-item ${checkActive('/portfolio') ? 'active' : ''}`}
                    onClick={() => navigate('/portfolio')}
                >
                    <span className="nav-label">Portfolio</span>
                </div>
                {userRole !== 'c' && (
                    <div
                        className={`nav-item ${checkActive('/tasks') ? 'active' : ''}`}
                        onClick={() => navigate('/tasks')}
                    >
                        <span className="nav-label">Tasks</span>
                    </div>
                )}
                <div
                    className={`nav-item ${checkActive('/messages') ? 'active' : ''}`}
                    onClick={() => navigate('/messages')}
                >
                    <span className="nav-label">Messages</span>
                </div>
                <div
                    className={`nav-item ${checkActive('/feedback') ? 'active' : ''}`}
                    onClick={() => navigate('/feedback')}
                >
                    <span className="nav-label">Feedback</span>
                </div>
                <div
                    className={`nav-item ${checkActive('/notifications') ? 'active' : ''}`}
                    onClick={() => navigate('/notifications')}
                >
                    <span className="nav-label">Notifications</span>
                </div>
                <div
                    className={`nav-item ${checkActive('/settings') ? 'active' : ''}`}
                    onClick={() => navigate('/settings')}
                >
                    <span className="nav-label">Settings</span>
                </div>
                {userRole === 'a' && (
                    <div
                        className={`nav-item ${checkActive('/admin') ? 'active' : ''}`}
                        onClick={() => navigate('/admin')}
                    >
                        <span className="nav-label">Admin</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
