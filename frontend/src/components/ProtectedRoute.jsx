import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

export default function ProtectedRoute({ children, restrictClient = false }) {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        // 🔒 Block access if restrictClient is true and role is 'c'
        if (restrictClient && decoded.role === 'c') {
            return <Navigate to="/unauthorized" replace />;
        }

    } catch (error) {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    return children;
}
