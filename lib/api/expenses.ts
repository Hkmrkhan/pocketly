import { supabase } from '../supabase';
import { Expense, ExpenseCategory } from '@/types';

export const expenseService = {
  // Get all expenses for current user (sorted by latest first)
  getExpenses: async (userId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Expense[];
  },

  // Add new expense
  addExpense: async (
    userId: string,
    amount: number,
    description: string,
    category: ExpenseCategory
  ) => {
    // Store amount in USD (no conversion)
    
    console.log('ExpenseService - Adding expense with data:', {
      user_id: userId,
      amount: amount,
      description,
      category,
    });

    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          user_id: userId,
          amount: amount,
          description,
          category,
        },
      ])
      .select()
      .single();
    
    if (error) {
      console.error('ExpenseService - Error adding expense:', error);
      throw error;
    }
    
    console.log('ExpenseService - Expense added successfully:', data);
    return data as Expense;
  },

  // Update existing expense
  updateExpense: async (
    expenseId: string,
    updates: {
      amount?: number;
      description?: string;
      category?: ExpenseCategory;
    }
  ) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Expense;
  },

  // Delete expense
  deleteExpense: async (expenseId: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    
    if (error) throw error;
  },

  // Get total balance (sum of all expenses)
  getTotalBalance: async (userId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const total = data.reduce((sum, expense) => sum + expense.amount, 0);
    return total;
  },

  // Get expenses by category
  getExpensesByCategory: async (userId: string, category: ExpenseCategory) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Expense[];
  },

  // Get expenses for a specific date range
  getExpensesByDateRange: async (
    userId: string,
    startDate: string,
    endDate: string
  ) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Expense[];
  },
};
