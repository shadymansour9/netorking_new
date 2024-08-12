import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MessagingPage from './pages/MessagingPage';
import Sidebar from './pages/Sidebar';
import { UserProvider, useUser } from '../src/pages/UserContext';

function App() {
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    // Check for authentication state (this example just uses a simple state)
    // In a real app, you would check for a token or session
  }, []);

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage setAuth={setAuth} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route element={<MainLayout />}>
            <Route path="/home" element={auth ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/friends" element={auth ? <FriendsPage /> : <Navigate to="/login" />} />
            <Route path="/profile/:userId" element={auth ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/settings" element={auth ? <SettingsPage /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={auth ? <NotificationsPage /> : <Navigate to="/login" />} />
            <Route path="/messages" element={auth ? <MessagingPage /> : <Navigate to="/login" />} />
            <Route path="/" element={auth ? <HomePage /> : <Navigate to="/login" />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}

const MainLayout = () => (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-grow p-6">
      <Outlet />
    </div>
  </div>
);

export default App;
