import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  FileText,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { pdf } from '@react-pdf/renderer';
import { MonthlyReportPDF } from './MonthlyReportPDF';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function Reports() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState('monthly');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${API_URL}/reports`);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const cn = (...inputs) => twMerge(clsx(inputs));

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentData = reportType === 'weekly' ? (data.weeklyData || []) : (data.monthlyData || []);
  const totalDisbursed = data.summary?.totalDisbursed ?? currentData.reduce((acc, curr) => acc + curr.disbursed, 0);
  const totalCollected = data.summary?.totalCollected ?? currentData.reduce((acc, curr) => acc + curr.collected, 0);
  const totalInterest = data.summary?.totalInterest ?? currentData.reduce((acc, curr) => acc + (curr.interest || 0), 0);

  const handleDownloadReport = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      const blob = await pdf(
        <MonthlyReportPDF
          data={data}
          totalDisbursed={totalDisbursed}
          totalCollected={totalCollected}
          totalInterest={totalInterest}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Monthly_Report_${new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}.pdf`;
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">View your disbursement and collection analytics.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setReportType('weekly')}
            className={cn(
              "flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all",
              reportType === 'weekly'
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={cn(
              "flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all",
              reportType === 'monthly'
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-6 border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Amount Disbursed</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center">
                <IndianRupee size={24} className="mr-1 text-slate-400" />
                {totalDisbursed.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4 flex items-center">
            <CalendarDays size={14} className="mr-1" />
            In the current month
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Amount Collected</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center">
                <IndianRupee size={24} className="mr-1 text-slate-400" />
                {totalCollected.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingDown size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4 flex items-center">
            <CalendarDays size={14} className="mr-1" />
            In the current month
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Interest Collected</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center">
                <IndianRupee size={24} className="mr-1 text-slate-400" />
                {totalInterest.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <TrendingDown size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4 flex items-center">
            <CalendarDays size={14} className="mr-1" />
            In the current month
          </p>
        </motion.div>
      </div>

      {/* Chart Section */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Disbursed vs Collected</h3>
          <button
            onClick={handleDownloadReport}
            disabled={isExporting}
            className="text-sm flex items-center text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            <Download size={16} className="mr-1" /> {isExporting ? 'Generating...' : 'Download Report'}
          </button>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dx={-10} />
              <Tooltip
                cursor={{ fill: '#F1F5F9', opacity: 0.5 }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="disbursed" name="Disbursed" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="interest" name="Interest" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Transactions Table */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
            <FileText size={18} className="mr-2 text-blue-500" /> Recent Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Transaction ID</th>
                <th scope="col" className="px-6 py-4 font-medium">Type</th>
                <th scope="col" className="px-6 py-4 font-medium">Customer</th>
                <th scope="col" className="px-6 py-4 font-medium">Date</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((trx) => (
                <tr key={trx.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{trx.id}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border",
                      trx.type === 'Collected'
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800"
                        : "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800"
                    )}>
                      {trx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{trx.customer}</td>
                  <td className="px-6 py-4 text-slate-500">{trx.date}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                    ₹{trx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
