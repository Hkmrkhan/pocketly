// Database Types
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  created_at: string;
}

export type ExpenseCategory = 
  | 'Food' 
  | 'Transport' 
  | 'Shopping' 
  | 'Bills' 
  | 'Entertainment' 
  | 'Health' 
  | 'Other';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Form Types
export interface ExpenseFormData {
  amount: string;
  description: string;
  category: ExpenseCategory;
}
