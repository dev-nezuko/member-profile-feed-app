import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import Navbar from './components/Navbar';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import Profile from './features/profile/Profile';
import Feed from './features/feed/Feed';
import { useAppSelector } from './app/hooks';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const session = useAppSelector((state) => state.auth.session);
  return session ? children : <Navigate to="/login" replace />;
};

export function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
