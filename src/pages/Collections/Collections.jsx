import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  IndianRupee,
  Calendar,
  CheckCircle2,
  FileText,
  Search,
  Clock,
  TrendingDown,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  History,
  Wallet,
  BadgePercent,
  X,
  MessageCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const cn = (...inputs) => twMerge(clsx(inputs));

// ── Toast Notification ────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl max-w-sm',
        type === 'success'
          ? 'bg-emerald-600 text-white'
          : 'bg-red-600 text-white'
      )}
    >
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </motion.div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className={cn('glass-card p-4 flex items-center gap-4 border-l-4', color)}>
      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
        <Icon size={20} className="text-slate-600 dark:text-slate-300" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
}

export function Collections() {
  const [loans, setLoans] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState(null);

  // Form state
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [splitInterest, setSplitInterest] = useState('');
  const [splitPrincipal, setSplitPrincipal] = useState('');
  const [paymentType, setPaymentType] = useState('Interest + Principal');
  const getLocalDatetime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
  };
  const [paymentDate, setPaymentDate] = useState(getLocalDatetime());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const [loansRes, paymentsRes] = await Promise.all([
        fetch(`${API_URL}/loans`),
        fetch(`${API_URL}/payments`),
      ]);
      if (!loansRes.ok) throw new Error('Failed to fetch loans');
      if (!paymentsRes.ok) throw new Error('Failed to fetch payments');

      const loansData = await loansRes.json();
      const paymentsData = await paymentsRes.json();

      const mappedLoans = loansData.map((loan) => ({
        id: loan.id,
        customerId: loan.customerId,
        customerName: loan.customer?.name || 'Unknown',
        customerPhone: loan.customer?.phone || '',
        principalAmount: loan.principalAmount,
        interestType: loan.interestType || 'Monthly',
        interestRate: Number(loan.interestRate) || 0,
        remainingPrincipal: loan.remainingPrincipal,
        interestDue: Number(loan.interestDue) || 0,
        repaymentType: loan.repaymentType,
        loanGivenDate: loan.loanGivenDate,
        status: loan.status,
        payments: loan.payments || [],
      }));

      setLoans(mappedLoans);
      setRecentPayments(paymentsData);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectedLoan = loans.find((loan) => loan.id === selectedLoanId) || null;

  // ── Pending Payment Calculation ─────────────────────────────────────────────
  const calculatePending = (loan) => {
    if (!loan?.loanGivenDate) return { count: 0, label: loan?.status || 'Active', isPending: false };
    if (loan.status === 'Completed' || loan.status === 'Closed') return { count: 0, label: loan.status, isPending: false };

    const givenDate = new Date(loan.loanGivenDate);
    const now = new Date();
    
    const givenDateMidnight = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = nowMidnight.getTime() - givenDateMidnight.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    let expectedPayments = 0;
    let periodLabel = '';
    
    if (loan.repaymentType === 'Daily') { expectedPayments = diffDays; periodLabel = 'Day(s)'; }
    else if (loan.repaymentType === 'Weekly') { expectedPayments = Math.floor(diffDays / 7); periodLabel = 'Week(s)'; }
    else if (loan.repaymentType === 'Monthly') { 
        let months = (nowMidnight.getFullYear() - givenDateMidnight.getFullYear()) * 12;
        months -= givenDateMidnight.getMonth();
        months += nowMidnight.getMonth();
        if (nowMidnight.getDate() < givenDateMidnight.getDate()) {
            months--;
        }
        expectedPayments = Math.max(0, months);
        periodLabel = 'Month(s)'; 
    }

    const actualPayments = loan.payments?.length || 0;
    const pendingCount = expectedPayments - actualPayments;

    if (pendingCount > 0) return { count: pendingCount, label: `${pendingCount} ${periodLabel} Pending`, isPending: true };
    if (pendingCount < 0) return { count: pendingCount, label: `${Math.abs(pendingCount)} ${periodLabel} Advance`, isPending: false };
    return { count: 0, label: 'Up to date', isPending: false };
  };

  // ── Auto-Calculation ─────────────────────────────────────────────────────────
  const numPaymentAmount = parseFloat(paymentAmount) || 0;
  const numSplitInterest = parseFloat(splitInterest) || 0;
  const numSplitPrincipal = parseFloat(splitPrincipal) || 0;

  let calculatedInterest = 0;
  let calculatedPrincipal = 0;
  let newRemainingPrincipal = selectedLoan?.remainingPrincipal || 0;
  let totalAmountReceived = 0;

  if (selectedLoan) {
    if (paymentType === 'Interest Only') {
      calculatedInterest = numPaymentAmount;
      calculatedPrincipal = 0;
      totalAmountReceived = numPaymentAmount;
    } else if (paymentType === 'Principal Only') {
      calculatedInterest = 0;
      calculatedPrincipal = numPaymentAmount;
      totalAmountReceived = numPaymentAmount;
    } else {
      // Interest + Principal (Manual Split)
      calculatedInterest = numSplitInterest;
      calculatedPrincipal = numSplitPrincipal;
      totalAmountReceived = numSplitInterest + numSplitPrincipal;
    }
    
    newRemainingPrincipal = selectedLoan.remainingPrincipal - calculatedPrincipal;
    if (newRemainingPrincipal < 0) newRemainingPrincipal = 0;
  }

  // ── Submit Payment ───────────────────────────────────────────────────────────
  const handleConfirmPayment = async () => {
    if (!selectedLoan || totalAmountReceived <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedLoan.id,
          customerId: selectedLoan.customerId,
          amount: totalAmountReceived,
          principalPaid: calculatedPrincipal,
          interestPaid: calculatedInterest,
          paymentType,
          paymentDate,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Payment failed');
      }

      // Refresh all data from server
      await fetchAll();
      
      setSuccessReceipt({
        customerName: selectedLoan.customerName,
        customerPhone: selectedLoan.customerPhone,
        amount: totalAmountReceived,
        principalPaid: calculatedPrincipal,
        interestPaid: calculatedInterest,
        remainingPrincipal: newRemainingPrincipal,
        date: paymentDate,
        type: paymentType
      });
      
      setPaymentAmount('');
      setSplitInterest('');
      setSplitPrincipal('');
      showToast(`₹${totalAmountReceived.toLocaleString()} payment confirmed for ${selectedLoan.customerName}!`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingStatus = selectedLoan ? calculatePending(selectedLoan) : null;
  const recoveryPct = selectedLoan
    ? Math.round(((selectedLoan.principalAmount - selectedLoan.remainingPrincipal) / selectedLoan.principalAmount) * 100)
    : 0;

  const filteredLoans = loans.filter(
    (loan) =>
      (filterType === 'All' || loan.repaymentType === filterType) &&
      (loan.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ── Loan's own payment history ───────────────────────────────────────────────
  const loanPayments = recentPayments.filter((p) => p.loanId === selectedLoanId);

  const sendWhatsApp = (receipt, language = 'en') => {
    let text = '';
    const dateStr = new Date(receipt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    if (language === 'ta') {
      text = `*கட்டண ரசீது*\n\n`;
      text += `வணக்கம் ${receipt.customerName},\n`;
      text += `தாங்கள் ${dateStr} அன்று செலுத்திய *₹${receipt.amount.toLocaleString()}* தொகை கிடைக்கப்பெற்றது.\n\n`;
      text += `*கட்டண விவரம்:*\n`;
      if (receipt.principalPaid > 0) text += `- அசல் வரவு: ₹${receipt.principalPaid.toLocaleString()}\n`;
      if (receipt.interestPaid > 0) text += `- வட்டி வரவு: ₹${receipt.interestPaid.toLocaleString()}\n`;
      text += `\n*மீதமுள்ள அசல்:* ₹${receipt.remainingPrincipal.toLocaleString()}\n\n`;
      text += `நன்றி!`;
    } else {
      text = `*Payment Receipt*\n\n`;
      text += `Hello ${receipt.customerName},\n`;
      text += `We have received your payment of *₹${receipt.amount.toLocaleString()}* on ${dateStr}.\n\n`;
      text += `*Payment Breakdown:*\n`;
      if (receipt.principalPaid > 0) text += `- Principal: ₹${receipt.principalPaid.toLocaleString()}\n`;
      if (receipt.interestPaid > 0) text += `- Interest: ₹${receipt.interestPaid.toLocaleString()}\n`;
      text += `\n*Remaining Balance:* ₹${receipt.remainingPrincipal.toLocaleString()}\n\n`;
      text += `Thank you!`;
    }

    const encodedText = encodeURIComponent(text);
    let phone = receipt.customerPhone || '';
    phone = phone.replace(/\D/g,'');
    if (phone.length === 10) phone = '91' + phone;

    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Collection</h1>
            <p className="text-slate-500 dark:text-slate-400">Record payments and track outstanding balances in real time.</p>
          </div>
          <button
            onClick={fetchAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error Banner */}
        {fetchError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle size={16} />
            {fetchError}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <RefreshCw size={32} className="animate-spin" />
            <p>Loading loans and payment history…</p>
          </div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Loans" value={loans.length} icon={Wallet} color="border-blue-500" />
              <StatCard
                label="Active Loans"
                value={loans.filter((l) => l.status === 'Active').length}
                icon={TrendingDown}
                color="border-emerald-500"
              />
              <StatCard
                label="Overdue Loans"
                value={loans.filter((l) => calculatePending(l).isPending).length}
                icon={AlertCircle}
                color="border-red-500"
              />
              <StatCard
                label="Payments Today"
                value={recentPayments.filter(
                  (p) => new Date(p.paymentDate).toDateString() === new Date().toDateString()
                ).length}
                icon={CheckCircle2}
                color="border-violet-500"
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* ── Left: Collection Form (3 cols) ── */}
              <div className="lg:col-span-3 space-y-5">
                <div className="glass-card p-6 space-y-5">
                  <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <IndianRupee size={18} className="text-blue-500" />
                    Record a Payment
                  </h2>

                  {/* Loan Search + Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Select Customer / Loan
                    </label>

                    <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-fit">
                      {['All', 'Daily', 'Weekly', 'Monthly'].map((type) => (
                        <button
                          key={type}
                          onClick={() => { setFilterType(type); setIsDropdownOpen(true); }}
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-md transition-all',
                            filterType === type
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or loan ID…"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                        className="w-full p-3 pl-10 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-white transition-all"
                      />
                      <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />

                      {isDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                          {filteredLoans.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">No loans found.</div>
                          ) : (
                            filteredLoans.map((loan) => {
                              const ps = calculatePending(loan);
                              return (
                                <div
                                  key={loan.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSelectedLoanId(loan.id);
                                    setSearchQuery(`${loan.customerName}`);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-900 dark:text-white">{loan.customerName}</span>
                                    <span className={cn(
                                      'text-xs font-medium px-2 py-0.5 rounded-full',
                                      ps.isPending
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    )}>
                                      {ps.label}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between mt-1">
                                    <span>{loan.repaymentType} · ₹{loan.remainingPrincipal.toLocaleString()} due</span>
                                    <span className="font-mono text-slate-400">{loan.id.slice(0, 8)}…</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedLoan && (
                    <>
                      {/* Pending Alert */}
                      {pendingStatus?.isPending && (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900/30 text-orange-700 dark:text-orange-400 text-sm">
                          <Clock size={16} className="flex-shrink-0" />
                          <span><strong>{pendingStatus.label}</strong> — consider clearing arrears first.</span>
                        </div>
                      )}

                      {/* Payment Type */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Type</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {['Interest + Principal', 'Interest Only', 'Principal Only'].map((type) => (
                            <button
                              key={type}
                              onClick={() => setPaymentType(type)}
                              className={cn(
                                'py-2 px-1 text-xs font-medium rounded-xl border transition-all text-center',
                                paymentType === type
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-600/30 dark:text-blue-400 dark:border-blue-500 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400'
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="space-y-2">
                        {paymentType === 'Interest + Principal' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Interest Received (₹)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  value={splitInterest}
                                  onChange={(e) => setSplitInterest(e.target.value)}
                                  placeholder="Interest"
                                  className="w-full p-3 pl-10 text-xl font-bold text-slate-900 bg-orange-50/50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-orange-900/10 dark:border-orange-900/30 dark:text-white transition-all"
                                />
                                <IndianRupee className="absolute left-3 top-3.5 text-orange-400" size={18} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Principal Received (₹)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  value={splitPrincipal}
                                  onChange={(e) => setSplitPrincipal(e.target.value)}
                                  placeholder="Principal"
                                  className="w-full p-3 pl-10 text-xl font-bold text-slate-900 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-white transition-all"
                                />
                                <IndianRupee className="absolute left-3 top-3.5 text-emerald-400" size={18} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Amount Received (₹)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full p-3 pl-10 text-2xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-white transition-all"
                              />
                              <IndianRupee className="absolute left-3 top-4 text-slate-400" size={20} />
                            </div>

                            {/* Quick-fill buttons */}
                            {selectedLoan.interestDue > 0 && (
                              <div className="flex flex-col sm:flex-row gap-2 flex-wrap mt-2">
                                <span className="text-xs text-slate-400 self-center">Quick fill:</span>
                                <button
                                  onClick={() => setPaymentAmount(String(selectedLoan.interestDue))}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30 hover:bg-orange-100 transition-colors"
                                >
                                  Interest only ₹{selectedLoan.interestDue.toLocaleString()}
                                </button>
                                <button
                                  onClick={() => setPaymentAmount(String(selectedLoan.remainingPrincipal))}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100 transition-colors"
                                >
                                  Full principal ₹{selectedLoan.remainingPrincipal.toLocaleString()}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Date & Time</label>
                        <div className="relative">
                          <input
                            type="datetime-local"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full p-3 pl-10 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-white appearance-none transition-all"
                          />
                          <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        </div>
                      </div>

                      {/* Confirm Button */}
                      <button
                        onClick={handleConfirmPayment}
                        disabled={totalAmountReceived <= 0 || isSubmitting}
                        className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <RefreshCw size={20} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={20} />
                        )}
                        {isSubmitting ? 'Processing…' : 'Confirm Payment'}
                      </button>
                    </>
                  )}

                  {!selectedLoan && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                      <Search size={32} className="text-slate-300 dark:text-slate-600" />
                      <p className="text-sm">Search for a customer above to record a payment.</p>
                    </div>
                  )}
                </div>

                {/* Payment History for Selected Loan */}
                {selectedLoan && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                      <History size={16} className="text-slate-500" />
                      Payment History
                      <span className="ml-auto text-xs font-normal text-slate-400">{loanPayments.length} record(s)</span>
                    </h3>

                    {loanPayments.length === 0 ? (
                      <p className="text-sm text-center text-slate-400 py-6">No payments recorded yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {loanPayments.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-white">
                                ₹{Number(p.amount).toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {' · '}{p.paymentType}
                              </p>
                            </div>
                            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                              <p>₹{Number(p.principalPaid).toLocaleString()} principal</p>
                              <p>₹{Number(p.interestPaid).toLocaleString()} interest</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Right: Loan Details + Calculation (2 cols) ── */}
              <div className="lg:col-span-2 space-y-5">
                {selectedLoan ? (
                  <>
                    {/* Loan Status Card */}
                    <div className="glass-card p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900/50">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText size={14} /> Loan Status
                      </h3>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Customer</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">{selectedLoan.customerName}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Original Loan</span>
                          <span className="font-semibold text-slate-900 dark:text-white">₹{selectedLoan.principalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Remaining</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">₹{selectedLoan.remainingPrincipal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Interest Due</span>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">₹{selectedLoan.interestDue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Interest Rate</span>
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                            <BadgePercent size={14} /> {selectedLoan.interestRate}% {selectedLoan.interestType}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Schedule</span>
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                            <Calendar size={13} /> {selectedLoan.repaymentType}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Payment Status</span>
                          <span className={cn(
                            'text-xs font-medium px-2.5 py-1 rounded-full border',
                            pendingStatus?.isPending
                              ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                          )}>
                            {pendingStatus?.label}
                          </span>
                        </div>
                      </div>

                      {/* Recovery Progress */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Recovery Progress</span>
                          <span className="font-semibold text-emerald-600">{recoveryPct}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${recoveryPct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Calculation Preview */}
                    <motion.div
                      key={paymentAmount + paymentType}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card p-6 border-blue-200 dark:border-blue-700/50 relative overflow-hidden"
                    >
                      <div className="absolute -right-6 -top-6 text-blue-50 dark:text-blue-600/20 pointer-events-none">
                        <Calculator size={100} />
                      </div>
                      <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 relative z-10 flex items-center gap-2">
                        <Calculator size={14} /> Live Preview
                      </h3>

                      <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                          <span className="text-sm text-slate-500">Total Received</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                            {totalAmountReceived > 0 ? `₹${totalAmountReceived.toLocaleString()}` : '—'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                            <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">→ Interest</p>
                            <p className="font-bold text-orange-700 dark:text-orange-300">
                              ₹{calculatedInterest.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">→ Principal</p>
                            <p className="font-bold text-emerald-700 dark:text-emerald-300">
                              ₹{calculatedPrincipal.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New Balance</span>
                          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{newRemainingPrincipal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <div className="glass-card h-full flex flex-col items-center justify-center p-10 text-center text-slate-400 min-h-64">
                    <Calculator size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm">Select a customer to view loan details and calculate payments.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Payments Table */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <History size={18} className="text-slate-500" />
                Recent Payments
                <span className="text-xs font-normal text-slate-400 ml-auto">Last {recentPayments.length} records</span>
              </h2>

              {recentPayments.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">No payment records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700">
                        {['Customer', 'Date', 'Amount', 'Interest', 'Principal', 'Type', 'Status'].map((h) => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {recentPayments.slice(0, 10).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{p.customer?.name || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                            {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">₹{Number(p.amount).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-orange-600 dark:text-orange-400">₹{Number(p.interestPaid).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">₹{Number(p.principalPaid).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{p.paymentType}</td>
                          <td className="py-2.5 px-3">
                            <span className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              p.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            )}>
                              {p.status || 'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Success / WhatsApp Receipt Modal */}
      <AnimatePresence>
        {successReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSuccessReceipt(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Payment Confirmed!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  ₹{successReceipt.amount.toLocaleString()} received from {successReceipt.customerName}.
                </p>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => sendWhatsApp(successReceipt, 'en')}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-medium transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span className="text-xs">Receipt (English)</span>
                    </button>
                    <button 
                      onClick={() => sendWhatsApp(successReceipt, 'ta')}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-medium transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span className="text-xs">ரசீது (Tamil)</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => setSuccessReceipt(null)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
