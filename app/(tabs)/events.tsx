import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Platform, StatusBar, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import { expenseService } from '@/lib/api/expenses';

const EVENT_CATEGORIES = [
  { id: 'trip', name: 'Trip / Vacation', icon: '✈️', color: '#3b82f6', description: 'Track travel expenses' },
  { id: 'wedding', name: 'Wedding / Function', icon: '💍', color: '#ec4899', description: 'Marriage celebrations' },
  { id: 'renovation', name: 'Home Renovation', icon: '🏠', color: '#f59e0b', description: 'House projects' },
  { id: 'shopping', name: 'Shopping Spree', icon: '🛍️', color: '#8b5cf6', description: 'Festival shopping' },
  { id: 'birthday', name: 'Birthday / Party', icon: '🎂', color: '#10b981', description: 'Celebrations' },
  { id: 'other', name: 'Other', icon: '📋', color: '#6b7280', description: 'Custom events' },
];

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventAmount, setEventAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const filteredEvents = EVENT_CATEGORIES.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Close all modals when navigating away from this tab
  useFocusEffect(
    React.useCallback(() => {
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

  return (
    <View style={[styles.safeContainer, { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }]}>
      {showForm ? (
        <View style={styles.container}>
          <ScrollView style={styles.formWrapper}>
            <ExpenseForm
              onSubmit={handleAddExpense}
              loading={false} onClose={() => setShowForm(false)} />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerWrapper}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Events</Text>
                <Text style={styles.headerSubtitle}>View your events here</Text>
              </View>
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

          {/* Search Bar */}
          <View style={[styles.searchContainer, { marginTop: 20 }]}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Event Cards Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, { borderLeftColor: event.color }]}
                onPress={() => router.push(`/event-details?category=${event.id}&name=${event.name}`)}
                activeOpacity={0.7}
              >
                <View style={styles.eventCardContent}>
                  <Text style={styles.eventIcon}>{event.icon}</Text>
                  <View style={styles.eventTextContainer}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingBottom: 30,
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  menuButton: {
    padding: 2,
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
  totalCard: {
    backgroundColor: '#8b5cf6',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginTop: -20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  totalTextContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  totalCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  totalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
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
