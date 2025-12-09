import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { PassengerFlow } from './components/passenger/PassengerFlow';
import OwnerDashboard from './components/owner/OwnerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

const LadakhConnectApp = () => {
  const { user } = useApp();

  if (!user) {
    return <LoginScreen />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return user.role === 'passenger' ? <PassengerFlow /> : <OwnerDashboard />;
};

export default function App() {
  return (
    <AppProvider>
      <LadakhConnectApp />
    </AppProvider>
  );
}