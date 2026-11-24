import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Image, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isOnboarding } = useOnboarding();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: (user && !isOnboarding) ? {
          backgroundColor: '#4CAF50',
          borderTopWidth: 0,
          height: Platform.OS === 'android' ? (85 + insets.bottom) : (100 + insets.bottom),
          paddingBottom: Platform.OS === 'android' ? (insets.bottom + 15) : (insets.bottom + 20),
          paddingTop: 12,
          paddingHorizontal: 15,
          elevation: 0,
          shadowColor: 'transparent',
        } : { display: 'none' },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
        },
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={props.onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: insets.bottom > 0 ? 5 : 0 }}
            >
              <Text style={[tabStyles.textButton, props.accessibilityState?.selected && tabStyles.textButtonFocused]}>
                Profile
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={props.onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={tabStyles.centerIconContainer}>
                <Image
                  source={require('@/assets/images/logoreal.png')}
                  style={tabStyles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={props.onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: insets.bottom > 0 ? 5 : 0 }}
            >
              <Text style={[tabStyles.textButton, props.accessibilityState?.selected && tabStyles.textButtonFocused]}>
                Events
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="event-details"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  textButton: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  textButtonFocused: {
    fontSize: 18,
    fontWeight: '800',
    textDecorationLine: 'underline',
    textDecorationColor: '#ffffff',
  },
  centerIconContainer: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 5,
    borderColor: '#4CAF50',
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
