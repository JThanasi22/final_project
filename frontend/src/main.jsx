import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import Login from './Login.jsx';
import Signup from './Signup.jsx';
import Dashboard from './dashboard.jsx';
import Admindashboard from "./Admindashboard.jsx";
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Unauthorized from './Unauthorized.jsx';
import UserSettings from "./UserSettings.jsx";
import ResetPassword from './resetPass.jsx';
import ForgetPass from "./ForgetPass.jsx";
import Setting from "./UserSettings.jsx"
import AppRoutes from "./routes/AppRoutes.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Router>
            <Routes>

                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Default route -> go to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />


                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forget-pass" element={<ForgetPass />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected route */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/UserSettings"
                    element={
                    <ProtectedRoute>
                        <Setting />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/Admindashboard"
                    element={
                    <ProtectedRoute>
                        <Admindashboard />
                    </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                    <ProtectedRoute>
                        <UserSettings />
                    </ProtectedRoute>
                    }
                />
                <Route path="/*"
                       element={
                    <ProtectedRoute>
                        <AppRoutes />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    </StrictMode>
);
