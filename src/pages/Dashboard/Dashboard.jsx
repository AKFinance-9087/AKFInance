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

export function Dashboard() {
  const [data, setData] = useState({
    topStats: { totalInvestment: 0, remainingPrincipal: 0, totalInterestEarned: 0, activeCustomers: 0 },
    charts: { monthlyData: [], loanDistribution: [], totalLoansCount: 0 },
    lists: { recentCollections: [], overdueLoans: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/summary');
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
            {title.includes('Total') || title.includes('Collection') || title.includes('Principal') ? <IndianRupee size={22} className="mr-1"/> : null}
            {value.toLocaleString('en-IN')}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('bg-', 'bg-opacity-20 text-').replace('500', '600')} dark:bg-opacity-20`}>
          <Icon size={24} className="currentColor" />
        </div>
      </div>
      <div className="flex items-center text-sm">
        <span className={`flex items-center font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
          {trendValue}
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
        <StatCard title="Total Investment" value={topStats.totalInvestment} icon={WalletCards} trend="up" trendValue="12.5%" colorClass="bg-blue-500" />
        <StatCard title="Remaining Principal" value={topStats.remainingPrincipal} icon={IndianRupee} trend="down" trendValue="4.2%" colorClass="bg-emerald-500" />
        <StatCard title="Total Interest Earned" value={topStats.totalInterestEarned} icon={TrendingUp} trend="up" trendValue="18.2%" colorClass="bg-purple-500" />
        <StatCard title="Active Customers" value={topStats.activeCustomers} icon={Users} trend="up" trendValue="5.1%" colorClass="bg-orange-500" />
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
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
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

    </motion.div>
  );
}
