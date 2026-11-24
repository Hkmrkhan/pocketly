import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate, getCategoryEmoji } from '../../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: any } = {
    Food: { backgroundColor: '#fef3c7' },
    Transport: { backgroundColor: '#dbeafe' },
    Shopping: { backgroundColor: '#fce7f3' },
    Bills: { backgroundColor: '#ddd6fe' },
    Entertainment: { backgroundColor: '#fce7f3' },
    Health: { backgroundColor: '#dcfce7' },
    Other: { backgroundColor: '#e5e7eb' },
  };
  return colors[category] || colors.Other;
};

interface ExpenseCardProps {
  expense: Expense;
  filterType?: 'all' | 'month' | 'date';
  onDelete: (id: string) => void;
  onEdit?: (id: string, amount: number, description: string, category: ExpenseCategory) => void;
  currency?: string;
}

const CURRENCY_RATES: { [key: string]: number } = {
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

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, filterType = 'date', onDelete, onEdit, currency = 'USD' }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editAmount, setEditAmount] = useState(expense.amount.toString());
  const [editDescription, setEditDescription] = useState(expense.description);
  const [editCategory, setEditCategory] = useState<ExpenseCategory>(expense.category);

  const handleDelete = () => {
    console.log('🗑️ Delete button clicked for expense:', expense
      .id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    console.log('✅ Deleting expense:', expense.id);
    setShowDeleteModal(false);
    onDelete(expense.id);
  };

  const cancelDelete = () => {
    console.log('❌ Delete cancelled');
    setShowDeleteModal(false);
  };

  const handleEdit = () => {
    // Convert amount to selected currency for editing
    const convertedAmount = convertAmount(expense.amount, currency);
    setEditAmount(convertedAmount.toFixed(2));
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!editDescription.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (onEdit) {
      // Convert amount back to USD for storage
      const amountInUSD = currency === 'USD' ? amount : amount / CURRENCY_RATES[currency];
      onEdit(expense.id, amountInUSD, editDescription, editCategory);
    }
    setShowEditModal(false);
  };

  const categories: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

  const convertedAmount = convertAmount(expense.amount, currency);
  const currencySymbol = currency === 'PKR' ? 'Rs.' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  return (
    <>
      <View style={styles.card}>
        {/* Left Section (Clickable for Edit) */}
        <TouchableOpacity
          style={styles.mainClickArea}
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <View style={[styles.emojiContainer, getCategoryColor(expense.category)]}>
            <Text style={styles.emoji}>{getCategoryEmoji(expense.category)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.description} numberOfLines={1}>{expense.description}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{expense.category}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.date}>{formatDate(expense.created_at, filterType)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right Section (Amount + Delete Button) */}
        <View style={styles.rightSection}>
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>{currencySymbol} {convertedAmount.toFixed(2)}</Text>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            activeOpacity={0.6}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Expense</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <Text style={styles.label}>Amount ({currencySymbol})</Text>
              <TextInput
                style={styles.input}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="What did you spend on?"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      editCategory === cat && styles.categoryChipActive
                    ]}
                    onPress={() => setEditCategory(cat)}
                  >
                    <Text style={styles.categoryEmoji}>{getCategoryEmoji(cat)}</Text>
                    <Text style={[
                      styles.categoryText,
                      editCategory === cat && styles.categoryTextActive
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="warning" size={48} color="#e74c3c" />
            </View>

            <Text style={styles.deleteModalTitle}>Delete Expense?</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete this expense? This action cannot be undone.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  mainClickArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emoji: {
    fontSize: 26,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  dot: {
    fontSize: 12,
    color: '#9ca3af',
    marginHorizontal: 8,
  },
  date: {
    fontSize: 14,
    color: '#9ca3af',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    maxWidth: '40%',
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    flexShrink: 1,
  },
  deleteButton: {
    backgroundColor: '#ffebee', // Soft red background
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  categoryChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  deleteIconContainer: {
    backgroundColor: '#fee',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
