import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Phone, 
  MapPin, 
  IndianRupee,
  Edit,
  Trash2,
  Eye,
  User,
  Map,
  Wallet,
  BadgePercent,
  CreditCard,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function Customers() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addModalError, setAddModalError] = useState('');
  const [editModalError, setEditModalError] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const cn = (...inputs) => twMerge(clsx(inputs));

  // Form State
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    location: '',
    aadharNumber: '',
    loanAmount: '',
    interestRate: '',
    interestType: 'Monthly',
    repaymentType: 'Monthly',
    loanGivenDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch(`${API_URL}/customers`);
        if (!response.ok) throw new Error('Unable to load customers');
        setCustomers(await response.json());
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAddModalError('');

    if (!newCustomer.name?.trim()) {
      setAddModalError('Full Name is required.');
      return;
    }
    if (!newCustomer.phone?.trim()) {
      setAddModalError('Contact Number is required.');
      return;
    }
    if (!newCustomer.location?.trim()) {
      setAddModalError('Place / Location is required.');
      return;
    }
    if (!newCustomer.loanAmount || Number(newCustomer.loanAmount) <= 0) {
      setAddModalError('Initial Loan Amount is required and must be greater than 0.');
      return;
    }
    if (!newCustomer.repaymentType) {
      setAddModalError('Repayment Schedule is required.');
      return;
    }
    if (!newCustomer.loanGivenDate) {
      setAddModalError('Loan Given Date is required.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      let submissionDate = now.toISOString();
      if (newCustomer.loanGivenDate) {
        const [y, m, d] = newCustomer.loanGivenDate.split('-').map(Number);
        if (y === now.getFullYear() && (m - 1) === now.getMonth() && d === now.getDate()) {
          submissionDate = now.toISOString();
        } else {
          submissionDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
        }
      }

      const effectiveInterestRate = (newCustomer.interestRate !== undefined && newCustomer.interestRate !== null && String(newCustomer.interestRate).trim() !== '')
        ? Number(newCustomer.interestRate)
        : 10;

      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newCustomer, 
          interestRate: effectiveInterestRate,
          loanGivenDate: submissionDate 
        }),
      });
      const customer = await response.json();
      if (!response.ok) throw new Error(customer.error || 'Unable to add customer');

      setCustomers((currentCustomers) => [customer, ...currentCustomers]);
      setIsAddModalOpen(false);
      setAddModalError('');
      setNewCustomer({ name: '', phone: '', location: '', aadharNumber: '', loanAmount: '', interestRate: '', interestType: 'Monthly', repaymentType: 'Monthly', loanGivenDate: new Date().toISOString().split('T')[0] });
    } catch (saveError) {
      setAddModalError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Delete this customer and their loan records?')) return;

    try {
      const response = await fetch(`${API_URL}/customers/${customerId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to delete customer');
      setCustomers((currentCustomers) => currentCustomers.filter((customer) => customer.id !== customerId));
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete the customer.');
    }
  };

  const handleEditClick = (customer) => {
    setEditModalError('');
    let formattedDate = '';
    if (customer.loanGivenDate) {
      try {
        const d = new Date(customer.loanGivenDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split('T')[0];
        }
      } catch (err) {
        formattedDate = '';
      }
    }
    setEditingCustomer({
      id: customer.id,
      name: customer.name || '',
      phone: customer.phone || '',
      location: customer.location || '',
      aadharNumber: customer.aadharNumber || '',
      loanAmount: customer.loanAmount !== undefined && customer.loanAmount !== null ? customer.loanAmount : '',
      interestRate: customer.interestRate !== undefined && customer.interestRate !== null ? customer.interestRate : '',
      interestType: customer.interestType || 'Monthly',
      repaymentType: customer.repaymentType || 'Monthly',
      loanGivenDate: formattedDate
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setEditModalError('');

    if (!editingCustomer.name?.trim()) {
      setEditModalError('Full Name is required.');
      return;
    }
    if (!editingCustomer.phone?.trim()) {
      setEditModalError('Contact Number is required.');
      return;
    }
    if (!editingCustomer.location?.trim()) {
      setEditModalError('Place / Location is required.');
      return;
    }
    if (!editingCustomer.loanAmount || Number(editingCustomer.loanAmount) <= 0) {
      setEditModalError('Initial Loan Amount is required and must be greater than 0.');
      return;
    }
    if (!editingCustomer.repaymentType) {
      setEditModalError('Repayment Schedule is required.');
      return;
    }
    if (!editingCustomer.loanGivenDate) {
      setEditModalError('Loan Given Date is required.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      let submissionDate = editingCustomer.loanGivenDate;
      if (editingCustomer.loanGivenDate && typeof editingCustomer.loanGivenDate === 'string') {
        const [y, m, d] = editingCustomer.loanGivenDate.split('T')[0].split('-').map(Number);
        if (y === now.getFullYear() && (m - 1) === now.getMonth() && d === now.getDate()) {
          submissionDate = now.toISOString();
        } else {
          submissionDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
        }
      }

      const response = await fetch(`${API_URL}/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCustomer.name,
          phone: editingCustomer.phone,
          location: editingCustomer.location,
          aadharNumber: editingCustomer.aadharNumber,
          loanAmount: editingCustomer.loanAmount,
          interestRate: editingCustomer.interestRate,
          interestType: editingCustomer.interestType,
          repaymentType: editingCustomer.repaymentType,
          loanGivenDate: submissionDate
        }),
      });
      const updatedCustomer = await response.json();
      if (!response.ok) throw new Error(updatedCustomer.error || 'Unable to update customer');

      setCustomers((currentCustomers) => 
        currentCustomers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
      );
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      setEditModalError('');
    } catch (saveError) {
      setEditModalError(saveError.message || 'Could not update the customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const getDynamicStatus = (customer) => {
    if (!customer.loanGivenDate) return customer.status;
    if (customer.status === 'Completed' || customer.status === 'Closed') return customer.status;

    const givenDate = new Date(customer.loanGivenDate);
    const now = new Date();
    
    const givenDateMidnight = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = nowMidnight.getTime() - givenDateMidnight.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    let periodsElapsed = 0;
    let periodLabel = '';
    
    if (customer.repaymentType === 'Daily') { periodsElapsed = diffDays; periodLabel = 'Day'; }
    else if (customer.repaymentType === 'Weekly') { periodsElapsed = Math.floor(diffDays / 7); periodLabel = 'Week'; }
    else if (customer.repaymentType === '10 Days') { periodsElapsed = Math.floor(diffDays / 10); periodLabel = '10-Day Period'; }
    else if (customer.repaymentType === 'Monthly') { 
        let months = (nowMidnight.getFullYear() - givenDateMidnight.getFullYear()) * 12;
        months -= givenDateMidnight.getMonth();
        months += nowMidnight.getMonth();
        if (nowMidnight.getDate() < givenDateMidnight.getDate()) {
            months--;
        }
        periodsElapsed = Math.max(0, months);
        periodLabel = 'Month'; 
    } else {
        return customer.status;
    }

    const actualPayments = customer.paymentsCount || 0;
    const hasInitial = actualPayments > 0;
    const expectedPayments = (hasInitial ? 1 : 0) + periodsElapsed;
    const pendingCount = expectedPayments - actualPayments;
    
    if (pendingCount > 0) return `${pendingCount} ${periodLabel}${pendingCount > 1 ? 's' : ''} Pending`;
    if (pendingCount < 0) return `${Math.abs(pendingCount)} ${periodLabel}${Math.abs(pendingCount) > 1 ? 's' : ''} Advance`;
    return 'Active';
  };

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    }
    if (s === 'active' || s.includes('advance')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    }
    if (s === 'closed') return 'bg-blue-100 text-blue-700 dark:bg-blue-600/30 dark:text-blue-400 border-blue-200 dark:border-blue-700';
    if (s === 'overdue') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
  };

  const getLoanDateLabel = (customer) => (
    customer.loanGivenDate
      ? `Given on ${new Date(customer.loanGivenDate).toLocaleDateString()}`
      : 'No active loan'
  );

  return (
    <>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('customer_directory')}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t('customer_directory_desc')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64 group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full p-2 pl-10 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800/50 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-all shadow-sm" 
                placeholder={t('search_customers')} 
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto mt-1 sm:mt-0">
              <button className="p-2 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center">
                <Filter size={20} />
              </button>
              <button 
                onClick={() => { setAddModalError(''); setIsAddModalOpen(true); }}
                disabled={isLoading}
                className="btn-primary flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap"
              >
                <Plus size={18} className="mr-2" />
                {t('add_customer')}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Customers Table / Grid */}
        <div className="glass-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">{t('customer_col')}</th>
                  <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">{t('business_location')}</th>
                  <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">{t('loan_amount')}</th>
                  <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">{t('remaining_balance_col')}</th>
                  <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">{t('status')}</th>
                  <th scope="col" className="px-6 py-4 font-medium text-right whitespace-nowrap">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">{t('loading')}</td>
                  </tr>
                ) : filteredCustomers.map((customer) => (
                  <motion.tr 
                    variants={itemVariants}
                    key={customer.id} 
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-600/40 dark:to-blue-700/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shadow-inner">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{customer.name}</div>
                          <div className="text-xs text-slate-500">{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.isNewlyAdded ? (
                        <span className="text-xs text-slate-400 italic">Details Hidden</span>
                      ) : (
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center text-slate-700 dark:text-slate-300">
                            <Phone size={14} className="mr-2 text-slate-400" />
                            {customer.phone}
                          </div>
                          <div className="flex items-center text-slate-500 text-xs">
                            <MapPin size={14} className="mr-2 text-slate-400" />
                            {customer.location}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.isNewlyAdded ? (
                        <span className="text-xs text-slate-400 italic">Amount Hidden</span>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center">
                            <IndianRupee size={16} className="mr-1 text-slate-500"/>
                            {customer.loanAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {customer.repaymentType} • {getLoanDateLabel(customer)}
                            <div className="text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                              {customer.interestRate > 0 ? `Interest: ${customer.interestRate}% (${customer.interestType})` : '0% Interest'}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.isNewlyAdded ? (
                        <span className="text-xs text-slate-400 italic">-</span>
                      ) : (
                        <div className="font-semibold text-orange-600 dark:text-orange-400 flex items-center bg-orange-50 dark:bg-orange-900/10 w-fit px-3 py-1 rounded-lg border border-orange-100 dark:border-orange-900/30">
                          <IndianRupee size={14} className="mr-1 opacity-70"/>
                          {customer.remainingBalance?.toLocaleString('en-IN') || 0}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap", getStatusColor(getDynamicStatus(customer)))}>
                        {getDynamicStatus(customer)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-600/30 rounded-lg transition-colors" 
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(customer)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <button className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                         <MoreVertical size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {!isLoading && filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No customers found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading customers…</div>
            ) : filteredCustomers.map((customer) => (
              <motion.div 
                variants={itemVariants}
                key={customer.id} 
                className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-600/40 dark:to-blue-700/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shadow-inner shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{customer.name}</div>
                      <div className="text-xs text-slate-500">{customer.id}</div>
                    </div>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap", getStatusColor(getDynamicStatus(customer)))}>
                    {getDynamicStatus(customer)}
                  </span>
                </div>
                
                {!customer.isNewlyAdded ? (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Contact</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{customer.phone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Location</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium flex-1 text-right ml-4 truncate">{customer.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Loan Amount</span>
                      <div className="text-right">
                        <span className="text-slate-900 dark:text-white font-medium flex items-center justify-end">
                          <IndianRupee size={14} className="mr-0.5 text-slate-500"/>
                          {customer.loanAmount.toLocaleString('en-IN')}
                        </span>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                          {customer.interestRate > 0 ? `${customer.interestRate}% (${customer.interestType})` : '0% Int'}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-slate-500">Remaining</span>
                      <span className="text-orange-600 dark:text-orange-400 font-medium flex items-center bg-orange-50 dark:bg-orange-900/10 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-900/30">
                        <IndianRupee size={12} className="mr-0.5 opacity-70"/>
                        {customer.remainingBalance?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic mb-4">Details Hidden</div>
                )}
                
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <button 
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="flex-1 flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-600/30 rounded-lg transition-colors border border-blue-100 dark:border-blue-600/30" 
                  >
                    <Eye size={16} className="mr-2" /> View Details
                  </button>
                  <button 
                    onClick={() => handleEditClick(customer)}
                    className="flex items-center justify-center p-2 px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="flex items-center justify-center p-2 px-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
            {!isLoading && filteredCustomers.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No customers found matching your search.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddModalOpen(false); setAddModalError(''); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] flex flex-col glass-card p-0 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('add_new_customer')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fields marked with <span className="text-red-500 font-semibold">*</span> are required</p>
                </div>
                <button 
                  onClick={() => { setIsAddModalOpen(false); setAddModalError(''); }}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="p-6 space-y-5 bg-white/80 dark:bg-slate-900/80 overflow-y-auto flex-1">
                {addModalError && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{addModalError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('customer_name')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('phone_number')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      type="tel" 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('business_location')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Map className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={newCustomer.location}
                      onChange={(e) => setNewCustomer({...newCustomer, location: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. T Nagar, Chennai"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aadhar Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={newCustomer.aadharNumber}
                      onChange={(e) => setNewCustomer({...newCustomer, aadharNumber: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. 1234 5678 9012"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('loan_amount')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      min="1"
                      type="number" 
                      value={newCustomer.loanAmount}
                      onChange={(e) => setNewCustomer({...newCustomer, loanAmount: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. 50000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{t('interest_rate')}</span>
                      <span className="text-xs font-normal text-blue-600 dark:text-blue-400">Default: 10%</span>
                    </label>
                    <div className="relative">
                      <BadgePercent className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="number"
                        step="0.1" 
                        value={newCustomer.interestRate}
                        onChange={(e) => setNewCustomer({...newCustomer, interestRate: e.target.value})}
                        className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                        placeholder={t('interest_rate_placeholder')}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('interest_period')}</label>
                    <select 
                      value={newCustomer.interestType}
                      onChange={(e) => setNewCustomer({...newCustomer, interestType: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                    >
                      <option value="Monthly">{t('monthly')}</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Interest Calculation Preview */}
                {Boolean(newCustomer.loanAmount && Number(newCustomer.loanAmount) > 0) && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-blue-900 dark:text-blue-200">
                        {t('calculated_preview')} ({newCustomer.interestRate !== '' && newCustomer.interestRate !== null && newCustomer.interestRate !== undefined ? `${newCustomer.interestRate}%` : '10% Default'} • {newCustomer.interestType})
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Initial auto interest charged upon loan creation
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-blue-700 dark:text-blue-300">
                        ₹{((Number(newCustomer.loanAmount) * (newCustomer.interestRate !== '' && newCustomer.interestRate !== null && newCustomer.interestRate !== undefined ? Number(newCustomer.interestRate) : 10)) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Repayment Schedule <span className="text-red-500">*</span>
                    </label>
                    <select 
                      required
                      value={newCustomer.repaymentType}
                      onChange={(e) => setNewCustomer({...newCustomer, repaymentType: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                    >
                      <option value="Daily">{t('daily')}</option>
                      <option value="Weekly">{t('weekly')}</option>
                      <option value="10 Days">10 Days</option>
                      <option value="Monthly">{t('monthly')}</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('start_date')} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required
                      type="date"
                      value={newCustomer.loanGivenDate}
                      onChange={(e) => setNewCustomer({...newCustomer, loanGivenDate: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setAddModalError(''); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 btn-primary py-2.5 shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> {t('loading')}
                      </>
                    ) : (
                      t('create_customer_button')
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Edit Customer Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsEditModalOpen(false); setEditModalError(''); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] flex flex-col glass-card p-0 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('edit_customer')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fields marked with <span className="text-red-500 font-semibold">*</span> are required</p>
                </div>
                <button 
                  onClick={() => { setIsEditModalOpen(false); setEditModalError(''); }}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateCustomer} className="p-6 space-y-5 bg-white/80 dark:bg-slate-900/80 overflow-y-auto flex-1">
                {editModalError && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{editModalError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('customer_name')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={editingCustomer.name || ''}
                      onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('phone_number')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      type="tel" 
                      value={editingCustomer.phone || ''}
                      onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('business_location')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Map className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={editingCustomer.location || ''}
                      onChange={(e) => setEditingCustomer({...editingCustomer, location: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. T Nagar, Chennai"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aadhar Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={editingCustomer.aadharNumber || ''}
                      onChange={(e) => setEditingCustomer({...editingCustomer, aadharNumber: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. 1234 5678 9012"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('loan_amount')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      required
                      min="1"
                      type="number" 
                      value={editingCustomer.loanAmount !== undefined && editingCustomer.loanAmount !== null ? editingCustomer.loanAmount : ''}
                      onChange={(e) => setEditingCustomer({...editingCustomer, loanAmount: e.target.value})}
                      className="w-full pl-10 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. 50000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Repayment Schedule <span className="text-red-500">*</span>
                    </label>
                    <select 
                      required
                      value={editingCustomer.repaymentType || 'Monthly'}
                      onChange={(e) => setEditingCustomer({...editingCustomer, repaymentType: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                    >
                      <option value="Daily">{t('daily')}</option>
                      <option value="Weekly">{t('weekly')}</option>
                      <option value="10 Days">10 Days</option>
                      <option value="Monthly">{t('monthly')}</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('start_date')} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required
                      type="date"
                      value={editingCustomer.loanGivenDate || ''}
                      onChange={(e) => setEditingCustomer({...editingCustomer, loanGivenDate: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setIsEditModalOpen(false); setEditModalError(''); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 btn-primary py-2.5 shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> {t('loading')}
                      </>
                    ) : (
                      t('save_changes')
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
