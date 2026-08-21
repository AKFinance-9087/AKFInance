import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  TrendingUp,
  WalletCards,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function Dashboard() {
  const [data, setData] = useState({
    topStats: {
      totalInvestment: 0,
      totalInvestmentTrend: 'up',
      totalInvestmentTrendValue: '0.0%',
      remainingPrincipal: 0,
      remainingPrincipalTrend: 'down',
      remainingPrincipalTrendValue: '0.0%',
      totalInterestEarned: 0,
      totalInterestEarnedTrend: 'up',
      totalInterestEarnedTrendValue: '0.0%',
      activeCustomers: 0,
      activeCustomersTrend: 'up',
      activeCustomersTrendValue: '0.0%'
    },
    charts: { monthlyData: [], loanDistribution: [], totalLoansCount: 0 },
    lists: { recentCollections: [], overdueLoans: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_URL}/dashboard/summary`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Could not connect to database. Showing empty layout.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass }) => (
    <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-transform group-hover:scale-110 ${colorClass}`}></div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            {title.includes('Total') || title.includes('Collection') || title.includes('Principal') ? <IndianRupee size={22} className="mr-1" /> : null}
            {(value || 0).toLocaleString('en-IN')}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('bg-', 'bg-opacity-20 text-').replace('500', '600')} dark:bg-opacity-20`}>
          <Icon size={24} className="currentColor" />
        </div>
      </div>
      <div className="flex items-center text-sm">
        <span className={`flex items-center font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
          {trendValue || '0.0%'}
        </span>
        <span className="text-slate-500 dark:text-slate-400 ml-2">vs last month</span>
      </div>
    </motion.div>
  );

  const { topStats, charts, lists } = data;
  const { monthlyData, loanDistribution, totalLoansCount } = charts;
  const { recentCollections, overdueLoans } = lists;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
    >
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
          {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, here's your financial summary.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex items-center">
            <TrendingUp size={18} className="mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Investment"
          value={topStats?.totalInvestment}
          icon={WalletCards}
          trend={topStats?.totalInvestmentTrend || 'up'}
          trendValue={topStats?.totalInvestmentTrendValue || '0.0%'}
          colorClass="bg-blue-500"
        />
        <StatCard
          title="Remaining Principal"
          value={topStats?.remainingPrincipal}
          icon={IndianRupee}
          trend={topStats?.remainingPrincipalTrend || 'down'}
          trendValue={topStats?.remainingPrincipalTrendValue || '0.0%'}
          colorClass="bg-emerald-500"
        />
        <StatCard
          title="Total Interest Earned"
          value={topStats?.totalInterestEarned}
          icon={TrendingUp}
          trend={topStats?.totalInterestEarnedTrend || 'up'}
          trendValue={topStats?.totalInterestEarnedTrendValue || '0.0%'}
          colorClass="bg-purple-500"
        />
        <StatCard
          title="Active Customers"
          value={topStats?.activeCustomers}
          icon={Users}
          trend={topStats?.activeCustomersTrend || 'up'}
          trendValue={topStats?.activeCustomersTrendValue || '0.0%'}
          colorClass="bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Income vs Expenses (Last 7 Months)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="income" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Loan Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loanDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {loanDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-slate-800 dark:text-white">{totalLoansCount.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Total Loans</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {loanDistribution.map(item => (
              <div key={item.name} className="flex items-center text-sm">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 dark:text-slate-300">{item.name} ({item.value})</span>
              </div>
            ))}
            {loanDistribution.length === 0 && (
              <div className="col-span-2 text-center text-sm text-slate-500 mt-2">No loans found</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Collections */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Collections</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentCollections.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-white">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.type} • {item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-800 dark:text-white">₹{item.amount.toLocaleString()}</div>
                  <div className={`text-xs flex items-center justify-end mt-1 ${item.status === 'Completed' ? 'text-green-500' : 'text-orange-500'}`}>
                    {item.status === 'Completed' ? <CheckCircle2 size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
            {recentCollections.length === 0 && (
              <div className="text-center text-slate-500 py-4">No recent collections found.</div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions / Overdue */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button className="p-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 transition-colors">
              <Users size={24} className="mb-2" />
              <span className="font-medium">Add Customer</span>
            </button>
            <button className="p-4 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 transition-colors">
              <WalletCards size={24} className="mb-2" />
              <span className="font-medium">Create Loan</span>
            </button>
          </div>

          <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3">
            Critical Overdue ({overdueLoans.length})
          </h3>
          <div className="space-y-3">
            {overdueLoans.map(loan => (
              <div key={loan.id} className="flex items-center justify-between p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">{loan.name}</h4>
                  <p className="text-xs text-red-500">
                    {loan.daysOverdue !== 'Unknown' ? `Overdue by ${loan.daysOverdue} days` : 'Overdue (Date Unknown)'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800 dark:text-white text-sm">₹{loan.amount.toLocaleString()}</span>
                  <button className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors">
                    Remind
                  </button>
                </div>
              </div>
            ))}
            {overdueLoans.length === 0 && (
              <div className="text-center text-slate-500 py-4">No overdue loans found.</div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
