import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar, 
  IndianRupee,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  MoreVertical,
  MessageCircle,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { pdf } from '@react-pdf/renderer';
import { CustomerStatementPDF } from './CustomerStatementPDF';
import { useLanguage } from '../../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function CustomerProfile() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const cn = (...inputs) => twMerge(clsx(inputs));

  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Edit Payment Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [originalPaymentData, setOriginalPaymentData] = useState(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [editError, setEditError] = useState('');
  const [isDeletingPaymentId, setIsDeletingPaymentId] = useState(null);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`);
      if (!response.ok) throw new Error('Customer not found');
      const data = await response.json();
      setCustomer(data);
    } catch (err) {
      setError(err.message || 'Customer not found (Make sure backend is running).');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdown(null);
    if (activeDropdown) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [activeDropdown]);

  const handleExportStatement = async () => {
    if (!customer) return;
    setIsExporting(true);
    try {
      const blob = await pdf(<CustomerStatementPDF customer={customer} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${customer.name.replace(/\s+/g, '_')}_Statement.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsAppShare = (payment) => {
    if (!customer || !customer.loan) return;
    
    let text = `*Payment Receipt*\n\n`;
    text += `Hello ${customer.name},\n`;
    text += `We have received your payment of *₹${payment.totalPaid.toLocaleString()}* on ${payment.date}.\n\n`;
    text += `*Payment Breakdown:*\n`;
    if (payment.principalPart > 0) text += `- Principal: ₹${payment.principalPart.toLocaleString()}\n`;
    if (payment.interestPart > 0) text += `- Interest: ₹${payment.interestPart.toLocaleString()}\n`;
    text += `\n*Remaining Balance:* ₹${customer.loan.remainingPrincipal.toLocaleString()}\n\n`;
    text += `Thank you!`;

    const encodedText = encodeURIComponent(text);
    
    let phone = customer.phone || '';
    phone = phone.replace(/\D/g,'');
    if (phone.length === 10) phone = '91' + phone;

    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    
    window.open(url, '_blank');
    setActiveDropdown(null);
  };

  // Convert raw ISO or date string to YYYY-MM-DDTHH:mm for datetime-local input
  const formatForDatetimeLocal = (rawDate) => {
    if (!rawDate) return '';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpenEditModal = (payment, e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    setOriginalPaymentData(payment);
    setEditingPayment({
      id: payment.id,
      paymentDate: formatForDatetimeLocal(payment.rawDate),
      paymentType: payment.mode || 'Interest + Principal',
      interestPaid: payment.interestPart,
      principalPaid: payment.principalPart,
      amount: payment.totalPaid
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handlePaymentTypeChange = (newType) => {
    if (!editingPayment) return;
    let interest = Number(editingPayment.interestPaid) || 0;
    let principal = Number(editingPayment.principalPaid) || 0;
    let total = Number(editingPayment.amount) || 0;

    if (newType === 'Interest Only') {
      interest = total > 0 ? total : interest;
      principal = 0;
      total = interest;
    } else if (newType === 'Principal Only') {
      principal = total > 0 ? total : principal;
      interest = 0;
      total = principal;
    } else {
      total = interest + principal;
    }

    setEditingPayment({
      ...editingPayment,
      paymentType: newType,
      interestPaid: interest,
      principalPaid: principal,
      amount: total
    });
  };

  const handleInterestChange = (val) => {
    const interest = parseFloat(val) || 0;
    let principal = Number(editingPayment.principalPaid) || 0;
    if (editingPayment.paymentType === 'Interest Only') {
      principal = 0;
    }
    setEditingPayment({
      ...editingPayment,
      interestPaid: val,
      amount: interest + principal
    });
  };

  const handlePrincipalChange = (val) => {
    const principal = parseFloat(val) || 0;
    let interest = Number(editingPayment.interestPaid) || 0;
    if (editingPayment.paymentType === 'Principal Only') {
      interest = 0;
    }
    setEditingPayment({
      ...editingPayment,
      principalPaid: val,
      amount: interest + principal
    });
  };

  const handleTotalAmountChange = (val) => {
    const total = parseFloat(val) || 0;
    if (editingPayment.paymentType === 'Interest Only') {
      setEditingPayment({
        ...editingPayment,
        amount: val,
        interestPaid: total,
        principalPaid: 0
      });
    } else if (editingPayment.paymentType === 'Principal Only') {
      setEditingPayment({
        ...editingPayment,
        amount: val,
        principalPaid: total,
        interestPaid: 0
      });
    } else {
      const interest = Number(editingPayment.interestPaid) || 0;
      const newPrincipal = Math.max(0, total - interest);
      setEditingPayment({
        ...editingPayment,
        amount: val,
        principalPaid: newPrincipal
      });
    }
  };

  const handleSavePaymentEdit = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;
    setIsSavingPayment(true);
    setEditError('');

    try {
      const response = await fetch(`${API_URL}/payments/${editingPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editingPayment.amount) || 0,
          principalPaid: Number(editingPayment.principalPaid) || 0,
          interestPaid: Number(editingPayment.interestPaid) || 0,
          paymentType: editingPayment.paymentType,
          paymentDate: editingPayment.paymentDate
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment');
      }

      setIsEditModalOpen(false);
      setEditingPayment(null);
      await fetchCustomer();
    } catch (err) {
      setEditError(err.message || 'Could not update payment');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleDeletePayment = async (payment, e) => {
    e.stopPropagation();
    setActiveDropdown(null);

    const confirmed = window.confirm(
      `Are you sure you want to delete this payment of ₹${payment.totalPaid.toLocaleString()}? This will restore any principal paid back to the active loan balance.`
    );
    if (!confirmed) return;

    setIsDeletingPaymentId(payment.id);
    try {
      const response = await fetch(`${API_URL}/payments/${payment.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payment');
      }
      await fetchCustomer();
    } catch (err) {
      alert(err.message || 'Could not delete payment');
    } finally {
      setIsDeletingPaymentId(null);
    }
  };

  // Projected loan balance calculation during edit
  const getProjectedRemainingPrincipal = () => {
    if (!customer?.loan || !originalPaymentData || !editingPayment) return 0;
    const currentRemaining = customer.loan.remainingPrincipal;
    const prevPrincipalPaid = Number(originalPaymentData.principalPart) || 0;
    const newPrincipalPaid = Number(editingPayment.principalPaid) || 0;
    const diff = newPrincipalPaid - prevPrincipalPaid;
    return Math.max(0, currentRemaining - diff);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-red-500 font-medium mb-4">Error loading customer: {error}</div>
        <button 
          onClick={() => navigate('/customers')}
          className="btn-primary"
        >
          {t('back_to_customers')}
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/customers')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
              <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", 
                customer.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' 
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              )}>
                {customer.status === 'Active' ? t('active') : customer.status === 'Overdue' ? t('overdue') : customer.status === 'Completed' ? t('completed') : customer.status}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Customer ID: {customer.id} • Joined {customer.joinedDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Customer & Loan Details */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Customer Info Card */}
            <motion.div variants={itemVariants} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                <User size={18} className="mr-2 text-blue-500" /> {t('profile')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <Phone size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-200">{customer.phone}</p>
                    <p className="text-xs text-slate-500">{t('phone_label')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-200">{customer.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CreditCard size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-200">Aadhar: {customer.aadharNumber}</p>
                    <p className="font-medium text-slate-900 dark:text-slate-200 mt-1">PAN: {customer.panNumber}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Active Loan Details */}
            {customer.loan ? (
              <motion.div variants={itemVariants} className="glass-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-600/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-700/30">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                  <FileText size={18} className="mr-2 text-blue-600 dark:text-blue-400" /> {t('loan_details')}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-blue-200/50 dark:border-blue-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('principal_col')}</span>
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center">
                      <IndianRupee size={14} className="mr-0.5"/> {customer.loan.principalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-blue-200/50 dark:border-blue-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('interest_rate')}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {customer.loan.interestRate}% ({customer.loan.interestType})
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('remaining_balance_col')}</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                      <IndianRupee size={18} className="mr-0.5"/> {customer.loan.remainingPrincipal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="glass-card p-6 text-center text-slate-500">
                <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                <p>No active loans for this customer.</p>
              </motion.div>
            )}
          </div>

          {/* Right Column: Payment History Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants} className="glass-card p-6 min-h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <Clock size={18} className="mr-2 text-blue-500" /> {t('payment_history')}
                </h3>
                <button 
                  onClick={handleExportStatement}
                  disabled={isExporting}
                  className="text-sm flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium disabled:opacity-50"
                >
                  <Download size={16} className="mr-1" /> {isExporting ? t('loading') : t('export_csv')}
                </button>
              </div>

              {customer.paymentHistory && customer.paymentHistory.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 md:ml-4 space-y-8 pb-4">
                  {customer.paymentHistory.map((payment, index) => (
                    <div key={payment.id} className="relative pl-6 md:pl-8">
                      {/* Timeline dot */}
                      <div className="absolute w-4 h-4 bg-emerald-500 rounded-full -left-[9px] top-1 border-2 border-white dark:border-slate-800 shadow-sm"></div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          
                          {/* Date & basic info */}
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Calendar size={14} className="text-slate-400" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{payment.date}</span>
                              {payment.mode === 'First Auto Interest' || payment.mode === 'Initial Interest' || (index === customer.paymentHistory.length - 1 && payment.interestPart > 0 && payment.principalPart === 0 && payment.mode === 'Interest Only') ? (
                                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 font-medium px-2 py-0.5 rounded-full ml-1">
                                  First Auto Interest
                                </span>
                              ) : (
                                <span className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded ml-1">
                                  {payment.mode}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">Receipt No: {payment.id}</p>
                          </div>

                          {/* Payment Split Data */}
                          <div className="flex gap-4 md:gap-8 items-center bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <div className="text-center md:text-right">
                              <p className="text-xs text-orange-500 font-medium mb-0.5">Interest</p>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center md:justify-end">
                                <IndianRupee size={12}/> {payment.interestPart.toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="text-center md:text-right">
                              <p className="text-xs text-emerald-500 font-medium mb-0.5">Principal</p>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center md:justify-end">
                                <IndianRupee size={12}/> {payment.principalPart.toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="text-center md:text-right">
                              <p className="text-xs text-blue-500 font-medium mb-0.5">Total Paid</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-end">
                                <IndianRupee size={16}/> {payment.totalPaid.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          {/* Three dot menu */}
                          <div className="relative flex-shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === payment.id ? null : payment.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            {activeDropdown === payment.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20 divide-y divide-slate-100 dark:divide-slate-700/50"
                              >
                                <div className="py-1">
                                  <button 
                                    onClick={(e) => handleOpenEditModal(payment, e)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  >
                                    <Edit2 size={15} />
                                    Edit Payment
                                  </button>
                                  <button 
                                    onClick={() => handleWhatsAppShare(payment)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors"
                                  >
                                    <MessageCircle size={15} />
                                    Resend Receipt
                                  </button>
                                </div>
                                <div className="py-1">
                                  <button 
                                    onClick={(e) => handleDeletePayment(payment, e)}
                                    disabled={isDeletingPaymentId === payment.id}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                  >
                                    {isDeletingPaymentId === payment.id ? (
                                      <RefreshCw size={15} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={15} />
                                    )}
                                    Delete Payment
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-12">
                  <Clock size={32} className="mx-auto mb-3 text-slate-300" />
                  <p>No payments have been recorded for this customer yet.</p>
                </div>
              )}
              
            </motion.div>
          </div>

        </div>
      </motion.div>

      {/* Edit Payment Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Dialog */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg max-h-[92vh] flex flex-col glass-card p-0 overflow-hidden shadow-2xl z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit2 size={20} className="text-blue-600 dark:text-blue-400" />
                    Edit Payment Record
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Receipt: <span className="font-mono">{editingPayment.id}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSavePaymentEdit} className="p-5 md:p-6 space-y-4 bg-white/90 dark:bg-slate-900/90 overflow-y-auto flex-1">
                
                {editError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Payment Date & Time */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar size={15} className="text-slate-400" /> Payment Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    value={editingPayment.paymentDate}
                    onChange={(e) => setEditingPayment({ ...editingPayment, paymentDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all text-sm"
                  />
                </div>

                {/* Payment Mode / Type Buttons */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Type / Mode</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Interest Only', 'Interest + Principal', 'Principal Only', 'First Auto Interest'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handlePaymentTypeChange(type)}
                        className={cn(
                          'py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center',
                          editingPayment.paymentType === type
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Breakdown Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  
                  {/* Interest Paid */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center justify-between">
                      <span>Interest Paid (₹)</span>
                      {editingPayment.paymentType === 'Principal Only' && (
                        <span className="text-xs text-slate-400 font-normal">N/A</span>
                      )}
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 text-orange-400" size={16} />
                      <input 
                        type="number"
                        min="0"
                        step="any"
                        disabled={editingPayment.paymentType === 'Principal Only'}
                        value={editingPayment.interestPaid}
                        onChange={(e) => handleInterestChange(e.target.value)}
                        className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Principal Paid */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>Principal Paid (₹)</span>
                      {editingPayment.paymentType === 'Interest Only' && (
                        <span className="text-xs text-slate-400 font-normal">N/A</span>
                      )}
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 text-emerald-400" size={16} />
                      <input 
                        type="number"
                        min="0"
                        step="any"
                        disabled={editingPayment.paymentType === 'Interest Only'}
                        value={editingPayment.principalPaid}
                        onChange={(e) => handlePrincipalChange(e.target.value)}
                        className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                        placeholder="0"
                      />
                    </div>
                  </div>

                </div>

                {/* Total Paid Field */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Total Amount Paid (₹)</span>
                    <span className="text-xs text-slate-400">Sum of Interest + Principal</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 text-blue-500" size={18} />
                    <input 
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={editingPayment.amount}
                      onChange={(e) => handleTotalAmountChange(e.target.value)}
                      className="w-full pl-9 p-2.5 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-blue-900 dark:text-blue-100 font-bold text-lg transition-all"
                    />
                  </div>
                </div>

                {/* Real-time Loan Balance Impact Preview */}
                {customer?.loan && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <Calculator size={13} className="text-blue-500" />
                      Loan Balance Recalculation Preview
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <span>Original Loan Principal:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{customer.loan.principalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span>Current Remaining Balance:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{customer.loan.remainingPrincipal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-medium text-slate-800 dark:text-slate-200">New Remaining Balance:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                        ₹{getProjectedRemainingPrincipal().toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="pt-3 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingPayment}
                    className="flex-1 btn-primary py-2.5 shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {isSavingPayment ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      'Save Changes'
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
