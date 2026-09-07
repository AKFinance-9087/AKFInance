import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    padding: 6,
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8
  },
  label: {
    width: 150,
    fontSize: 10,
    color: '#64748b'
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#0f172a',
    fontWeight: 'medium'
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#cbd5e1'
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableColHeader: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    padding: 5
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#cbd5e1',
    padding: 5
  },
  tableCellHeader: {
    margin: 'auto',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155'
  },
  tableCell: {
    margin: 'auto',
    fontSize: 9,
    color: '#475569'
  }
});

const formatPDFDate = (payment) => {
  const raw = payment?.rawDate || payment?.date;
  if (!raw) return payment?.date || '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return payment?.date || '';
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const CustomerStatementPDF = ({ customer }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AK Finance</Text>
          <Text style={styles.headerSubtitle}>Customer Statement</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerSubtitle}>Date: {new Date().toLocaleDateString()}</Text>
          <Text style={styles.headerSubtitle}>Customer ID: {customer.id}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{customer.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{customer.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{customer.address || customer.location}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Aadhar Number</Text>
          <Text style={styles.value}>{customer.aadharNumber || 'N/A'}</Text>
        </View>
      </View>

      {customer.loan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Principal Amount</Text>
            <Text style={styles.value}>Rs. {customer.loan.principalAmount?.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Interest Rate</Text>
            <Text style={styles.value}>{customer.loan.interestRate}% ({customer.loan.interestType})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Remaining Balance</Text>
            <Text style={styles.value}>Rs. {customer.loan.remainingPrincipal?.toLocaleString()}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableColHeader, width: '25%' }}>
              <Text style={styles.tableCellHeader}>Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Mode</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Interest</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Principal</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Total Paid</Text>
            </View>
          </View>

          {customer.paymentHistory && customer.paymentHistory.map((payment) => (
            <View style={styles.tableRow} key={payment.id}>
              <View style={{ ...styles.tableCol, width: '25%' }}>
                <Text style={styles.tableCell}>{formatPDFDate(payment)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{payment.mode}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Rs. {payment.interestPart?.toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Rs. {payment.principalPart?.toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Rs. {payment.totalPaid?.toLocaleString()}</Text>
              </View>
            </View>
          ))}
          
          {(!customer.paymentHistory || customer.paymentHistory.length === 0) && (
            <View style={styles.tableRow}>
              <View style={{ ...styles.tableCol, width: '100%' }}>
                <Text style={styles.tableCell}>No payments recorded.</Text>
              </View>
            </View>
          )}
        </View>
      </View>

    </Page>
  </Document>
);
