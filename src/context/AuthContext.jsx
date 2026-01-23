import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { i18n } = useTranslation();

    const fetchUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await authService.getUserInformation();
                if (response.status && response.data) {
                    const userData = response.data;
                    setUser(userData);

                    // Sync language preference if gambler data exists
                    if (userData.gambler?.languageId) {
                        const langId = userData.gambler.languageId;
                        if (langId === '11e8ba3a-b290-4a2c-9dad-0f40e457f72c') {
                            i18n.changeLanguage('en');
                        } else if (langId === '6892a523-0dc1-4e3b-9ddd-c9a558c7920b') {
                            i18n.changeLanguage('es');
                        }
                    }
                } else {
                    // If token is invalid or user not found, logout
                    authService.logout();
                    setUser(null);
                }
            } catch (error) {
                console.error("Error fetching user information:", error);
                authService.logout();
                setUser(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
