import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Convert to seconds
        if (decoded.exp < currentTime) {
            // Token is expired
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }
    } catch (error) {
        // Invalid token
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    return children;
}