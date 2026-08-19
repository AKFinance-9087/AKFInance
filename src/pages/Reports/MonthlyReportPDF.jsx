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
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    padding: 8,
    marginBottom: 10
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  summaryBox: {
    width: '30%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
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
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    padding: 6
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#cbd5e1',
    padding: 6
  },
  tableColHeaderSmall: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    padding: 6
  },
  tableColSmall: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#cbd5e1',
    padding: 6
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

export const MonthlyReportPDF = ({ data, totalDisbursed, totalCollected, totalInterest }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AK Finance</Text>
          <Text style={styles.headerSubtitle}>Monthly Financial Report</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerSubtitle}>Generated On: {new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Summary</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Disbursed</Text>
            <Text style={styles.summaryValue}>Rs. {totalDisbursed.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Collected</Text>
            <Text style={styles.summaryValue}>Rs. {totalCollected.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Interest Collected</Text>
            <Text style={styles.summaryValue}>Rs. {totalInterest.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Week</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Disbursed</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Collected</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Interest</Text>
            </View>
          </View>

          {data.monthlyData.map((week, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{week.name}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Rs. {week.disbursed.toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Rs. {week.collected.toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Rs. {week.interest?.toLocaleString() || 0}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeaderSmall}>
              <Text style={styles.tableCellHeader}>ID</Text>
            </View>
            <View style={styles.tableColHeaderSmall}>
              <Text style={styles.tableCellHeader}>Type</Text>
            </View>
            <View style={styles.tableColHeaderSmall}>
              <Text style={styles.tableCellHeader}>Customer</Text>
            </View>
            <View style={styles.tableColHeaderSmall}>
              <Text style={styles.tableCellHeader}>Date</Text>
            </View>
            <View style={styles.tableColHeaderSmall}>
              <Text style={styles.tableCellHeader}>Amount</Text>
            </View>
          </View>

          {data.recentTransactions.map((trx) => (
            <View style={styles.tableRow} key={trx.id}>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{trx.id}</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{trx.type}</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{trx.customer}</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{trx.date}</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>Rs. {trx.amount.toLocaleString()}</Text>
              </View>
            </View>
          ))}
          
          {data.recentTransactions.length === 0 && (
            <View style={styles.tableRow}>
              <View style={{ ...styles.tableCol, width: '100%' }}>
                <Text style={styles.tableCell}>No recent transactions.</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Page>
  </Document>
);
