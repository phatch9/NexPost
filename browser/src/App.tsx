import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';

// Minimal, stable app shell used for local dev and route sanity checks.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2 },
  },
});

const Feed: React.FC = () => <div className="p-6">Main Feed (placeholder)</div>;
const Profile: React.FC = () => <div className="p-6">Profile (placeholder)</div>;
const Login: React.FC = () => <div className="p-6">Login (placeholder)</div>;
const Signup: React.FC = () => <div className="p-6">Sign Up (placeholder)</div>;

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/all" replace />} />
            <Route path="/all" element={<Feed />} />
            <Route path="/u/:username" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;