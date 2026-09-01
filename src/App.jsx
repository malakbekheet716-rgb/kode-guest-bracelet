import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ui/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import ToastStack from './components/ui/ToastStack';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CreateJobPage from './pages/CreateJobPage';
import JobDetailPage from './pages/JobDetailPage';
import BraceletsPage from './pages/BraceletsPage';
import BraceletDetailPage from './pages/BraceletDetailPage';
import ReconciliationPage from './pages/ReconciliationPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/create" element={<CreateJobPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/bracelets" element={<BraceletsPage />} />
          <Route path="/bracelets/:id" element={<BraceletDetailPage />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastStack />
    </>
  );
}