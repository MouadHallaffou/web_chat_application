import React from 'react';
import { FaGoogle, FaGithub, FaLinkedin } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const providerUrls: Record<string, string> = {
  google: `${API_BASE_URL}/auth/google`,
  github: `${API_BASE_URL}/auth/github`,
  linkedin: `${API_BASE_URL}/auth/linkedin`
};

const SocialLogin: React.FC = () => {
  const handleSocialLogin = (provider: string) => {
    window.location.href = providerUrls[provider];
  };

  const socialButtons = [
    {
      provider: 'google',
      icon: <FaGoogle className="w-5 h-5" />,
      color: 'bg-white hover:bg-gray-100 text-gray-800',
      border: 'border border-gray-300'
    },
    {
      provider: 'github',
      icon: <FaGithub className="w-5 h-5" />,
      color: 'bg-gray-800 hover:bg-gray-900 text-white'
    },
    {
      provider: 'linkedin',
      icon: <FaLinkedin className="w-5 h-5" />,
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="py-1 px-2 bg-white text-gray-500 rounded-md">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {socialButtons.map(({ provider, icon, color, border }) => (
          <motion.button
            key={provider}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSocialLogin(provider)}
            className={`flex items-center justify-center px-4 py-2 rounded-md ${color} ${border} transition-colors duration-200`}
          >
            {icon}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SocialLogin; 