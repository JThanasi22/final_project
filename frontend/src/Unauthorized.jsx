import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Unauthorized.css'; // optional for extra styling

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="unauthorized-wrapper">
            <div className="unauthorized-card">
                <h1>🚫 Access Denied</h1>
                <p>You don’t have permission to view this page.</p>
                <button className="back-button" onClick={() => navigate('/login')}>
                    Return to Login
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
