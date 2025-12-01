import React, { useState } from 'react';
import LoginForm from './LoginForm';
import AdminLoginForm from './AdminLoginForm';

const AuthModal = ({ isOpen, onClose }) => {
  const [currentForm, setCurrentForm] = useState('login'); // 'login', 'admin'

  if (!isOpen) return null;

  const renderForm = () => {
    switch (currentForm) {
      case 'login':
        return (
          <LoginForm
            onClose={onClose}
            onSwitchToRegister={() => setCurrentForm('register')}
            onSwitchToAdmin={() => setCurrentForm('admin')}
          />
        );
      case 'admin':
        return (
          <AdminLoginForm
            onClose={onClose}
            onSwitchToStudent={() => setCurrentForm('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {renderForm()}
    </div>
  );
};

export default AuthModal;
