import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/profile`);
          setUser(response.data.user);
          setUserType(response.data.userType);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, API_BASE_URL]);

  const login = async (email, password, userType) => {
    try {
      const endpoint = userType === 'admin' ? 'admin/login' : 'student/login';
      const response = await axios.post(`${API_BASE_URL}/auth/${endpoint}`, {
        email,
        password,
      });

      const { token: newToken, student, admin } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(student || admin);
      setUserType(userType);

      return { success: true, user: student || admin };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (name, email, mobile, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/student/register`, {
        name,
        email,
        mobile,
        password,
      });

      const { token: newToken, student } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(student);
      setUserType('student');

      return { success: true, user: student };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUserType(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    userType,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isStudent: userType === 'student',
    isAdmin: userType === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
