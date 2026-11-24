import React from 'react';
import { FlatList, StyleSheet, View, Animated, Text } from 'react-native';
import { Expense, ExpenseCategory } from '../../types';
import { ExpenseCard } from './ExpenseCard';

interface ExpenseListProps {
  expenses: Expense[];
  allExpenses?: Expense[];
  filterType?: 'all' | 'month' | 'date';
  onDelete: (id: string) => void;
  onEdit?: (id: string, amount: number, description: string, category: ExpenseCategory) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ReactElement;
  currency?: string;
}

const AnimatedExpenseCard: React.FC<{ expense: Expense; onDelete: (id: string) => void; onEdit?: (id: string, amount: number, description: string, category: ExpenseCategory) => void; index: number; filterType?: 'all' | 'month' | 'date'; currency?: string }> = ({ 
  expense, 
  onDelete,
  onEdit, 
  index,
  filterType,
  currency = 'USD'
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100, // Stagger animation
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <ExpenseCard expense={expense} onDelete={onDelete} onEdit={onEdit} filterType={filterType} currency={currency} />
    </Animated.View>
  );
};

export const ExpenseList: React.FC<ExpenseListProps> = ({ 
  expenses, 
  allExpenses,
  filterType = 'date',
  onDelete,
  onEdit,
  refreshing = false,
  onRefresh,
  ListHeaderComponent,
  currency = 'USD',
}) => {
  // Only show empty state if there are truly no expenses at all
  const hasNoExpenses = (allExpenses || expenses).length === 0;
  
  // Dynamic message based on filter type
  const getEmptyFilterMessage = () => {
    switch (filterType) {
      case 'month':
        return 'No expenses for this month';
      case 'date':
        return 'No expenses for this date';
      case 'all':
        return 'No expenses found';
      default:
        return 'No expenses for this filter';
    }
  };
  
  const getEmptyFilterSubtext = () => {
    switch (filterType) {
      case 'month':
        return 'Try selecting a different month';
      case 'date':
        return 'Try selecting a different date';
      case 'all':
        return 'Start by adding your first expense';
      default:
        return 'Try selecting a different month or date';
    }
  };
  
  if (hasNoExpenses) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>💸</Text>
          </View>
          <View style={styles.shimmerCircle1} />
          <View style={styles.shimmerCircle2} />
        </View>
        <Text style={styles.emptyText}>No expenses yet</Text>
        <Text style={styles.emptySubtext}>Tap the + button below to add your first expense</Text>
        <View style={styles.decorativeDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={expenses}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <AnimatedExpenseCard expense={item} onDelete={onDelete} onEdit={onEdit} index={index} filterType={filterType} currency={currency} />
      )}
      ListHeaderComponent={ListHeaderComponent}
      stickyHeaderIndices={ListHeaderComponent ? [0] : []}
      ListEmptyComponent={
        <View style={styles.emptyFilterContainer}>
          <Text style={styles.emptyFilterIcon}>📭</Text>
          <Text style={styles.emptyFilterText}>{getEmptyFilterMessage()}</Text>
          <Text style={styles.emptyFilterSubtext}>{getEmptyFilterSubtext()}</Text>
        </View>
      }
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      style={styles.flatListStyle}
    />
  );
};

const styles = StyleSheet.create({
  flatListStyle: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 110,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 80,
    backgroundColor: '#F5F7FA',
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
    position: 'relative',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#f0f0ff',
  },
  shimmerCircle1: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    top: 5,
    left: 5,
  },
  shimmerCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
    top: 0,
    left: 0,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 280,
    marginBottom: 40,
  },
  decorativeDots: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot1: {
    backgroundColor: '#6366f1',
  },
  dot2: {
    backgroundColor: '#10b981',
  },
  dot3: {
    backgroundColor: '#f59e0b',
  },
  emptyFilterContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFilterIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyFilterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyFilterSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
