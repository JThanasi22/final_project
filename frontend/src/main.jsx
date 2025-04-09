import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import Login from './Login.jsx';
import Signup from './Signup.jsx';
import ForgetPass from "./ForgetPass.jsx";
import ResetPassword from './resetPass.jsx';
import Unauthorized from './Unauthorized.jsx';
import AppRoutes from './routes/AppRoutes';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forget-pass" element={<ForgetPass />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected routes */}
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </Router>
  </StrictMode>
);
