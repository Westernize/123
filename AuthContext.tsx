import React, { createContext, useContext, useState, useEffect } from 'react';
import { Octokit } from '@octokit/rest';
import { GitHubUser } from '../types/github';
import { createOctokit } from '../utils/github';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: GitHubUser | null;
  octokit: Octokit | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('github_token');
  });
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [octokit, setOctokit] = useState<Octokit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('github_token');
      if (savedToken) {
        try {
          const client = createOctokit(savedToken);
          const { data } = await client.users.getAuthenticated();
          setUser({
            login: data.login,
            name: data.name,
            avatar_url: data.avatar_url,
            html_url: data.html_url,
          });
          setOctokit(client);
        } catch (error) {
          console.error('인증 실패:', error);
          localStorage.removeItem('github_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (newToken: string) => {
    try {
      const client = createOctokit(newToken);
      const { data } = await client.users.getAuthenticated();
      
      setToken(newToken);
      setUser({
        login: data.login,
        name: data.name,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
      });
      setOctokit(client);
      localStorage.setItem('github_token', newToken);
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOctokit(null);
    localStorage.removeItem('github_token');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        token,
        user,
        octokit,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

