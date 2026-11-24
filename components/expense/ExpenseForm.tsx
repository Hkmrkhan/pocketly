import React, { useState } from 'react';
import { View, StyleSheet, Alert, TextInput, TouchableOpacity, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ExpenseCategory } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface ExpenseFormProps {
  onSubmit: (amount: number, description: string, category: ExpenseCategory) => void;
  loading: boolean;
  onClose?: () => void;
  currency?: string; // NEW: currency prop for dynamic symbol
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, loading, onClose, currency = 'USD' }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');

  // Get currency symbol based on currency code
  const getCurrencySymbol = (curr: string): string => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      PKR: 'Rs.',
    };
    return symbols[curr] || '$';
  };

  const handleClose = () => {
    // Clear all fields
    setAmount('');
    setDescription('');
    setCategory('Food');
    // Call onClose if provided
    if (onClose) {
      onClose();
    }
  };

  const categories: ExpenseCategory[] = [
    'Food',
    'Transport',
    'Shopping',
    'Bills',
    'Entertainment',
    'Health',
    'Other',
  ];

  const getCategoryIcon = (cat: string) => {
    const icons: { [key: string]: string } = {
      Food: '🍔',
      Transport: '🚗',
      Shopping: '🛍️',
      Bills: '💡',
      Entertainment: '🎬',
      Health: '💊',
      Other: '📝',
    };
    return icons[cat] || '📝';
  };

  const getCategoryDisplayName = (cat: string) => {
    return cat;
  };

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Invalid Input', 'Please enter a description');
      return;
    }

    // Show confirmation popup
    Alert.alert(
      'Add Expense',
      'Are you sure you want to add this expense?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {
            // Clear all fields when No is pressed
            setAmount('');
            setDescription('');
            setCategory('Food');
          }
        },
        {
          text: 'Yes',
          onPress: () => {
            onSubmit(amountNum, description.trim(), category);

            // Reset form
            setAmount('');
            setDescription('');
            setCategory('Food');
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerText}>New Expense</Text>
                <Text style={styles.headerSubtext}>Track your spending wisely 💫</Text>
              </View>
              {onClose && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.decorativeShape} />
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconCircle}>
                <Text style={styles.currencySymbol}>{getCurrencySymbol(currency)}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconCircle}>
                <Ionicons name="pencil" size={20} color="#4CAF50" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g., Lunch, Groceries, Gas"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* Category Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Category</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.categoryEmojiContainer}>
                <Text style={styles.categoryEmoji}>{getCategoryIcon(category)}</Text>
              </View>
              <Picker
                selectedValue={category}
                onValueChange={(value) => setCategory(value)}
                style={styles.picker}
              >
                {categories.map((cat) => (
                  <Picker.Item
                    key={cat}
                    label={`${getCategoryIcon(cat)} ${getCategoryDisplayName(cat)}`}
                    value={cat}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonIconContainer}>
                <Ionicons name={loading ? "hourglass" : "checkmark-circle"} size={28} color="#fff" />
              </View>
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving...' : 'Add Expense'}
              </Text>
            </View>
            <View style={styles.buttonShine} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 24,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 26,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -59,
  },
  decorativeShape: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 10,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#1f2937',
    paddingVertical: 16,
    marginLeft: 12,
    fontWeight: '600',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingLeft: 18,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  picker: {
    flex: 1,
    height: 58,
    color: '#1f2937',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 28,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  buttonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
