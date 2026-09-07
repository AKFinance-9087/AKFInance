import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import {
  User,
  Settings as SettingsIcon,
  ShieldCheck,
  Globe,
  Building,
  Mail,
  Phone,
  MapPin,
  Percent,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile fields state
  const [profileData, setProfileData] = useState({
    businessName: 'AK Finance',
    adminName: 'Admin User',
    email: 'admin@akfinance.com',
    phone: '+91 9876543210',
    address: 'Madurai, Tamil Nadu',
    defaultInterestRate: 10
  });

  // Password fields state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Feedback notifications
  const [profileNotification, setProfileNotification] = useState(null);
  const [passwordNotification, setPasswordNotification] = useState(null);
  const [prefNotification, setPrefNotification] = useState(null);

  const tabs = [
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'preferences', label: t('preferences'), icon: SettingsIcon },
    { id: 'security', label: t('security'), icon: ShieldCheck },
  ];

  // Fetch settings from database on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          setProfileData({
            businessName: data.businessName || 'AK Finance',
            adminName: data.adminName || 'Admin User',
            email: data.email || 'admin@akfinance.com',
            phone: data.phone || '+91 9876543210',
            address: data.address || 'Madurai, Tamil Nadu',
            defaultInterestRate: data.defaultInterestRate !== undefined ? data.defaultInterestRate : 10
          });
          if (data.language && ['en', 'ta', 'tanglish'].includes(data.language)) {
            setLanguage(data.language);
          }
        }
      } catch (err) {
        console.error('Failed to load settings from DB:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [setLanguage]);

  // Handle Profile save to DB
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setProfileNotification(null);

    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileData,
          defaultInterestRate: Number(profileData.defaultInterestRate) || 10
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setProfileNotification({
        type: 'success',
        message: t('settings_saved') || 'Settings saved successfully!'
      });
      setTimeout(() => setProfileNotification(null), 4000);
    } catch (err) {
      setProfileNotification({
        type: 'error',
        message: err.message || 'Error saving settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Language preference change and persist to DB
  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    setPrefNotification(null);
    try {
      await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang })
      });
      setPrefNotification({
        type: 'success',
        message: t('language_saved') || 'Language preference saved to database!'
      });
      setTimeout(() => setPrefNotification(null), 3000);
    } catch (err) {
      console.error('Failed to persist language to DB:', err);
    }
  };

  // Handle Password change to DB
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordNotification(null);

    if (!passwordData.currentPassword) {
      setPasswordNotification({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordNotification({ type: 'error', message: 'Please enter a new password.' });
      return;
    }
    if (passwordData.newPassword.length < 4) {
      setPasswordNotification({ type: 'error', message: 'New password must be at least 4 characters.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordNotification({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch(`${API_URL}/settings/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update password');
      }

      setPasswordNotification({
        type: 'success',
        message: t('password_updated') || 'Password updated successfully!'
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordNotification(null), 4000);
    } catch (err) {
      setPasswordNotification({
        type: 'error',
        message: err.message || 'Error updating password. Please check your current password.'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings_title')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('settings_desc')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">

        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setProfileNotification(null);
                setPasswordNotification(null);
                setPrefNotification(null);
              }}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
            >
              <tab.icon size={20} className="mr-3" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card p-6 md:p-8 min-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 size={36} className="animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-medium">Loading settings from database...</p>
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        {t('profile')}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Connected to PostgreSQL database</p>
                    </div>
                  </div>

                  {profileNotification && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${profileNotification.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                      {profileNotification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span>{profileNotification.message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('business_name') || 'Business Name'}
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={profileData.businessName}
                          onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('admin_name') || 'Admin Name'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={profileData.adminName}
                          onChange={(e) => setProfileData({ ...profileData, adminName: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('email_address') || 'Email Address'}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('phone_number') || 'Phone Number'}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('address') || 'Business Address'}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('default_interest') || 'Default Interest Rate (%)'}
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="number"
                          step="0.1"
                          value={profileData.defaultInterestRate}
                          onChange={(e) => setProfileData({ ...profileData, defaultInterestRate: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary py-2.5 px-6 rounded-lg flex items-center gap-2"
                    >
                      {isSaving && <Loader2 size={18} className="animate-spin" />}
                      {t('save_changes')}
                    </button>
                  </div>
                </form>
              )}

              {/* Preferences Tab (Light/Dark Toggle Removed as requested) */}
              {activeTab === 'preferences' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      {t('preferences')}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Application display and language settings</p>
                  </div>

                  {prefNotification && (
                    <div className="p-4 rounded-xl flex items-center gap-3 text-sm font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 size={18} />
                      <span>{prefNotification.message}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-600/40 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Globe size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('language')}</h3>
                          <p className="text-sm text-slate-500">{t('select_language')}</p>
                        </div>
                      </div>
                      <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="tanglish">Tanglish </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <form onSubmit={handleUpdatePassword} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      {t('security')}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Change administrative account password in database</p>
                  </div>

                  {passwordNotification && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${passwordNotification.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                      {passwordNotification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span>{passwordNotification.message}</span>
                    </div>
                  )}

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('current_password') || 'Current Password'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('new_password') || 'New Password'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('confirm_password') || 'Confirm New Password'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="btn-primary py-2.5 px-6 rounded-lg flex items-center gap-2"
                      >
                        {isUpdatingPassword && <Loader2 size={18} className="animate-spin" />}
                        {t('update_password') || 'Update Password'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
