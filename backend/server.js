import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './postgresql.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
      prisma.payment.findMany({ select: { paymentDate: true, amount: true } }),
      prisma.loan.findMany({ select: { loanGivenDate: true, principalAmount: true } })
    ]);

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
      date: new Date(p.paymentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
        remainingPrincipal: remainingPrincipalAgg._sum.remainingPrincipal || 0,
        totalInterestEarned: totalInterestAgg._sum.interestPaid || 0,
        activeCustomers: activeCustomersCount || 0
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
    
    // --- WEEKLY DATA (Last 7 Days) ---
    const weeklyData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayName = days[d.getDay()];
      
      const collected = payments
        .filter(p => {
          const pd = new Date(p.paymentDate);
          return pd.getDate() === d.getDate() && pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        })
        .reduce((sum, p) => sum + p.amount, 0);
        
      const disbursed = loans
        .filter(l => {
          const ld = new Date(l.loanGivenDate);
          return ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
        })
        .reduce((sum, l) => sum + l.principalAmount, 0);
        
      weeklyData.push({ name: dayName, disbursed, collected });
    }

    // --- MONTHLY DATA (Last 6 Months) ---
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      
      const collected = payments
        .filter(p => {
          const pd = new Date(p.paymentDate);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === year;
        })
        .reduce((sum, p) => sum + p.amount, 0);
        
      const disbursed = loans
        .filter(l => {
          const ld = new Date(l.loanGivenDate);
          return ld.getMonth() === d.getMonth() && ld.getFullYear() === year;
        })
        .reduce((sum, l) => sum + l.principalAmount, 0);
        
      monthlyData.push({ name: monthName, disbursed, collected });
    }

    // --- RECENT TRANSACTIONS ---
    const formattedPayments = payments.map(p => ({
      id: `PAY-${p.id.substring(0,6).toUpperCase()}`,
      type: 'Collected',
      customer: p.customer?.name || 'Unknown',
      amount: p.amount,
      rawDate: new Date(p.paymentDate)
    }));
    
    const formattedLoans = loans.map(l => ({
      id: `LOAN-${l.id.substring(0,6).toUpperCase()}`,
      type: 'Disbursed',
      customer: l.customer?.name || 'Unknown',
      amount: l.principalAmount,
      rawDate: new Date(l.loanGivenDate)
    }));
    
    const recentTransactions = [...formattedPayments, ...formattedLoans]
      .sort((a, b) => b.rawDate - a.rawDate)
      .slice(0, 50)
      .map(t => ({
        id: t.id,
        type: t.type,
        customer: t.customer,
        amount: t.amount,
        date: t.rawDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }));

    res.json({
      weeklyData,
      monthlyData,
      recentTransactions
    });

  } catch (error) {
    console.error('Failed to fetch reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
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
      await prisma.loan.create({
        data: {
          customerId: customer.id,
          principalAmount: parsedLoanAmount,
          remainingPrincipal: parsedLoanAmount,
          interestRate: parsedInterestRate,
          interestType: interestType || 'Monthly',
          repaymentType: repaymentType || 'Monthly',
          loanGivenDate: loanGivenDate ? new Date(loanGivenDate) : new Date(),
        },
      });
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
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { customerId: req.params.id } }),
      prisma.loan.deleteMany({ where: { customerId: req.params.id } }),
      prisma.customer.delete({ where: { id: req.params.id } }),
    ], { maxWait: 15000, timeout: 25000 });
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
        date: new Date(p.paymentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
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
      altPhone: 'N/A', // Not in DB
      location: customer.location || 'N/A',
      address: customer.location || 'N/A', // Using location as address
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
      }
    });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

app.post('/api/loans', async (req, res) => {
  try {
    const { customerId, principalAmount, interestRate, interestType, repaymentType, loanGivenDate } = req.body;
    const newLoan = await prisma.loan.create({
      data: {
        customerId,
        principalAmount,
        remainingPrincipal: principalAmount,
        interestRate,
        interestType,
        repaymentType,
        loanGivenDate: new Date(loanGivenDate)
      }
    });
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
    
    // We should do this in a transaction to ensure data consistency
    // 1. Create payment record
    const payment = await prisma.payment.create({
      data: {
        loanId,
        customerId,
        amount,
        principalPaid,
        interestPaid,
        paymentType,
        ...(paymentDate && { paymentDate: new Date(paymentDate) })
      }
    });

    // 2. Fetch the current loan to compute new balances safely
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new Error('Loan not found');

    const newPrincipal = Math.max(0, loan.remainingPrincipal - principalPaid);
    const newInterest = Math.max(0, loan.interestDue - interestPaid);
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

    const result = { payment, updatedLoan };

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
