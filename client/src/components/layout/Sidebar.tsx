import React from 'react';
import { Home, MessageCircle, Bell, Settings, PackageSearchIcon, Users, UserPlus, FileText, HelpCircle, LifeBuoy, PhoneCall, MessageSquare, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'home', path: '/home', icon: Home, label: 'Home' },
    { id: 'chat', path: '/chat', icon: MessageCircle, label: 'Messages' },
    { id: 'notifications', path: '/notifications', icon: Bell, label: 'Notifications' },
    { id: 'ai-assistant', path: '/ai-assistant', icon: PackageSearchIcon, label: 'AI Assistant' },
    { id: 'friends', path: '/friends', icon: Users, label: 'Friends' },
    { id: 'groups', path: '/groups', icon: UserPlus, label: 'Groups' },
    { id: 'pages', path: '/pages', icon: FileText, label: 'Pages' },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
    { id: 'help', path: '/help', icon: HelpCircle, label: 'Help' },
    { id: 'support', path: '/support', icon: LifeBuoy, label: 'Support' },
    { id: 'contact', path: '/contact', icon: PhoneCall, label: 'Contact' },
    { id: 'feedback', path: '/feedback', icon: MessageSquare, label: 'Feedback' },
    { id: 'language', path: '/language', icon: Globe, label: 'Language' }
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find(item => item.path === currentPath);
    return menuItem ? menuItem.id : 'home';
  };

  return (
    <div className="w-16 lg:w-64 bg-background border-r border-slate-700 flex flex-col min-h-0 transition-colors duration-200">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="hidden lg:block">
          <h1 className="text-xl font-bold text-foreground">ChatApp</h1>
          <p className="text-muted-foreground text-sm">Stay connected</p>
        </div>
        <div className="lg:hidden flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 custom-scrollbar overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.path)}
            className={cn(
              "w-full p-3 rounded-lg mb-2 flex items-center gap-3 transition-all duration-200",
              "hover:bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg hover:scale-105",
              getActiveTab() === item.id
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon size={20} />
            <span className="hidden lg:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="">
        <ThemeToggle />
      </div>

    </div>
  );
};

export default Sidebar;
