import { useState, useEffect } from 'react';

import { ApiClient } from '@/lib/api-client';

interface ProxyStatusProps {
  className?: string;
}

export function ProxyStatus({ className = '' }: ProxyStatusProps) {
  const [isProxyEnabled, setIsProxyEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkProxyStatus = async () => {
    setIsChecking(true);
    try {
      const enabled = await ApiClient.initProxyDetection();
      setIsProxyEnabled(enabled);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking proxy status:', error);
      setIsProxyEnabled(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkProxyStatus();
  }, []);

  const handleManualCheck = () => {
    checkProxyStatus();
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isProxyEnabled ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="font-medium">
          Proxy: {isChecking ? 'Checking...' : isProxyEnabled ? 'Active' : 'Inactive'}
        </span>
      </div>

      <button
        onClick={handleManualCheck}
        disabled={isChecking}
        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isChecking ? '...' : 'Check'}
      </button>

      {lastChecked && (
        <span className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}