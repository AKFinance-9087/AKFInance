import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    dashboard: 'Dashboard',
    customers: 'Customers',
    loans: 'Loans',
    collections: 'Collections',
    reports: 'Reports',
    calendar: 'Calendar',
    settings: 'Settings',
    logout: 'Logout',
    // Settings Page
    settings_title: 'Settings',
    settings_desc: 'Manage your account settings and preferences.',
    profile: 'Profile',
    preferences: 'Preferences',
    security: 'Security',
    language: 'Language',
    select_language: 'Select Language',
    dark_mode: 'Dark Mode',
    save_changes: 'Save Changes',
    business_name: 'Business Name',
    admin_name: 'Admin Name',
    email_address: 'Email Address',
    phone_number: 'Phone Number',
    address: 'Business Address',
    default_interest: 'Default Interest Rate (%)',
    current_password: 'Current Password',
    new_password: 'New Password',
    confirm_password: 'Confirm New Password',
    update_password: 'Update Password',
    settings_saved: 'Settings saved successfully!',
    password_updated: 'Password updated successfully!'
  },
  ta: {
    dashboard: 'டேஷ்போர்டு',
    customers: 'வாடிக்கையாளர்கள்',
    loans: 'கடன்கள்',
    collections: 'வசூல்',
    reports: 'அறிக்கைகள்',
    calendar: 'நாள்காட்டி',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு',
    // Settings Page
    settings_title: 'அமைப்புகள்',
    settings_desc: 'உங்கள் கணக்கு அமைப்புகள் மற்றும் விருப்பங்களை நிர்வகிக்கவும்.',
    profile: 'சுயவிவரம்',
    preferences: 'விருப்பங்கள்',
    security: 'பாதுகாப்பு',
    language: 'மொழி',
    select_language: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    dark_mode: 'இருண்ட பயன்முறை',
    save_changes: 'மாற்றங்களை சேமி',
    business_name: 'வணிகப் பெயர்',
    admin_name: 'நிர்வாகி பெயர்',
    email_address: 'மின்னஞ்சல் முகவரி',
    phone_number: 'தொலைபேசி எண்',
    address: 'வணிக முகவரி',
    default_interest: 'இயல்புநிலை வட்டி விகிதம் (%)',
    current_password: 'தற்போதைய கடவுச்சொல்',
    new_password: 'புதிய கடவுச்சொல்',
    confirm_password: 'புதிய கடவுச்சொல்லை உறுதிசெய்க',
    update_password: 'கடவுச்சொல்லைப் புதுப்பிக்கவும்',
    settings_saved: 'அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!',
    password_updated: 'கடவுச்சொல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
