import prisma from './postgresql.js';

async function test() {
  try {
    const newCustomer = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: 'Test Harish',
          phone: '7708035227',
          location: 'VNR',
          aadharNumber: null,
        },
      });

      await tx.loan.create({
        data: {
          customerId: customer.id,
          principalAmount: 5000,
          remainingPrincipal: 5000,
          interestRate: 10,
          interestType: 'Monthly',
          repaymentType: 'Monthly',
          loanGivenDate: new Date('2026-08-16'),
        },
      });

      return tx.customer.findUnique({
        where: { id: customer.id },
        include: { loans: { include: { _count: { select: { payments: true } } } } },
      });
    });
    console.log("Success", newCustomer);
  } catch (err) {
    console.error("Prisma Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
