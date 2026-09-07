import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const translations = {
  en: {
    // Navigation / Sidebar
    dashboard: 'Dashboard',
    customers: 'Customers',
    loans: 'Loans',
    collections: 'Collections',
    reports: 'Reports',
    calendar: 'Calendar',
    settings: 'Settings',
    logout: 'Logout',
    expenses: 'Expenses',
    employees: 'Employees',
    
    // Navbar
    search_placeholder: 'Search customers, loans, phone...',
    notifications: 'Notifications',
    pending_count: 'Pending',
    no_pending_notifications: 'No pending payments right now!',
    super_admin: 'Super Admin',
    loan_bal: 'Loan Bal',

    // Common Actions & Badges
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Submit',
    loading: 'Loading...',
    all: 'All',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    active: 'Active',
    overdue: 'Overdue',
    completed: 'Completed',
    status: 'Status',
    date: 'Date',
    amount: 'Amount',
    mode: 'Mode',
    phone: 'Phone',
    address: 'Address',
    notes: 'Notes',
    remind: 'Remind',

    // Dashboard
    financial_overview: 'Financial Overview',
    financial_overview_desc: 'Monitor your daily lending, interest, and collections in real-time.',
    total_principal_disbursed: 'Total Disbursed',
    total_principal_disbursed_sub: 'Total principal given as loans',
    total_collected: 'Total Collected',
    total_collected_sub: 'Principal & interest received',
    total_interest_earned: 'Total Interest Earned',
    total_interest_earned_sub: 'Net interest revenue',
    active_loans_count: 'Active Loans',
    active_loans_count_sub: 'Loans currently running',
    quick_actions: 'Quick Actions',
    add_customer: 'Add Customer',
    create_loan: 'Create Loan',
    record_payment: 'Record Payment',
    generate_report: 'Generate Report',
    critical_overdue_loans: 'Critical Overdue Loans',
    no_overdue_loans: 'No critical overdue loans. All collections on track!',
    view_in_collections: 'View in Collections',
    loan_distribution: 'Loan Portfolio Distribution',
    recent_collections: 'Recent Collections',
    view_all: 'View All',
    no_recent_collections: 'No collections recorded yet.',

    // Customers Page
    customer_directory: 'Customer Directory',
    customer_directory_desc: 'Manage borrowers, loan terms, and customer profiles.',
    search_customers: 'Search by name, phone, loan ID, or location...',
    filter_status: 'All Statuses',
    filter_frequency: 'All Frequencies',
    customer_col: 'Customer',
    active_loans_col: 'Active Loans',
    principal_col: 'Principal',
    remaining_balance_col: 'Remaining Balance',
    next_due_col: 'Next Due',
    no_customers_found: 'No customers match the selected filters.',
    
    // Add / Edit Customer Modal
    add_new_customer: 'Add New Customer & Loan',
    edit_customer: 'Edit Customer Details',
    customer_name: 'Customer Full Name',
    phone_number: 'Phone Number',
    business_location: 'Location / Address',
    loan_amount: 'Loan Amount (₹)',
    interest_rate: 'Interest Rate (%)',
    interest_rate_placeholder: '10 (Default)',
    interest_period: 'Interest Period',
    start_date: 'Loan Start Date',
    create_customer_button: 'Create Customer & Disburse',
    save_changes: 'Save Changes',
    calculated_preview: 'Calculated Interest',

    // Customer Profile
    customer_profile: 'Customer Profile',
    back_to_customers: 'Back to Customers',
    phone_label: 'Phone',
    location_label: 'Location',
    customer_since: 'Customer Since',
    loan_details: 'Loan Details',
    total_loan_amount: 'Total Loan Amount',
    remaining_principal: 'Remaining Principal',
    total_paid: 'Total Paid',
    payment_history: 'Payment History',
    no_payments_yet: 'No payments recorded yet for this customer.',
    add_payment_modal_title: 'Record Payment',

    // Collections Page
    daily_collections: 'Daily Collections',
    daily_collections_desc: 'Record and track daily, weekly, and monthly loan repayments.',
    search_collections: 'Search borrower, phone, or loan ID...',
    due_today: 'Total Due Today',
    collected_today: 'Collected Today',
    pending_today: 'Pending Today',
    collect: 'Collect',
    payment_type: 'Payment Type',
    interest_only: 'Interest Only',
    principal_only: 'Principal Only',
    interest_due: 'Interest Due',
    principal_due: 'Principal Due',
    amount_received: 'Amount Received (₹)',
    payment_mode: 'Payment Mode',
    cash: 'Cash',
    upi: 'UPI / GPay',
    bank_transfer: 'Bank Transfer',
    full_principal: 'Full Principal',
    submit_payment: 'Submit Payment',

    // Reports Page
    financial_reports: 'Financial Reports',
    financial_reports_desc: 'Analytics, revenue streams, and performance metrics.',
    net_profit: 'Net Profit / Interest',
    default_rate: 'Default Rate',
    monthly_trends: 'Monthly Collections Trend',
    collection_efficiency: 'Collection Efficiency',
    export_csv: 'Export Data',

    // Settings Page
    settings_title: 'Settings',
    settings_desc: 'Manage your account settings, language preferences, and security.',
    profile: 'Profile',
    preferences: 'Preferences',
    security: 'Security',
    language: 'Language',
    select_language: 'Select Language',
    business_name: 'Business Name',
    admin_name: 'Admin Name',
    email_address: 'Email Address',
    business_address: 'Business Address',
    default_interest: 'Default Interest Rate (%)',
    current_password: 'Current Password',
    new_password: 'New Password',
    confirm_password: 'Confirm New Password',
    update_password: 'Update Password',
    settings_saved: 'Settings saved successfully!',
    password_updated: 'Password updated successfully!',
    language_saved: 'Language preference saved to database!'
  },

  ta: {
    // Navigation / Sidebar
    dashboard: 'டேஷ்போர்டு',
    customers: 'வாடிக்கையாளர்கள்',
    loans: 'கடன்கள்',
    collections: 'வசூல்',
    reports: 'அறிக்கைகள்',
    calendar: 'நாள்காட்டி',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு',
    expenses: 'செலவுகள்',
    employees: 'ஊழியர்கள்',

    // Navbar
    search_placeholder: 'வாடிக்கையாளர், கடன், எண் தேடுக...',
    notifications: 'அறிவிப்புகள்',
    pending_count: 'நிலுவை',
    no_pending_notifications: 'தற்போது நிலுவை கொடுப்பனவுகள் ஏதுமில்லை!',
    super_admin: 'முதன்மை நிர்வாகி',
    loan_bal: 'கடன் பாக்கி',

    // Common Actions & Badges
    actions: 'செயல்கள்',
    view: 'பார்',
    edit: 'திருத்து',
    delete: 'நீக்கு',
    cancel: 'ரத்து',
    save: 'சேமி',
    submit: 'சமர்ப்பி',
    loading: 'ஏற்றுகிறது...',
    all: 'அனைத்தும்',
    daily: 'தினசரி',
    weekly: 'வாராந்திர',
    monthly: 'மாதாந்திர',
    active: 'செயலில்',
    overdue: 'காலாவதி',
    completed: 'முடிந்தது',
    status: 'நிலை',
    date: 'தேதி',
    amount: 'தொகை',
    mode: 'முறை',
    phone: 'தொலைபேசி',
    address: 'முகவரி',
    notes: 'குறிப்புகள்',
    remind: 'நினைவூட்டு',

    // Dashboard
    financial_overview: 'நிதி கண்ணோட்டம்',
    financial_overview_desc: 'உங்கள் தினசரி கடன், வட்டி மற்றும் வசூலை நிகழ்நேரத்தில் கண்காணிக்கவும்.',
    total_principal_disbursed: 'வழங்கப்பட்ட மொத்த கடன்',
    total_principal_disbursed_sub: 'கடனாக வழங்கப்பட்ட மொத்த அசல்',
    total_collected: 'மொத்த வசூல்',
    total_collected_sub: 'பெறப்பட்ட அசல் மற்றும் வட்டி',
    total_interest_earned: 'மொத்த வட்டி வருவாய்',
    total_interest_earned_sub: 'நிகர வட்டி வருமானம்',
    active_loans_count: 'செயலில் உள்ள கடன்கள்',
    active_loans_count_sub: 'தற்போது இயங்கும் கடன்கள்',
    quick_actions: 'விரைவு நடவடிக்கைகள்',
    add_customer: 'வாடிக்கையாளர் சேர்க்க',
    create_loan: 'கடன் உருவாக்க',
    record_payment: 'கட்டணம் பதிவு செய்ய',
    generate_report: 'அறிக்கை உருவாக்க',
    critical_overdue_loans: 'முக்கிய நிலுவை கடன்கள்',
    no_overdue_loans: 'நிலுவையில் உள்ள கடன்கள் ஏதுமில்லை. அனைத்து வசூலும் சீராக உள்ளது!',
    view_in_collections: 'வசூலில் காண்க',
    loan_distribution: 'கடன் வகைப்பாடு',
    recent_collections: 'சமீபத்திய வசூல்',
    view_all: 'அனைத்தையும் காண்க',
    no_recent_collections: 'வசூல் ஏதும் இன்னும் பதிவு செய்யப்படவில்லை.',

    // Customers Page
    customer_directory: 'வாடிக்கையாளர் பட்டியல்',
    customer_directory_desc: 'கடன் வாங்கியவர்களை நிர்வகித்து அவர்களின் கடன் நிலையை பார்க்கவும்.',
    search_customers: 'பெயர், தொலைபேசி, கடன் எண் அல்லது இடம் மூலம் தேடுக...',
    filter_status: 'அனைத்து நிலைகளும்',
    filter_frequency: 'அனைத்து கால இடைவெளிகளும்',
    customer_col: 'வாடிக்கையாளர்',
    active_loans_col: 'செயலில் உள்ள கடன்கள்',
    principal_col: 'அசல்',
    remaining_balance_col: 'மீதமுள்ள பாக்கி',
    next_due_col: 'அடுத்த தவணை',
    no_customers_found: 'தேர்வுக்குரிய வாடிக்கையாளர்கள் இல்லை.',

    // Add / Edit Customer Modal
    add_new_customer: 'புதிய வாடிக்கையாளர் & கடன் சேர்க்க',
    edit_customer: 'வாடிக்கையாளர் விவரங்களைத் திருத்து',
    customer_name: 'வாடிக்கையாளர் முழுப் பெயர்',
    phone_number: 'தொலைபேசி எண்',
    business_location: 'இருப்பிடம் / முகவரி',
    loan_amount: 'கடன் தொகை (₹)',
    interest_rate: 'வட்டி விகிதம் (%)',
    interest_rate_placeholder: '10 (இயல்புநிலை)',
    interest_period: 'வட்டி காலம்',
    start_date: 'கடன் தொடக்க தேதி',
    create_customer_button: 'வாடிக்கையாளர் உருவாக்கி கடன் வழங்குக',
    save_changes: 'மாற்றங்களை சேமி',
    calculated_preview: 'கணக்கிடப்பட்ட வட்டி',

    // Customer Profile
    customer_profile: 'வாடிக்கையாளர் சுயவிவரம்',
    back_to_customers: 'வாடிக்கையாளர்களுக்குத் திரும்பு',
    phone_label: 'தொலைபேசி',
    location_label: 'இருப்பிடம்',
    customer_since: 'இணைந்த தேதி',
    loan_details: 'கடன் விவரங்கள்',
    total_loan_amount: 'மொத்த கடன் தொகை',
    remaining_principal: 'மீதமுள்ள அசல்',
    total_paid: 'மொத்தம் செலுத்தியது',
    payment_history: 'கட்டண வரலாறு',
    no_payments_yet: 'இந்த வாடிக்கையாளருக்கு கட்டணங்கள் எதுவும் இன்னும் பதிவு செய்யப்படவில்லை.',
    add_payment_modal_title: 'கட்டணம் பதிவு செய்ய',

    // Collections Page
    daily_collections: 'தினசரி வசூல்',
    daily_collections_desc: 'தினசரி, வாராந்திர மற்றும் மாதாந்திர கடன் திருப்பிச் செலுத்துதலை கண்காணிக்கவும்.',
    search_collections: 'வாடிக்கையாளர் பெயர், தொலைபேசி அல்லது கடன் எண் தேடுக...',
    due_today: 'இன்று பெற வேண்டியவை',
    collected_today: 'இன்று வசூலிக்கப்பட்டது',
    pending_today: 'இன்று நிலுவை',
    collect: 'வசூலிக்க',
    payment_type: 'கட்டண வகை',
    interest_only: 'வட்டி மட்டும்',
    principal_only: 'அசல் மட்டும்',
    interest_due: 'நிலுவை வட்டி',
    principal_due: 'நிலுவை அசல்',
    amount_received: 'பெறப்பட்ட தொகை (₹)',
    payment_mode: 'கட்டண முறை',
    cash: 'ரொக்கம்',
    upi: 'UPI / GPay',
    bank_transfer: 'வங்கி பரிமாற்றம்',
    full_principal: 'முழு அசல்',
    submit_payment: 'கட்டணத்தை சமர்ப்பி',

    // Reports Page
    financial_reports: 'நிதி அறிக்கைகள்',
    financial_reports_desc: 'பகுப்பாய்வு, வருவாய் ஆதாரங்கள் மற்றும் செயல்திறன் அளவீடுகள்.',
    net_profit: 'நிகர லாபம் / வட்டி',
    default_rate: 'நிலுவை விகிதம்',
    monthly_trends: 'மாதாந்திர வசூல் போக்கு',
    collection_efficiency: 'வசூல் செயல்திறன்',
    export_csv: 'தரவு ஏற்றுமதி',

    // Settings Page
    settings_title: 'அமைப்புகள்',
    settings_desc: 'உங்கள் கணக்கு அமைப்புகள், மொழி விருப்பங்கள் மற்றும் பாதுகாப்பை நிர்வகிக்கவும்.',
    profile: 'சுயவிவரம்',
    preferences: 'விருப்பங்கள்',
    security: 'பாதுகாப்பு',
    language: 'மொழி',
    select_language: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    business_name: 'வணிகப் பெயர்',
    admin_name: 'நிர்வாகி பெயர்',
    email_address: 'மின்னஞ்சல் முகவரி',
    business_address: 'வணிக முகவரி',
    default_interest: 'இயல்புநிலை வட்டி விகிதம் (%)',
    current_password: 'தற்போதைய கடவுச்சொல்',
    new_password: 'புதிய கடவுச்சொல்',
    confirm_password: 'புதிய கடவுச்சொல்லை உறுதிசெய்க',
    update_password: 'கடவுச்சொல்லைப் புதுப்பிக்கவும்',
    settings_saved: 'அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!',
    password_updated: 'கடவுச்சொல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!',
    language_saved: 'மொழி விருப்பம் தரவுத்தளத்தில் சேமிக்கப்பட்டது!'
  },

  tanglish: {
    // Navigation / Sidebar (Modern Tanglish)
    dashboard: 'Dashboard',
    customers: 'Customers',
    loans: 'Loans',
    collections: 'Collections',
    reports: 'Reports',
    calendar: 'Calendar',
    settings: 'Settings',
    logout: 'Logout',
    expenses: 'Expenses',
    employees: 'Staff',

    // Navbar
    search_placeholder: 'Customer, loan, phone search pannunga...',
    notifications: 'Notifications',
    pending_count: 'Pending',
    no_pending_notifications: 'Ippo pending collections edhum illa!',
    super_admin: 'Super Admin',
    loan_bal: 'Loan Balance',

    // Common Actions & Badges
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Submit',
    loading: 'Loading aaguthu...',
    all: 'All',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    active: 'Active',
    overdue: 'Overdue',
    completed: 'Completed',
    status: 'Status',
    date: 'Date',
    amount: 'Amount',
    mode: 'Mode',
    phone: 'Phone',
    address: 'Address',
    notes: 'Notes',
    remind: 'Remind',

    // Dashboard
    financial_overview: 'Financial Overview',
    financial_overview_desc: 'Ungal daily loans, interest and collections live-ah track pannunga.',
    total_principal_disbursed: 'Total Loan Disbursed',
    total_principal_disbursed_sub: 'Total loan principal amount',
    total_collected: 'Total Collections',
    total_collected_sub: 'Principal and interest received',
    total_interest_earned: 'Total Interest Earned',
    total_interest_earned_sub: 'Net revenue from interest',
    active_loans_count: 'Active Loans',
    active_loans_count_sub: 'Ippo running-la irukura accounts',
    quick_actions: 'Quick Actions',
    add_customer: 'Add Customer',
    create_loan: 'New Loan',
    record_payment: 'Payment Entry',
    generate_report: 'Generate Report',
    critical_overdue_loans: 'Critical Overdue Loans',
    no_overdue_loans: 'Overdue loans edhum illa. Ella collections-um on track!',
    view_in_collections: 'View in Collections',
    loan_distribution: 'Loan Distribution',
    recent_collections: 'Recent Collections',
    view_all: 'View All',
    no_recent_collections: 'Innum collections edhum record aagala.',

    // Customers Page
    customer_directory: 'Customers List',
    customer_directory_desc: 'Customer details and loan standing check pannunga.',
    search_customers: 'Name, phone, loan ID search pannunga...',
    filter_status: 'All Status',
    filter_frequency: 'All Schedules',
    customer_col: 'Customer',
    active_loans_col: 'Active Loans',
    principal_col: 'Principal',
    remaining_balance_col: 'Remaining Balance',
    next_due_col: 'Next Due',
    no_customers_found: 'Customers yaarume match aagala.',

    // Add / Edit Customer Modal
    add_new_customer: 'New Customer & Loan',
    edit_customer: 'Edit Customer Details',
    customer_name: 'Customer Full Name',
    phone_number: 'Phone Number',
    business_location: 'Location / Address',
    loan_amount: 'Loan Amount (₹)',
    interest_rate: 'Interest Rate (%)',
    interest_rate_placeholder: '10 (Default)',
    interest_period: 'Interest Period',
    start_date: 'Loan Start Date',
    create_customer_button: 'Customer Add & Loan Kudunga',
    save_changes: 'Save Changes',
    calculated_preview: 'Calculated Interest',

    // Customer Profile
    customer_profile: 'Customer Profile',
    back_to_customers: 'Back to Customers',
    phone_label: 'Phone',
    location_label: 'Location',
    customer_since: 'Customer Since',
    loan_details: 'Loan Details',
    total_loan_amount: 'Total Loan Amount',
    remaining_principal: 'Remaining Principal',
    total_paid: 'Total Paid',
    payment_history: 'Payment History',
    no_payments_yet: 'Innum payment edhum record aagala.',
    add_payment_modal_title: 'Payment Entry',

    // Collections Page
    daily_collections: 'Daily Collections',
    daily_collections_desc: 'Daily, weekly and monthly loan repayments manage pannunga.',
    search_collections: 'Customer name, phone search pannunga...',
    due_today: 'Today Due',
    collected_today: 'Today Collected',
    pending_today: 'Today Pending',
    collect: 'Collect',
    payment_type: 'Payment Type',
    interest_only: 'Interest Mattum',
    principal_only: 'Principal Mattum',
    interest_due: 'Interest Due',
    principal_due: 'Principal Due',
    amount_received: 'Amount Received (₹)',
    payment_mode: 'Payment Mode',
    cash: 'Cash',
    upi: 'UPI / GPay',
    bank_transfer: 'Bank Transfer',
    full_principal: 'Full Principal',
    submit_payment: 'Submit Payment',

    // Reports Page
    financial_reports: 'Financial Reports',
    financial_reports_desc: 'Analytics, revenue and performance metrics.',
    net_profit: 'Net Profit / Interest',
    default_rate: 'Default Rate (%)',
    monthly_trends: 'Monthly Collections Trend',
    collection_efficiency: 'Collection Efficiency',
    export_csv: 'Export Data',

    // Settings Page
    settings_title: 'Settings',
    settings_desc: 'Account settings, language preferences and security manage pannunga.',
    profile: 'Profile',
    preferences: 'Preferences',
    security: 'Security',
    language: 'Language',
    select_language: 'Language Select Pannunga',
    business_name: 'Business Name',
    admin_name: 'Admin Name',
    email_address: 'Email Address',
    business_address: 'Business Address',
    default_interest: 'Default Interest Rate (%)',
    current_password: 'Current Password',
    new_password: 'New Password',
    confirm_password: 'Confirm New Password',
    update_password: 'Update Password',
    settings_saved: 'Settings save aaiduchu!',
    password_updated: 'Password update aaiduchu!',
    language_saved: 'Language preference save aaiduchu!'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });

  // Sync initial language from database settings on mount
  useEffect(() => {
    const syncDbLanguage = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.language && ['en', 'ta', 'tanglish'].includes(data.language)) {
            const savedLocal = localStorage.getItem('appLanguage');
            if (!savedLocal || savedLocal !== data.language) {
              setLanguage(data.language);
              localStorage.setItem('appLanguage', data.language);
            }
          }
        }
      } catch (e) {
        console.warn('Could not sync language from DB:', e);
      }
    };
    syncDbLanguage();
  }, []);

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const t = (key) => {
    const langSet = translations[language] || translations.en;
    return langSet[key] || translations.en[key] || key;
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
