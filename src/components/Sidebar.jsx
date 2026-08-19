import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  Users, 
  Banknote, 
  BarChart3, 
  ReceiptText, 
  Briefcase, 
  Bell, 
  FileText, 
  LineChart, 
  Settings, 
  History, 
  DatabaseBackup, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import logoImg from '../assets/logo.png';

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const cn = (...inputs) => twMerge(clsx(inputs));
  const { t } = useLanguage();

  const navItems = [
    { name: t('dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('customers'), path: '/customers', icon: Users },
    { name: t('collections'), path: '/collections', icon: Banknote },
    { name: t('reports'), path: '/reports', icon: BarChart3 },
  ];

  const secondaryNavItems = [
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-blue-900 text-white border-r border-blue-800 rounded-none shadow-xl md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-full px-3 py-4 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="AK Finance Logo" className="h-10 w-auto object-contain" />
              </div>
            )}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-blue-800 text-blue-200 hover:text-white transition-colors mx-auto"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          
          <ul className="space-y-2 font-medium">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) => cn(
                    "flex items-center p-2 rounded-xl group transition-all duration-200",
                    isActive 
                      ? "bg-blue-800 text-white shadow-sm" 
                      : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
                  )}
                >
                  <item.icon size={22} className={cn(collapsed ? "mx-auto" : "ml-1 mr-3")} />
                  {!collapsed && <span className="flex-1 whitespace-nowrap">{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <div className="border-t border-blue-800 my-4"></div>
          <ul className="space-y-2 font-medium">
            {secondaryNavItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) => cn(
                    "flex items-center p-2 rounded-xl group transition-all duration-200",
                    isActive 
                      ? "bg-blue-800 text-white shadow-sm" 
                      : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
                  )}
                >
                  <item.icon size={22} className={cn(collapsed ? "mx-auto" : "ml-1 mr-3")} />
                  {!collapsed && <span className="flex-1 whitespace-nowrap">{item.name}</span>}
                </NavLink>
              </li>
            ))}
            <li>
              <button 
                onClick={() => {
                  localStorage.removeItem('isAuthenticated');
                  localStorage.removeItem('username');
                  window.dispatchEvent(new Event('authChange'));
                }}
                className="w-full flex items-center p-2 rounded-xl text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-all duration-200 mt-2"
              >
                 <LogOut size={22} className={cn(collapsed ? "mx-auto" : "ml-1 mr-3")} />
                 {!collapsed && <span className="flex-1 text-left whitespace-nowrap">{t('logout')}</span>}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
