import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import { expenseService } from '@/lib/api/expenses';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.user_metadata?.first_name || '');
  const [editLastName, setEditLastName] = useState(user?.user_metadata?.last_name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventAmount, setEventAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          }
        }
      ]
    );
  };

  // Close all modals when navigating away from this tab
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cleanup: close all modals when leaving this screen
        setShowForm(false);
        setShowEditModal(false);
        setShowUserMenu(false);
        setShowCurrencyModal(false);
        setShowEventModal(false);
      };
    }, [])
  );

  const handleAddExpense = async (amount: number, description: string, category: any) => {
    if (!user) return;

    try {
      await expenseService.addExpense(user.id, amount, description, category);
      Alert.alert('Success', 'Expense added successfully!');
      setShowForm(false);
      // Redirect to home page
      router.push('/(tabs)');
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleUpdateProfile = async () => {
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
      setShowEditModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={[styles.safeContainer, { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }]}>
      {showForm ? (
        <View style={styles.container}>
          <ScrollView style={styles.formWrapper}>
            <ExpenseForm
              onSubmit={handleAddExpense}
              loading={false}
              onClose={() => setShowForm(false)}
            />
          </ScrollView>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.headerWrapper}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View>
                  <Text style={styles.greeting}>Manage your account</Text>
                  <Text style={styles.headerTitle}>Profile</Text>
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
                onPress={async () => {
                  setShowUserMenu(false);
                  await signOut();
                  router.replace('/');
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={50} color="#667eea" />
                </View>
              </View>
              {user && (
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.user_metadata?.full_name || 'User'}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>

              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setEditFirstName(user?.user_metadata?.first_name || '');
                  setEditLastName(user?.user_metadata?.last_name || '');
                  setEditEmail(user?.email || '');
                  setShowEditModal(true);
                }}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="person-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>Edit Profile</Text>
                  <Text style={styles.menuItemSubtext}>Update your information</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuItem}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>Notifications</Text>
                  <Text style={styles.menuItemSubtext}>Manage your notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>

              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setIsDarkMode(!isDarkMode);
                  Alert.alert('Theme', `${!isDarkMode ? 'Dark' : 'Light'} mode ${!isDarkMode ? 'enabled' : 'disabled'}`);
                }}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={isDarkMode ? "sunny" : "moon-outline"} size={24} color="#4CAF50" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</Text>
                  <Text style={styles.menuItemSubtext}>{isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuItem}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="globe-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>Language</Text>
                  <Text style={styles.menuItemSubtext}>English</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>

              <TouchableOpacity style={styles.profileMenuItem}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="help-circle-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>Help & Support</Text>
                  <Text style={styles.menuItemSubtext}>Get help with the app</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuItem}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>About</Text>
                  <Text style={styles.menuItemSubtext}>Version 1.0.0</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Pocketly</Text>

            </View>
          </ScrollView>

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
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.currencyLabel}>Select Currency</Text>
                  <View style={styles.currencyGrid}>
                    {['USD', 'EUR', 'GBP', 'PKR'].map((currency) => (
                      <TouchableOpacity
                        key={currency}
                        style={[styles.currencyCard, selectedCurrency === currency && styles.currencyCardSelected]}
                        onPress={() => {
                          setSelectedCurrency(currency);
                          setTimeout(() => setShowCurrencyModal(false), 300);
                        }}
                      >
                        <Text style={styles.currencyCode}>{currency}</Text>
                        {selectedCurrency === currency && (
                          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.selectedIcon} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
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
                <ScrollView showsVerticalScrollIndicator={false} style={styles.eventForm}>
                  <Text style={styles.inputLabel}>Event Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter event name"
                    value={eventName}
                    onChangeText={setEventName}
                  />

                  <Text style={styles.inputLabel}>Amount</Text>
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

                        const { data, error } = await supabase
                          .from('events')
                          .insert({
                            user_id: user?.id,
                            event_name: eventName.trim(),
                            amount: parseFloat(eventAmount),
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

          {/* Edit Profile Modal */}
          <Modal
            visible={showEditModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => setShowEditModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
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
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleUpdateProfile}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 120,
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
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
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
  profileHeader: {
    backgroundColor: '#fff',
    paddingTop: 64,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemSubtext: {
    fontSize: 13,
    color: '#999',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#ccc',
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
  eventForm: {
    paddingBottom: 20,
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
  formWrapper: {
    flex: 1,
    backgroundColor: '#fff',
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
});
