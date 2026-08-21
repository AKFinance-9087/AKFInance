import { Search, Bell, Moon, Sun, User, Menu, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function Navbar({ collapsed, setMobileOpen, mobileOpen }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/notifications/pending`);
        if (response.ok) {
          const data = await response.json();
          setPendingCustomers(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to fetch pending notifications:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="sticky top-0 z-30 glass-card border-b rounded-none px-4 lg:px-6 py-3 flex items-center justify-between w-full">

      {/* Left section: Hamburger (mobile) + Search */}
      <div className="flex items-center flex-1 max-w-xl gap-2 md:gap-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 md:hidden"
        >
          <Menu size={24} />
        </button>

        <div className="relative group flex-1 hidden md:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="block w-full p-2 pl-10 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-full focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700/50 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white transition-all shadow-inner"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 relative"
          >
            <Bell size={20} />
            {pendingCustomers.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
                <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                  {pendingCustomers.length} Pending
                </span>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {pendingCustomers.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No pending payments right now!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {pendingCustomers.map(customer => (
                      <button 
                        key={customer.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(`/customers/${customer.id}`);
                        }}
                        className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-3"
                      >
                        <div className="mt-0.5 bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-full text-orange-600 dark:text-orange-400">
                          <AlertCircle size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{customer.name}</p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">{customer.pendingDetails}</p>
                          <p className="text-xs text-slate-500 mt-1">Loan Bal: ₹{customer.remainingBalance?.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 ml-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-600/50 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden shadow-sm">
            <User size={18} />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">Admin User</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
