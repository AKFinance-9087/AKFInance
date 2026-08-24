import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './postgresql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to resolve accurate display date (fallback to createdAt time if paymentDate is UTC midnight)
function getEffectiveDate(dateValue, fallbackCreatedAt) {
  if (!dateValue && !fallbackCreatedAt) return new Date();
  const d = dateValue ? new Date(dateValue) : new Date(fallbackCreatedAt);
  if (fallbackCreatedAt && d.toISOString().endsWith('T00:00:00.000Z')) {
    return new Date(fallbackCreatedAt);
  }
  return d;
}

// Helper function to parse user-provided loan/payment dates preserving current local time if today
function parseLoanOrPaymentDate(inputDate) {
  if (!inputDate) return new Date();
  if (typeof inputDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    const now = new Date();
    const [y, m, d] = inputDate.split('-').map(Number);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (inputDate === todayStr) {
      return new Date(); // exact current time
    }
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
  }
  return new Date(inputDate);
}

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// --- DASHBOARD API ---
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const [
      totalInvestmentAgg,
      remainingPrincipalAgg,
      totalInterestAgg,
      activeCustomersCount,
      loanDistributionRaw,
      recentCollections,
      overdueLoansRaw,
      paymentsRaw,
      loansRaw
    ] = await Promise.all([
      prisma.loan.aggregate({ _sum: { principalAmount: true } }),
      prisma.loan.aggregate({ _sum: { remainingPrincipal: true } }),
      prisma.payment.aggregate({ _sum: { interestPaid: true } }),
      prisma.customer.count({ where: { status: 'Active' } }),
      prisma.loan.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.payment.findMany({
        take: 4,
        orderBy: { paymentDate: 'desc' },
        include: { customer: { select: { name: true } } }
      }),
      prisma.loan.findMany({
        where: { status: 'Overdue' },
        take: 3,
        include: { customer: { select: { name: true } } }
      }),
      prisma.payment.findMany({ select: { paymentDate: true, amount: true, principalPaid: true, interestPaid: true } }),
      prisma.loan.findMany({ select: { loanGivenDate: true, principalAmount: true } })
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Previous month reference
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    // 1. Total Investment (Disbursed) this month vs last month
    const thisMonthLoans = loansRaw.filter(l => {
      const d = new Date(l.loanGivenDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const lastMonthLoans = loansRaw.filter(l => {
      const d = new Date(l.loanGivenDate);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });
    const thisMonthInvestment = thisMonthLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
    const lastMonthInvestment = lastMonthLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);

    let investmentTrend = 'up';
    let investmentTrendValue = '0.0%';
    if (lastMonthInvestment > 0) {
      const pct = ((thisMonthInvestment - lastMonthInvestment) / lastMonthInvestment) * 100;
      investmentTrend = pct >= 0 ? 'up' : 'down';
      investmentTrendValue = `${Math.abs(pct).toFixed(1)}%`;
    } else if (thisMonthInvestment > 0) {
      investmentTrend = 'up';
      investmentTrendValue = '100.0%';
    }

    // 2. Remaining Principal (Principal repayments / reductions this month vs last month)
    const thisMonthPayments = paymentsRaw.filter(p => {
      const d = new Date(p.paymentDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const lastMonthPayments = paymentsRaw.filter(p => {
      const d = new Date(p.paymentDate);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });

    const thisMonthPrincipalPaid = thisMonthPayments.reduce((sum, p) => sum + (p.principalPaid || 0), 0);
    const lastMonthPrincipalPaid = lastMonthPayments.reduce((sum, p) => sum + (p.principalPaid || 0), 0);

    let remainingTrend = 'down';
    let remainingTrendValue = '0.0%';
    if (lastMonthPrincipalPaid > 0) {
      const pct = ((thisMonthPrincipalPaid - lastMonthPrincipalPaid) / lastMonthPrincipalPaid) * 100;
      remainingTrend = pct >= 0 ? 'down' : 'up';
      remainingTrendValue = `${Math.abs(pct).toFixed(1)}%`;
    } else if (thisMonthPrincipalPaid > 0) {
      remainingTrend = 'down';
      remainingTrendValue = '100.0%';
    }

    // 3. Total Interest Earned this month vs last month
    const thisMonthInterest = thisMonthPayments.reduce((sum, p) => sum + (p.interestPaid || 0), 0);
    const lastMonthInterest = lastMonthPayments.reduce((sum, p) => sum + (p.interestPaid || 0), 0);

    let interestTrend = 'up';
    let interestTrendValue = '0.0%';
    if (lastMonthInterest > 0) {
      const pct = ((thisMonthInterest - lastMonthInterest) / lastMonthInterest) * 100;
      interestTrend = pct >= 0 ? 'up' : 'down';
      interestTrendValue = `${Math.abs(pct).toFixed(1)}%`;
    } else if (thisMonthInterest > 0) {
      interestTrend = 'up';
      interestTrendValue = '100.0%';
    }

    // 4. Active / New Customers this month vs last month
    const [thisMonthCustCount, lastMonthCustCount] = await Promise.all([
      prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1)
          }
        }
      }),
      prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(prevYear, prevMonth, 1),
            lt: new Date(currentYear, currentMonth, 1)
          }
        }
      })
    ]);

    let customerTrend = 'up';
    let customerTrendValue = '0.0%';
    if (lastMonthCustCount > 0) {
      const pct = ((thisMonthCustCount - lastMonthCustCount) / lastMonthCustCount) * 100;
      customerTrend = pct >= 0 ? 'up' : 'down';
      customerTrendValue = `${Math.abs(pct).toFixed(1)}%`;
    } else if (thisMonthCustCount > 0) {
      customerTrend = 'up';
      customerTrendValue = '100.0%';
    }

    // Format Monthly Data (Last 7 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const monthlyData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();

      const income = paymentsRaw
        .filter(p => new Date(p.paymentDate).getMonth() === d.getMonth() && new Date(p.paymentDate).getFullYear() === year)
        .reduce((sum, p) => sum + p.amount, 0);

      const expenses = loansRaw
        .filter(l => new Date(l.loanGivenDate).getMonth() === d.getMonth() && new Date(l.loanGivenDate).getFullYear() === year)
        .reduce((sum, l) => sum + l.principalAmount, 0);

      monthlyData.push({ name: monthName, income, expenses });
    }

    // Format Loan Distribution
    const colorMap = { 'Active': '#10B981', 'Pending': '#F59E0B', 'Closed': '#3B82F6', 'Overdue': '#EF4444' };
    const loanDistribution = loanDistributionRaw.map(l => ({
      name: l.status,
      value: l._count._all,
      color: colorMap[l.status] || '#CBD5E1'
    }));

    // Ensure total loans are calculated
    const totalLoansCount = loanDistribution.reduce((acc, curr) => acc + curr.value, 0);

    // Format Recent Collections
    const formattedCollections = recentCollections.map(p => ({
      id: p.id,
      name: p.customer.name,
      amount: p.amount,
      type: p.paymentType,
      status: p.status,
      date: getEffectiveDate(p.paymentDate, p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    }));

    // Format Overdue Loans
    const formattedOverdue = overdueLoansRaw.map(l => {
      const daysOverdue = l.nextDueDate ? Math.floor((new Date() - new Date(l.nextDueDate)) / (1000 * 60 * 60 * 24)) : 0;
      return {
        id: l.id,
        name: l.customer.name,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 'Unknown',
        amount: l.remainingPrincipal
      };
    });

    res.json({
      topStats: {
        totalInvestment: totalInvestmentAgg._sum.principalAmount || 0,
        totalInvestmentTrend: investmentTrend,
        totalInvestmentTrendValue: investmentTrendValue,
        remainingPrincipal: remainingPrincipalAgg._sum.remainingPrincipal || 0,
        remainingPrincipalTrend: remainingTrend,
        remainingPrincipalTrendValue: remainingTrendValue,
        totalInterestEarned: totalInterestAgg._sum.interestPaid || 0,
        totalInterestEarnedTrend: interestTrend,
        totalInterestEarnedTrendValue: interestTrendValue,
        activeCustomers: activeCustomersCount || 0,
        activeCustomersTrend: customerTrend,
        activeCustomersTrendValue: customerTrendValue
      },
      charts: {
        monthlyData,
        loanDistribution,
        totalLoansCount
      },
      lists: {
        recentCollections: formattedCollections,
        overdueLoans: formattedOverdue
      }
    });

  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// --- REPORTS API ---
app.get('/api/reports', async (req, res) => {
  try {
    const [payments, loans] = await Promise.all([
      prisma.payment.findMany({
        include: { customer: { select: { name: true } } },
      }),
      prisma.loan.findMany({
        include: { customer: { select: { name: true } } },
      })
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Filter current month data
    const currentMonthPayments = payments.filter(p => {
      const pd = new Date(p.paymentDate);
      return pd.getFullYear() === currentYear && pd.getMonth() === currentMonth;
    });

    const currentMonthLoans = loans.filter(l => {
      const ld = new Date(l.loanGivenDate);
      return ld.getFullYear() === currentYear && ld.getMonth() === currentMonth;
    });

    const totalDisbursed = currentMonthLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
    const totalCollected = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalInterest = currentMonthPayments.reduce((sum, p) => sum + (p.interestPaid || 0), 0);

    // --- WEEKLY BREAKDOWN FOR CURRENT MONTH (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-end) ---
    const weeks = [
      { name: 'Week 1', startDay: 1, endDay: 7 },
      { name: 'Week 2', startDay: 8, endDay: 14 },
      { name: 'Week 3', startDay: 15, endDay: 21 },
      { name: 'Week 4', startDay: 22, endDay: 31 }
    ];

    const weeklyData = weeks.map(w => {
      const disbursed = currentMonthLoans
        .filter(l => {
          const d = new Date(l.loanGivenDate).getDate();
          return d >= w.startDay && d <= w.endDay;
        })
        .reduce((sum, l) => sum + (l.principalAmount || 0), 0);

      const collected = currentMonthPayments
        .filter(p => {
          const d = new Date(p.paymentDate).getDate();
          return d >= w.startDay && d <= w.endDay;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const interest = currentMonthPayments
        .filter(p => {
          const d = new Date(p.paymentDate).getDate();
          return d >= w.startDay && d <= w.endDay;
        })
        .reduce((sum, p) => sum + (p.interestPaid || 0), 0);

      return { name: w.name, disbursed, collected, interest };
    });

    // --- MONTHLY DATA (Last 6 Months) ---
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      const monthIndex = d.getMonth();

      const collected = payments
        .filter(p => {
          const pd = new Date(p.paymentDate);
          return pd.getMonth() === monthIndex && pd.getFullYear() === year;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const disbursed = loans
        .filter(l => {
          const ld = new Date(l.loanGivenDate);
          return ld.getMonth() === monthIndex && ld.getFullYear() === year;
        })
        .reduce((sum, l) => sum + (l.principalAmount || 0), 0);

      const interest = payments
        .filter(p => {
          const pd = new Date(p.paymentDate);
          return pd.getMonth() === monthIndex && pd.getFullYear() === year;
        })
        .reduce((sum, p) => sum + (p.interestPaid || 0), 0);

      monthlyData.push({ name: monthName, disbursed, collected, interest });
    }

    // --- RECENT TRANSACTIONS ---
    const formattedPayments = payments.map(p => ({
      id: `PAY-${p.id.substring(0, 6).toUpperCase()}`,
      type: 'Collected',
      customer: p.customer?.name || 'Unknown',
      amount: p.amount,
      rawDate: getEffectiveDate(p.paymentDate, p.createdAt)
    }));

    const formattedLoans = loans.map(l => ({
      id: `LOAN-${l.id.substring(0, 6).toUpperCase()}`,
      type: 'Disbursed',
      customer: l.customer?.name || 'Unknown',
      amount: l.principalAmount,
      rawDate: getEffectiveDate(l.loanGivenDate, l.createdAt)
    }));

    const recentTransactions = [...formattedPayments, ...formattedLoans]
      .sort((a, b) => b.rawDate - a.rawDate)
      .slice(0, 50)
      .map(t => ({
        id: t.id,
        type: t.type,
        customer: t.customer,
        amount: t.amount,
        date: t.rawDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      }));

    res.json({
      summary: {
        totalDisbursed,
        totalCollected,
        totalInterest
      },
      weeklyData,
      monthlyData,
      recentTransactions
    });

  } catch (error) {
    console.error('Failed to fetch reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// --- NOTIFICATIONS API (Pending Payments Engine) ---
app.get('/api/notifications/pending', async (req, res) => {
  try {
    const activeLoans = await prisma.loan.findMany({
      where: { status: 'Active' },
      include: {
        customer: true,
        payments: true
      },
      orderBy: { loanGivenDate: 'asc' }
    });

    const now = new Date();
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const pendingNotifications = [];

    for (const loan of activeLoans) {
      if (!loan.loanGivenDate) continue;
      const givenDate = new Date(loan.loanGivenDate);
      const givenDateMidnight = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate());
      const diffTime = nowMidnight.getTime() - givenDateMidnight.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      let periodsElapsed = 0;
      let periodLabel = '';

      if (loan.repaymentType === 'Daily') {
        periodsElapsed = diffDays;
        periodLabel = 'Day(s)';
      } else if (loan.repaymentType === 'Weekly') {
        periodsElapsed = Math.floor(diffDays / 7);
        periodLabel = 'Week(s)';
      } else if (loan.repaymentType === '10 Days') {
        periodsElapsed = Math.floor(diffDays / 10);
        periodLabel = 'Period(s)';
      } else if (loan.repaymentType === 'Monthly') {
        let months = (nowMidnight.getFullYear() - givenDateMidnight.getFullYear()) * 12;
        months -= givenDateMidnight.getMonth();
        months += nowMidnight.getMonth();
        if (nowMidnight.getDate() < givenDateMidnight.getDate()) {
          months--;
        }
        periodsElapsed = Math.max(0, months);
        periodLabel = 'Month(s)';
      }

      const actualPayments = loan.payments?.length || 0;
      const hasInitialPayment = actualPayments > 0;
      const expectedPayments = (hasInitialPayment ? 1 : 0) + periodsElapsed;
      const pendingCount = expectedPayments - actualPayments;

      if (pendingCount > 0) {
        pendingNotifications.push({
          id: loan.customer.id,
          loanId: loan.id,
          name: loan.customer.name,
          phone: loan.customer.phone,
          pendingDetails: `${pendingCount} ${periodLabel} Pending`,
          pendingCount,
          remainingBalance: loan.remainingPrincipal,
          loanAmount: loan.principalAmount,
          repaymentType: loan.repaymentType,
          loanGivenDate: loan.loanGivenDate
        });
      }
    }

    res.json({
      count: pendingNotifications.length,
      notifications: pendingNotifications
    });
  } catch (error) {
    console.error('Failed to fetch pending notifications:', error);
    res.status(500).json({ error: 'Failed to fetch pending notifications' });
  }
});

// --- CUSTOMERS API ---
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        loans: {
          orderBy: { loanGivenDate: 'desc' },
          take: 1,
          include: { _count: { select: { payments: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(customers.map((customer) => {
      const loan = customer.loans[0];
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        location: customer.location || 'N/A',
        status: customer.status,
        loanAmount: loan?.principalAmount ?? 0,
        remainingBalance: loan?.remainingPrincipal ?? 0,
        repaymentType: loan?.repaymentType ?? 'N/A',
        interestRate: loan?.interestRate ?? 0,
        interestType: loan?.interestType ?? 'Monthly',
        loanGivenDate: loan?.loanGivenDate ?? null,
        paymentsCount: loan?._count.payments ?? 0,
      };
    }));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, location, aadharNumber, loanAmount, repaymentType, loanGivenDate, interestRate, interestType } = req.body;
    const parsedLoanAmount = Number(loanAmount) || 0;
    const parsedInterestRate = Number(interestRate) || 0;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || 'N/A',
        location: location?.trim() || null,
        aadharNumber: aadharNumber?.trim() || null,
      },
    });

    if (parsedLoanAmount > 0) {
      const initialInterest = (parsedLoanAmount * parsedInterestRate) / 100;
      const loanDate = parseLoanOrPaymentDate(loanGivenDate);

      const loan = await prisma.loan.create({
        data: {
          customerId: customer.id,
          principalAmount: parsedLoanAmount,
          remainingPrincipal: parsedLoanAmount,
          interestRate: parsedInterestRate,
          interestType: interestType || 'Monthly',
          repaymentType: repaymentType || 'Monthly',
          loanGivenDate: loanDate,
        },
      });

      // Crucial Logic: Create the First Payment Record (Type: First Auto Interest, Date: Loan Given Date, Principal Paid: 0, Total Paid: Calculated Interest)
      if (initialInterest > 0) {
        await prisma.payment.create({
          data: {
            loanId: loan.id,
            customerId: customer.id,
            amount: initialInterest,
            principalPaid: 0,
            interestPaid: initialInterest,
            paymentType: 'First Auto Interest',
            paymentDate: loanDate,
            status: 'Completed'
          }
        });
      }
    }

    const newCustomer = await prisma.customer.findUnique({
      where: { id: customer.id },
      include: { loans: { include: { _count: { select: { payments: true } } } } },
    });

    const loan = newCustomer.loans[0];
    res.status(201).json({
      id: newCustomer.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      location: newCustomer.location || 'N/A',
      aadharNumber: newCustomer.aadharNumber,
      status: newCustomer.status,
      loanAmount: loan?.principalAmount ?? 0,
      remainingBalance: loan?.remainingPrincipal ?? 0,
      repaymentType: loan?.repaymentType ?? 'N/A',
      loanGivenDate: loan?.loanGivenDate ?? null,
      paymentsCount: loan?._count.payments ?? 0,
    });
  } catch (error) {
    console.error('Failed to create customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await prisma.payment.deleteMany({ where: { customerId: req.params.id } });
    await prisma.loan.deleteMany({ where: { customerId: req.params.id } });
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, phone, location, aadharNumber } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || 'N/A',
        location: location?.trim() || null,
        aadharNumber: aadharNumber?.trim() || null,
      },
      include: {
        loans: {
          orderBy: { loanGivenDate: 'desc' },
          take: 1,
          include: { _count: { select: { payments: true } } },
        },
      }
    });

    const loan = updatedCustomer.loans[0];
    res.json({
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      phone: updatedCustomer.phone,
      location: updatedCustomer.location || 'N/A',
      aadharNumber: updatedCustomer.aadharNumber,
      status: updatedCustomer.status,
      loanAmount: loan?.principalAmount ?? 0,
      remainingBalance: loan?.remainingPrincipal ?? 0,
      repaymentType: loan?.repaymentType ?? 'N/A',
      loanGivenDate: loan?.loanGivenDate ?? null,
      paymentsCount: loan?._count.payments ?? 0,
    });
  } catch (error) {
    console.error('Failed to update customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        loans: {
          orderBy: { loanGivenDate: 'desc' },
          take: 1, // Get the most recent loan
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' }
            }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const loan = customer.loans[0];

    let formattedLoan = null;
    let paymentHistory = [];

    if (loan) {
      formattedLoan = {
        loanId: loan.id,
        principalAmount: loan.principalAmount,
        interestType: loan.interestType,
        interestRate: loan.interestRate,
        remainingPrincipal: loan.remainingPrincipal,
        startDate: new Date(loan.loanGivenDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
        status: loan.status
      };

      paymentHistory = loan.payments.map(p => ({
        id: p.id,
        date: getEffectiveDate(p.paymentDate, p.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        rawDate: p.paymentDate,
        totalPaid: p.amount,
        interestPart: p.interestPaid,
        principalPart: p.principalPaid,
        mode: p.paymentType,
        status: p.status
      }));
    }

    res.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      altPhone: 'N/A',
      location: customer.location || 'N/A',
      address: customer.location || 'N/A',
      occupation: 'Not Provided',
      aadharNumber: customer.aadharNumber || 'Not Provided',
      panNumber: 'Not Provided',
      status: customer.status,
      joinedDate: new Date(customer.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
      loan: formattedLoan,
      paymentHistory: paymentHistory
    });
  } catch (error) {
    console.error('Failed to fetch customer profile:', error);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// --- LOANS API ---
app.get('/api/loans', async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        customer: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

app.post('/api/loans', async (req, res) => {
  try {
    const { customerId, principalAmount, interestRate, interestType, repaymentType, loanGivenDate } = req.body;
    const parsedPrincipal = Number(principalAmount) || 0;
    const parsedRate = Number(interestRate) || 0;
    const loanDate = parseLoanOrPaymentDate(loanGivenDate);

    const newLoan = await prisma.loan.create({
      data: {
        customerId,
        principalAmount: parsedPrincipal,
        remainingPrincipal: parsedPrincipal,
        interestRate: parsedRate,
        interestType: interestType || 'Monthly',
        repaymentType: repaymentType || 'Monthly',
        loanGivenDate: loanDate
      }
    });

    const initialInterest = (parsedPrincipal * parsedRate) / 100;
    if (initialInterest > 0) {
      await prisma.payment.create({
        data: {
          loanId: newLoan.id,
          customerId,
          amount: initialInterest,
          principalPaid: 0,
          interestPaid: initialInterest,
          paymentType: 'First Auto Interest',
          paymentDate: loanDate,
          status: 'Completed'
        }
      });
    }

    res.status(201).json(newLoan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

// --- PAYMENTS API ---
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: 50,
      include: {
        customer: { select: { name: true } },
        loan: { select: { principalAmount: true, repaymentType: true } }
      }
    });
    res.json(payments);
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { loanId, customerId, amount, principalPaid, interestPaid, paymentType, paymentDate } = req.body;

    const parsedAmount = Number(amount) || 0;
    const parsedPrincipal = Number(principalPaid) || 0;
    const parsedInterest = Number(interestPaid) || 0;
    const pDate = parseLoanOrPaymentDate(paymentDate);

    // 1. Create payment record
    const payment = await prisma.payment.create({
      data: {
        loanId,
        customerId,
        amount: parsedAmount,
        principalPaid: parsedPrincipal,
        interestPaid: parsedInterest,
        paymentType: paymentType || 'Interest + Principal',
        paymentDate: pDate
      }
    });

    // 2. Fetch the current loan to compute new balances safely
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new Error('Loan not found');

    const newPrincipal = Math.max(0, loan.remainingPrincipal - parsedPrincipal);
    const newInterest = Math.max(0, loan.interestDue - parsedInterest);
    const newStatus = newPrincipal === 0 ? 'Completed' : loan.status;

    // 3. Update loan remaining balance and status
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        remainingPrincipal: newPrincipal,
        interestDue: newInterest,
        status: newStatus
      }
    });

    res.status(201).json({ payment, updatedLoan });
  } catch (error) {
    console.error('Failed to process payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Serve frontend static build and handle SPA fallback for non-API routes (if dist folder exists)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


