import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ExpenseSummaryProps {
  expenses: Expense[];
  onFilterChange?: (filteredExpenses: Expense[], filterType: 'all' | 'month' | 'date') => void;
  currency?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CURRENCY_RATES: {[key: string]: number} = {
  USD: 1,
  EUR: 0.91,
  GBP: 0.78,
  PKR: 278
};

const convertAmount = (amount: number, toCurrency: string): number => {
  // Amount is stored in USD, convert to target currency
  if (toCurrency === 'USD') return amount;
  return amount * CURRENCY_RATES[toCurrency];
};

export function ExpenseSummary({ expenses, onFilterChange, currency = 'USD' }: ExpenseSummaryProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>('date');

  const summary = useMemo(() => {
    // Total is always all expenses (static)
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCount = expenses.length;

    // Month card always shows selected month (default: current month)
    const monthFilteredExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.created_at);
      return expenseDate.getMonth() === selectedMonth;
    });
    const monthAmount = monthFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthCount = monthFilteredExpenses.length;

    // Date card always shows selected date (default: today)
    const dateStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);
    const dateFilteredExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.created_at);
      return expenseDate >= dateStart && expenseDate < dateEnd;
    });
    const dateAmount = dateFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const dateCount = dateFilteredExpenses.length;

    return {
      total,
      totalCount,
      monthAmount,
      monthCount,
      dateAmount,
      dateCount,
      monthFilteredExpenses,
      dateFilteredExpenses,
    };
  }, [expenses, selectedMonth, selectedDate]);

  // Notify parent when filter changes
  useEffect(() => {
    if (onFilterChange) {
      if (filterType === 'month') {
        onFilterChange(summary.monthFilteredExpenses, 'month');
      } else if (filterType === 'date') {
        onFilterChange(summary.dateFilteredExpenses, 'date');
      } else {
        onFilterChange(expenses, 'all');
      }
    }
  }, [filterType, summary.monthFilteredExpenses, summary.dateFilteredExpenses, expenses, onFilterChange]);

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setFilterType('month');
    setShowMonthModal(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      // Only allow dates from selected month
      if (date.getMonth() === selectedMonth) {
        setSelectedDate(date);
        setFilterType('date');
      }
    }
  };

  const handleClearFilter = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedDate(now);
    setFilterType('date');
  };

  const currencySymbol = currency === 'PKR' ? 'Rs.' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  return (
    <View style={styles.container}>
      {/* Total Expenses Card - STATIC (never changes) */}
      <View style={[styles.card, styles.totalCard]}>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Total Expenses</Text>
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{currencySymbol} {convertAmount(summary.total, currency).toFixed(2)}</Text>
          <Text style={styles.count}>{summary.totalCount} transactions</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={24} color="rgba(255, 255, 255, 0.8)" />
        </View>
      </View>

      <View style={styles.row}>
        {/* Month Card - Clickable */}
        <TouchableOpacity 
          style={[styles.card, styles.smallCard, styles.todayCard]}
          onPress={() => setShowMonthModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.textContainer}>
            <Text style={styles.smallLabel} numberOfLines={1}>
              {MONTHS[selectedMonth]}
            </Text>
            <Text style={styles.smallAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {currencySymbol} {convertAmount(summary.monthAmount, currency).toFixed(2)}
            </Text>
            <Text style={styles.smallCount}>
              {summary.monthCount} items
            </Text>
          </View>
        </TouchableOpacity>

        {/* Date Card - Clickable (only if month selected) */}
        <TouchableOpacity 
          style={[
            styles.card, 
            styles.smallCard, 
            styles.monthCard
          ]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.textContainer}>
            <Text style={styles.smallLabel} numberOfLines={1}>
              {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </Text>
            <Text style={styles.smallAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {currencySymbol} {convertAmount(summary.dateAmount, currency).toFixed(2)}
            </Text>
            <Text style={styles.smallCount}>
              {summary.dateCount} items
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Clear Filter Button - Show when not on default (today) */}
      {(selectedDate.toDateString() !== new Date().toDateString() || selectedMonth !== new Date().getMonth()) && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearFilter}>
          <Ionicons name="refresh" size={18} color="#4CAF50" />
          <Text style={styles.clearButtonText}>Reset to Today</Text>
        </TouchableOpacity>
      )}

      {/* Month Selection Modal */}
      <Modal
        visible={showMonthModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {MONTHS.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthItem,
                    selectedMonth === index && styles.selectedMonthItem
                  ]}
                  onPress={() => handleMonthSelect(index)}
                >
                  <Text style={[
                    styles.monthText,
                    selectedMonth === index && styles.selectedMonthText
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 20,
    marginTop: -35,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 26,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  totalCard: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 150,
  },
  todayCard: {
    backgroundColor: '#10b981',
    minHeight: 120,
  },
  monthCard: {
    backgroundColor: '#f59e0b',
    minHeight: 120,
  },
  disabledCard: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  smallCard: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  smallLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  smallAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  smallCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  clearButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  monthItem: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedMonthItem: {
    backgroundColor: '#4CAF50',
  },
  monthText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMonthText: {
    color: '#fff',
    fontWeight: '600',
  },
});
