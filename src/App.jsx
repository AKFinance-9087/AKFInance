import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Customers } from './pages/Customers/Customers';
import { CustomerProfile } from './pages/Customers/CustomerProfile';
import { Collections } from './pages/Collections/Collections';
import { Reports } from './pages/Reports/Reports';
import { Settings } from './pages/Settings/Settings';

// Dummy components for other pages
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[70vh]">
    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">{title}</h1>
    <p className="text-slate-500 dark:text-slate-400">This module is under construction.</p>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="customers">
            <Route index element={<Customers />} />
            <Route path=":id" element={<CustomerProfile />} />
          </Route>
          <Route path="collections" element={<Collections />} />
          <Route path="reports" element={<Reports />} />
          <Route path="expenses" element={<Placeholder title="Expense Management" />} />
          <Route path="employees" element={<Placeholder title="Employee Management" />} />
          
          {/* Secondary Routes */}
          <Route path="notifications" element={<Placeholder title="Notifications" />} />
          <Route path="documents" element={<Placeholder title="Documents" />} />
          <Route path="analytics" element={<Placeholder title="Analytics" />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-log" element={<Placeholder title="Audit Log" />} />
          <Route path="backup" element={<Placeholder title="Backup & Restore" />} />
        </Route>

        {/* Catch-all fallback route for client-side routing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
