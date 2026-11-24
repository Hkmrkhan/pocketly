import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform, StatusBar, ActivityIndicator, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { ExpenseList } from '@/components/expense/ExpenseList';
import { ExpenseSummary } from '@/components/expense/ExpenseSummary';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { expenseService } from '@/lib/api/expenses';
import { Expense } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useFocusEffect } from '@react-navigation/native';

type AuthMode = 'login' | 'signup' | 'onboarding' | 'welcome';

const CURRENCY_RATES: { [key: string]: number } = {
  USD: 1,
  EUR: 0.91,
  GBP: 0.78,
  PKR: 278
};

const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  // Amount is stored in USD, convert from USD to target currency
  const amountInUSD = fromCurrency === 'USD' ? amount : amount / CURRENCY_RATES[fromCurrency];
  return toCurrency === 'USD' ? amountInUSD : amountInUSD * CURRENCY_RATES[toCurrency];
};

// Get currency symbol
const getCurrencySymbol = (currency: string): string => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PKR: 'Rs.',
  };
  return symbols[currency] || '$';
};

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, updateProfile } = useAuth();
  const { setIsOnboarding } = useOnboarding();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>('date');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isNewUser, setIsNewUser] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventAmount, setEventAmount] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    if (user && !isNewUser) {
      loadExpenses();
    }
  }, [user, isNewUser]);

  // Load saved currency on mount
  useEffect(() => {
    loadSavedCurrency();
  }, []);

  const loadSavedCurrency = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedCurrency');
      if (saved) {
        setSelectedCurrency(saved);
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    try {
      setSelectedCurrency(currency);
      await AsyncStorage.setItem('selectedCurrency', currency);
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  // Configure navigation bar for compact dark icons
  useEffect(() => {
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync('#FFFFFF');
        await NavigationBar.setButtonStyleAsync('dark');
      }
    };
    setupNavigationBar();
  }, []);

  // Auto-filter expenses when they load (default: today's expenses)
  useEffect(() => {
    if (expenses.length > 0 && filteredExpenses.length === 0) {
      // Filter today's expenses by default
      const today = new Date();
      const dateStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const todayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.created_at);
        return expenseDate >= dateStart && expenseDate < dateEnd;
      });

      setFilteredExpenses(todayExpenses);
    }
  }, [expenses]);

  // Handle welcome screen timeout
  useEffect(() => {
    if (authMode === 'welcome' && user) {
      setIsOnboarding(true); // Hide navbar during welcome
      const timer = setTimeout(() => {
        setAuthMode('login');
        setIsOnboarding(false); // Show navbar after welcome
        loadExpenses();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [authMode, user]);

  // Hide navbar during onboarding
  useEffect(() => {
    if (authMode === 'onboarding') {
      setIsOnboarding(true);
    }
  }, [authMode]);

  // Close all modals when navigating away from this tab
  useFocusEffect(
    React.useCallback(() => {
      loadSavedCurrency(); // Reload currency when page comes into focus
      return () => {
        // Cleanup: close all modals when leaving this screen
        setShowForm(false);
        setShowUserMenu(false);
        setShowProfileModal(false);
        setShowCurrencyModal(false);
        setShowEventModal(false);
        setIsEditingProfile(false);
      };
    }, [])
  );

  const loadExpenses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await expenseService.getExpenses(user.id);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (amount: number, description: string, category: any) => {
    if (!user) return;

    try {
      // Convert amount from selected currency to USD for storage
      const amountInUSD = selectedCurrency === 'USD' ? amount : amount / CURRENCY_RATES[selectedCurrency];

      const newExpense = await expenseService.addExpense(
        user.id,
        amountInUSD,
        description,
        category
      );
      setExpenses([newExpense, ...expenses]);
      setShowForm(false);
      // Refresh the expenses list to ensure it's updated
      await loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await expenseService.deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleEditExpense = async (id: string, amount: number, description: string, category: any) => {
    if (!user) return;

    try {
      const updatedExpense = await expenseService.updateExpense(id, {
        amount,
        description,
        category,
      });
      setExpenses(expenses.map(e => e.id === id ? updatedExpense : e));
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleFilterChange = (filtered: Expense[], type: 'all' | 'month' | 'date') => {
    setFilteredExpenses(filtered);
    setFilterType(type);
  };

  if (!user && authMode !== 'onboarding' && authMode !== 'welcome') {
    if (authMode === 'login') {
      return <LoginForm onToggleMode={() => setAuthMode('signup')} />;
    } else if (authMode === 'signup') {
      return (
        <SignupForm
          onToggleMode={() => setAuthMode('login')}
          onSignupSuccess={() => {
            setIsNewUser(true);
            setAuthMode('onboarding');
          }}
        />
      );
    }
  }

  // Show onboarding for new users after signup
  if (isNewUser && authMode === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => {
          setIsNewUser(false);
          setAuthMode('welcome');
        }}
      />
    );
  }

  // Welcome screen after onboarding
  if (authMode === 'welcome' && user) {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <Ionicons name="checkmark-circle" size={100} color="#10b981" />
          <Text style={styles.welcomeTitle}>Welcome! 🎉</Text>
          <Text style={styles.welcomeSubtitle}>
            Your account is ready. Let's start tracking your expenses!
          </Text>
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.safeContainer, { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" translucent={false} />

      {showForm ? (
        <View style={styles.container}>
          <ScrollView style={styles.formWrapper}>
            <ExpenseForm
              onSubmit={handleAddExpense}
              loading={false}
              onClose={() => setShowForm(false)}
              currency={selectedCurrency}
            />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Professional Header with Gradient */}
          <View style={styles.headerWrapper}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View>
                  <Text style={styles.greeting}>Welcome, {user?.user_metadata?.first_name || 'User'}!</Text>
                  <Text style={styles.headerTitle}>My Expenses</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setShowUserMenu(!showUserMenu)}
                >
                  <View style={styles.iconWrapper}>
                    <Ionicons name="menu" size={24} color="#ffffff" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowUserMenu(false);
                  setShowProfileModal(true);
                }}
              >
                <Ionicons name="person-outline" size={20} color="#666" />
                <Text style={styles.menuItemText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowUserMenu(false);
                  setShowCurrencyModal(true);
                }}
              >
                <Ionicons name="cash-outline" size={20} color="#666" />
                <Text style={styles.menuItemText}>Currency Conversion</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowUserMenu(false);
                  setShowEventModal(true);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.menuItemText}>Event</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemButton]}
                onPress={() => {
                  setShowUserMenu(false);
                  signOut();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expense Summary - Now with top margin */}
          <View style={styles.summaryContainer}>
            <ExpenseSummary
              expenses={expenses}
              onFilterChange={handleFilterChange}
              currency={selectedCurrency}
            />
          </View>

          <ExpenseList
            expenses={filteredExpenses}
            allExpenses={expenses}
            filterType={filterType}
            onDelete={handleDeleteExpense}
            onEdit={handleEditExpense}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            currency={selectedCurrency}
          />

          {/* Floating Add Button */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setShowForm(true)}
            activeOpacity={0.85}
          >
            <View style={styles.floatingButtonGradient}>
              <Ionicons name="add" size={36} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Profile Modal */}
          <Modal
            visible={showProfileModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              setShowProfileModal(false);
              setIsEditingProfile(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Profile</Text>
                  <TouchableOpacity onPress={() => {
                    setShowProfileModal(false);
                    setIsEditingProfile(false);
                  }}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                {!isEditingProfile ? (
                  <View style={styles.profileInfo}>
                    <View style={styles.profileRow}>
                      <Ionicons name="person" size={20} color="#4CAF50" />
                      <Text style={styles.profileLabel}>Name:</Text>
                      <Text style={styles.profileValue}>{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</Text>
                    </View>
                    <View style={styles.profileRow}>
                      <Ionicons name="mail" size={20} color="#4CAF50" />
                      <Text style={styles.profileLabel}>Email:</Text>
                      <Text style={styles.profileValue}>{user?.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editProfileButton}
                      onPress={() => {
                        setEditFirstName(user?.user_metadata?.first_name || '');
                        setEditLastName(user?.user_metadata?.last_name || '');
                        setEditEmail(user?.email || '');
                        setIsEditingProfile(true);
                      }}
                    >
                      <Ionicons name="create-outline" size={20} color="#fff" />
                      <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView style={styles.editProfileForm}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="First Name"
                      value={editFirstName}
                      onChangeText={setEditFirstName}
                    />

                    <Text style={styles.inputLabel}>Last Name</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Last Name"
                      value={editLastName}
                      onChangeText={setEditLastName}
                    />

                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Email"
                      value={editEmail}
                      onChangeText={setEditEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <View style={styles.profileButtonRow}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setIsEditingProfile(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.saveButton}
                        style={styles.saveButton}
                        onPress={async () => {
                          if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
                            Alert.alert('Error', 'Please fill in all fields');
                            return;
                          }
                          try {
                            await updateProfile({
                              firstName: editFirstName.trim(),
                              lastName: editLastName.trim(),
                              email: editEmail.trim() !== user?.email ? editEmail.trim() : undefined
                            });

                            Alert.alert('Success', 'Profile updated successfully!' + (editEmail.trim() !== user?.email ? ' Please check your new email for a confirmation link.' : ''));
                            setIsEditingProfile(false);
                          } catch (error: any) {
                            Alert.alert('Error', error.message);
                          }
                        }}
                      >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* Currency Conversion Modal */}
          <Modal
            visible={showCurrencyModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowCurrencyModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Currency Conversion</Text>
                  <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.currencyLabel}>Select Currency </Text>
                <View style={styles.currencyGrid}>
                  {['USD', 'EUR', 'GBP', 'PKR'].map((currency) => {
                    const totalInUSD = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
                    const convertedAmount = convertAmount(totalInUSD, 'USD', currency);

                    return (
                      <TouchableOpacity
                        key={currency}
                        style={[styles.currencyCard, selectedCurrency === currency && styles.currencyCardSelected]}
                        onPress={() => {
                          handleCurrencyChange(currency);
                          setTimeout(() => setShowCurrencyModal(false), 300);
                        }}
                      >
                        <Text style={styles.currencyCode}>{currency}</Text>
                        <Text style={styles.currencyAmount}>{convertedAmount.toFixed(2)}</Text>
                        {selectedCurrency === currency && (
                          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.selectedIcon} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Modal>

          {/* Event Modal */}
          <Modal
            visible={showEventModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowEventModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Event</Text>
                  <TouchableOpacity onPress={() => setShowEventModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.eventForm}>
                  <Text style={styles.inputLabel}>Event Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter event name"
                    value={eventName}
                    onChangeText={setEventName}
                  />

                  <Text style={styles.inputLabel}>Amount ({getCurrencySymbol(selectedCurrency)})</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter amount"
                    value={eventAmount}
                    onChangeText={setEventAmount}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity
                    style={styles.eventSaveButton}
                    onPress={async () => {
                      if (!eventName || !eventAmount) {
                        Alert.alert('Error', 'Please fill in all required fields');
                        return;
                      }

                      try {
                        console.log('Saving event:', {
                          user_id: user?.id,
                          event_name: eventName.trim(),
                          amount: parseFloat(eventAmount),
                          event_date: new Date().toISOString().split('T')[0],
                        });

                        const { supabase } = await import('@/lib/supabase');

                        // Convert amount from selected currency to USD for storage
                        const amountInUSD = selectedCurrency === 'USD'
                          ? parseFloat(eventAmount)
                          : parseFloat(eventAmount) / CURRENCY_RATES[selectedCurrency];

                        const { data, error } = await supabase
                          .from('events')
                          .insert({
                            user_id: user?.id,
                            event_name: eventName.trim(),
                            amount: amountInUSD,
                            event_date: new Date().toISOString().split('T')[0],
                          })
                          .select();

                        if (error) {
                          console.error('Supabase error:', error);
                          throw error;
                        }

                        console.log('Event saved successfully:', data);
                        Alert.alert('Success', 'Event saved successfully!');
                        setEventName('');
                        setEventAmount('');
                        setShowEventModal(false);
                      } catch (error: any) {
                        console.error('Error saving event:', error);
                        Alert.alert('Error', error.message || 'Failed to save event');
                      }
                    }}
                  >
                    <Text style={styles.saveButtonText}>Save Event</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerWrapper: {
    backgroundColor: '#4CAF50',
    paddingBottom: 45,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 2,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  summaryContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  menuDropdown: {
    position: 'absolute',
    top: 105,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: 14,
  },
  menuItemButton: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 4,
  },
  menuItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  signOutText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    padding: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formWrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 18,
    borderWidth: 3.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  floatingButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileInfo: {
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 80,
  },
  profileValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  currencyCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyCardSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  currencyAmount: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  selectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  editProfileButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editProfileForm: {
    gap: 16,
  },
  profileButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventForm: {
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  eventSaveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
