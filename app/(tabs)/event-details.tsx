import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, StatusBar, Modal, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import { expenseService } from '@/lib/api/expenses';

// Currency conversion rates
const CURRENCY_RATES: { [key: string]: number } = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  PKR: 278.50,
};

// Convert amount from USD to selected currency
const convertAmount = (amount: number, toCurrency: string): number => {
  if (toCurrency === 'USD') return amount;
  return amount * CURRENCY_RATES[toCurrency];
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

export default function EventDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { category, name } = useLocalSearchParams();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventAmount, setEventAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [user, category]);

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

  // Refresh events when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
      loadSavedCurrency(); // Reload currency when page comes into focus
      return () => {
        // Cleanup: close all modals when leaving this screen
        setShowForm(false);
        setShowUserMenu(false);
        setShowProfileModal(false);
        setShowCurrencyModal(false);
        setShowEventModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
      };
    }, [user, category])
  );

  const loadEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const eventName = Array.isArray(name) ? name[0] : name;
      console.log('Loading events for:', eventName, 'user:', user.id);

      let query = supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id);

      // For "Other" category, show events that don't match specific categories
      if (eventName.toLowerCase().includes('other')) {
        const { data: allData, error: allError } = await query.order('event_date', { ascending: false });

        if (allError) {
          console.error('Error loading events:', allError);
          throw allError;
        }

        // Filter out events that match specific categories
        const specificCategories = ['birthday', 'party', 'trip', 'vacation', 'wedding', 'function', 'renovation', 'home', 'shopping', 'spree'];
        const filteredData = allData?.filter(event => {
          const eventNameLower = event.event_name.toLowerCase();
          return !specificCategories.some(cat => eventNameLower.includes(cat));
        }) || [];

        console.log('Loaded Other events:', filteredData);
        console.log('Number of events found:', filteredData.length);
        setEvents(filteredData);
      } else {
        // For specific categories, search by both parts of the name
        // e.g., "Trip / Vacation" matches events with "trip" OR "vacation"
        const nameParts = eventName.split(' / ').map((part: string) => part.trim().toLowerCase());

        const { data: allData, error } = await query.order('event_date', { ascending: false });

        if (error) {
          console.error('Error loading events:', error);
          throw error;
        }

        // Filter events that match any part of the category name
        const filteredData = allData?.filter(event => {
          const eventNameLower = event.event_name.toLowerCase();
          return nameParts.some((part: string) => eventNameLower.includes(part));
        }) || [];

        console.log('Loaded events for', eventName, ':', filteredData);
        console.log('Number of events found:', filteredData.length);
        setEvents(filteredData);
      }
    } catch (error: any) {
      console.error('Failed to load event expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const handleDeleteEvent = (eventId: string) => {
    setDeletingEventId(eventId);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!deletingEventId) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deletingEventId);

      if (error) throw error;

      setShowDeleteModal(false);
      setDeletingEventId(null);
      await loadEvents();
      Alert.alert('Success', 'Event deleted successfully');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    }
  };

  const cancelDeleteEvent = () => {
    setShowDeleteModal(false);
    setDeletingEventId(null);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventName(event.event_name);
    // Convert amount to selected currency for editing
    const convertedAmount = convertAmount(parseFloat(event.amount), selectedCurrency);
    setEventAmount(convertedAmount.toFixed(2));
    setShowEditModal(true);
  };

  const handleUpdateEvent = async () => {
    if (!eventName.trim() || !eventAmount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      // Convert amount from selected currency to USD for storage
      const amountInCurrency = parseFloat(eventAmount);
      const amountInUSD = selectedCurrency === 'USD'
        ? amountInCurrency
        : amountInCurrency / CURRENCY_RATES[selectedCurrency];

      const { error } = await supabase
        .from('events')
        .update({
          event_name: eventName.trim(),
          amount: amountInUSD, // Store in USD
        })
        .eq('id', editingEvent.id);

      if (error) throw error;

      Alert.alert('Success', 'Event updated successfully');
      setShowEditModal(false);
      setEditingEvent(null);
      setEventName('');
      setEventAmount('');
      await loadEvents();
    } catch (error: any) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const totalAmount = events.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleAddExpense = async (amount: number, description: string, category: any) => {
    if (!user) return;

    try {
      // Convert amount from selected currency to USD for storage
      const amountInUSD = selectedCurrency === 'USD' ? amount : amount / CURRENCY_RATES[selectedCurrency];

      await expenseService.addExpense(user.id, amountInUSD, description, category);
      Alert.alert('Success', 'Expense added successfully!');
      setShowForm(false);
      // Redirect to home page
      router.push('/(tabs)');
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeContainer, { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={[styles.safeContainer, { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }]}>
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
          {/* Header */}
          <View style={styles.headerWrapper}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>{name || 'Event Details'}</Text>
                <Text style={styles.headerSubtitle}>Event expenses here</Text>
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

          {/* Total Expense Card */}
          <View style={styles.totalCard}>
            <View style={styles.totalTextContainer}>
              <Text style={styles.totalLabel}>Total for {name}</Text>
              <Text style={styles.totalAmount}>{getCurrencySymbol(selectedCurrency)} {convertAmount(totalAmount, selectedCurrency).toFixed(2)}</Text>
              <Text style={styles.totalCount}>{events.length} expense{events.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.totalIconContainer}>
              <Ionicons name="wallet" size={28} color="rgba(255, 255, 255, 0.9)" />
            </View>
          </View>

          {/* Event List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {events.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Ionicons name="calendar-outline" size={80} color="#d1d5db" />
                <Text style={{ fontSize: 18, color: '#9ca3af', marginTop: 16 }}>No events yet</Text>
                <Text style={{ fontSize: 14, color: '#d1d5db', marginTop: 8 }}>Add your first event!</Text>
              </View>
            ) : (
              events.map((item) => (
                <View key={item.id} style={styles.expenseCard}>
                  <View style={styles.expenseLeft}>
                    <View style={styles.emojiContainer}>
                      <Text style={styles.emoji}>📅</Text>
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{item.event_name}</Text>
                      <View style={styles.expenseMeta}>
                        <Text style={styles.expenseCategory}>Event</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.expenseDate}>{formatDate(item.event_date)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>{getCurrencySymbol(selectedCurrency)} {convertAmount(parseFloat(item.amount), selectedCurrency).toFixed(2)}</Text>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditEvent(item)}
                      >
                        <Ionicons name="create-outline" size={18} color="#4CAF50" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteEvent(item.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Add Button */}
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add" size={36} color="#fff" />
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
                          if (!editFirstName.trim() || !editLastName.trim()) {
                            Alert.alert('Error', 'Please fill in all fields');
                            return;
                          }
                          try {
                            const { error } = await supabase.auth.updateUser({
                              data: {
                                first_name: editFirstName.trim(),
                                last_name: editLastName.trim(),
                              }
                            });
                            if (error) throw error;
                            Alert.alert('Success', 'Profile updated successfully!');
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
                        handleCurrencyChange(currency);
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
                  <Text style={styles.modalTitle}>Add Expense</Text>
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
                        console.log('Adding event for category:', category);

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
                        Alert.alert('Success', 'Event added successfully!');
                        setEventName('');
                        setEventAmount('');
                        setShowEventModal(false);
                        await loadEvents();
                      } catch (error: any) {
                        console.error('Error saving event:', error);
                        Alert.alert('Error', error.message || 'Failed to save event');
                      }
                    }}
                  >
                    <Text style={styles.saveButtonText}>Add Event</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Edit Expense Modal */}
          <Modal
            visible={showEditModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              setShowEditModal(false);
              setEditingEvent(null);
              setEventName('');
              setEventAmount('');
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Event</Text>
                  <TouchableOpacity onPress={() => {
                    setShowEditModal(false);
                    setEditingEvent(null);
                    setEventName('');
                    setEventAmount('');
                  }}>
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
                    onPress={handleUpdateEvent}
                  >
                    <Text style={styles.saveButtonText}>Update Event</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            visible={showDeleteModal}
            transparent
            animationType="fade"
            onRequestClose={cancelDeleteEvent}
          >
            <View style={styles.deleteModalOverlay}>
              <View style={styles.deleteModalContent}>
                <View style={styles.deleteIconContainer}>
                  <Ionicons name="warning" size={48} color="#e74c3c" />
                </View>

                <Text style={styles.deleteModalTitle}>Delete Event?</Text>
                <Text style={styles.deleteModalMessage}>
                  Are you sure you want to delete this event? This action cannot be undone.
                </Text>

                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelDeleteEvent}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmDeleteButton}
                    onPress={confirmDeleteEvent}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
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
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  expenseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: 13,
    color: '#6b7280',
  },
  dot: {
    fontSize: 13,
    color: '#6b7280',
    marginHorizontal: 6,
  },
  expenseDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  addButton: {
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
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  deleteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmDeleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
});
