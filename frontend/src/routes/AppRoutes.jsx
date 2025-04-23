import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../dashboard';
import ProjectList from '../components/projects/ProjectList';
import TaskList from '../components/tasks/TaskList';
import PortfolioGrid from '../components/portofolio/PortofolioGrid';
import InvoiceList from '../components/invoices/InvoiceList';
import MessageCenter from '../components/messages/MessageCenter';
import FeedbackList from '../components/feedback/FeedbackList';
import NotificationList from '../components/notifications/NotificationList';
import UserSettings from '../UserSettings';
import AdminPanel from '../components/admin/AdminPanel';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectList />} />
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/portfolio" element={<PortfolioGrid />} />
                <Route path="/invoices" element={<InvoiceList />} />
                <Route path="/messages" element={<MessageCenter />} />
                <Route path="/feedback" element={<FeedbackList />} />
                <Route path="/notifications" element={<NotificationList />} />
                <Route path="/settings" element={<UserSettings />} />
                <Route path="/admin" element={<AdminPanel />} />
        </Routes>
    );
};

export default AppRoutes;