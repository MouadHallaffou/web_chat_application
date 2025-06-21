import { useState, useEffect } from 'react';
import api from '../services/api';

const TestConnection = () => {
  const [status, setStatus] = useState<string>('Checking connection...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('Attempting to connect to:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
        const response = await api.get('/health');
        setStatus('Connected to server: ' + response.data.message);
      } catch (err: any) {
        const errorMessage = err.response 
          ? `Error ${err.response.status}: ${err.response.data?.message || err.message}`
          : err.message;
        setError(`Failed to connect to server: ${errorMessage}`);
        console.error('Connection error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: err.config
        });
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Server Connection Test</h2>
      <div className={`p-4 rounded ${error ? 'bg-red-100' : 'bg-green-100'}`}>
        <p className={error ? 'text-red-700' : 'text-green-700'}>
          {error || status}
        </p>
      </div>
    </div>
  );
};

export default TestConnection; 