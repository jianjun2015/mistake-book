import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MistakeList from './pages/MistakeList';
import MistakeFormPage from './pages/MistakeForm';
import MistakeDetail from './pages/MistakeDetail';
import SearchPage from './pages/SearchPage';
import KnowledgeSummaryPage from './pages/knowledge-summary';
import PhoneticLearningPage from './pages/phonetic-learning';
import PhoneticPracticePage from './pages/phonetic-practice';
import MathSpecialPage from './pages/math-special';
import AITechPage from './pages/ai-tech';
import LearningMethodsPage from './pages/learning-methods';
import { Spin } from 'antd';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" tip="加载中..." /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" tip="加载中..." /></div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
    <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/mistakes" element={<ProtectedRoute><MistakeList /></ProtectedRoute>} />
    <Route path="/mistakes/add" element={<ProtectedRoute><MistakeFormPage /></ProtectedRoute>} />
    <Route path="/mistakes/edit/:id" element={<ProtectedRoute><MistakeFormPage /></ProtectedRoute>} />
    <Route path="/mistakes/:id" element={<ProtectedRoute><MistakeDetail /></ProtectedRoute>} />
    <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
    <Route path="/knowledge-summary" element={<ProtectedRoute><KnowledgeSummaryPage /></ProtectedRoute>} />
    <Route path="/phonetic-learning" element={<ProtectedRoute><PhoneticLearningPage /></ProtectedRoute>} />
    <Route path="/phonetic-practice" element={<ProtectedRoute><PhoneticPracticePage /></ProtectedRoute>} />
    <Route path="/math-special" element={<ProtectedRoute><MathSpecialPage /></ProtectedRoute>} />
    <Route path="/ai-tech" element={<ProtectedRoute><AITechPage /></ProtectedRoute>} />
    <Route path="/learning-methods" element={<ProtectedRoute><LearningMethodsPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
