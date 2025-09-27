import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../lib/authConfig';

export default function LoginPage() {
  const { instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await instance.loginPopup(loginRequest);
      // Emitir evento auth:login
      window.dispatchEvent(new CustomEvent('auth:login', { detail: response }));

      // Setear bearer
      if (response.accessToken) {
        window.__ECONEURA_BEARER = response.accessToken;
        localStorage.setItem('econeura_bearer', response.accessToken);
      }
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar sesión en ECONEURA-IA
          </h2>
        </div>
        <div>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Cargando...' : 'INICIAR SESIÓN'}
          </button>
        </div>
      </div>
    </div>
  );
}