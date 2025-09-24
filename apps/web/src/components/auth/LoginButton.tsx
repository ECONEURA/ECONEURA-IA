'use client';

import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { User, LogOut, LogIn } from 'lucide-react';
import { useEffect } from 'react';

export function LoginButton() {
  const { isAuthenticated, login, logout, getAccount, inProgress } = useAuth();
  const account = getAccount();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (inProgress === 'login') {
    return (
      <Button disabled className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Iniciando sesión...
      </Button>
    );
  }

  if (isAuthenticated && account) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User className="w-4 h-4" />
          <span>{account.name || account.username}</span>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      className="flex items-center gap-2"
    >
      <LogIn className="w-4 h-4" />
      Iniciar sesión
    </Button>
  );
}