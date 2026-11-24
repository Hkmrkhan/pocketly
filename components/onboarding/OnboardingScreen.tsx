import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Text, ImageBackground, Platform, StatusBar, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    title: 'Track Your Expenses',
    description: 'Keep track of all your daily expenses in one organized place',
    icon: 'wallet',
    gradient: '#6366f1',
    backgroundImage: require('../../assets/images/onboarding1.jpg'),
  },
  {
    id: 2,
    title: 'Analyze Spending',
    description: 'Get detailed insights into your spending patterns and save more',
    icon: 'stats-chart',
    gradient: '#ec4899',
    backgroundImage: require('../../assets/images/onboarding2.jpg'),
  },
  {
    id: 3,
    title: 'Secure & Private',
    description: 'Your financial data is encrypted and completely secure',
    icon: 'shield-checkmark',
    gradient: '#10b981',
    backgroundImage: require('../../assets/images/onboarding3.jpg'),
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change slide
        setCurrentIndex(currentIndex + 1);

        // Reset and animate in
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change slide
        setCurrentIndex(currentIndex - 1);

        // Reset and animate in
        slideAnim.setValue(-50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Refs to keep track of current callbacks without triggering re-creation of PanResponder
  const handleNextRef = useRef(handleNext);
  const handlePreviousRef = useRef(handlePrevious);

  // Update refs when functions change (e.g. state updates)
  React.useEffect(() => {
    handleNextRef.current = handleNext;
    handlePreviousRef.current = handlePrevious;
  }, [handleNext, handlePrevious]);

  // Add swipe gesture support
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 50;

        // Swipe left (next)
        if (gestureState.dx < -swipeThreshold) {
          handleNextRef.current();
        }
        // Swipe right (previous)
        else if (gestureState.dx > swipeThreshold) {
          handlePreviousRef.current();
        }
      },
    })
  ).current;



  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <ImageBackground
        source={currentSlide.backgroundImage}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Dark overlay for better text readability */}
        <View style={[styles.overlay, { backgroundColor: currentSlide.gradient }]} />

        {/* Skip Button - Top Right */}
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButtonTopRight}
          activeOpacity={0.6}
        >
          <Text style={styles.skipTextTopRight}>Skip</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(50,50,50,0.9)" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}>
          {/* Content Backdrop for better readability */}
          <View style={styles.contentBackdrop}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name={currentSlide.icon as any} size={80} color={currentSlide.gradient} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{currentSlide.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{currentSlide.description}</Text>
          </View>
        </Animated.View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonsContainer}>
          <View style={styles.skipButtonPlaceholder} />

          {currentIndex === slides.length - 1 && (
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              activeOpacity={0.8}
            >
              <Text style={styles.nextText}>Get Started</Text>
              <Ionicons name="arrow-forward-circle" size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  skipButtonTopRight: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 55,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  skipTextTopRight: {
    color: 'rgba(50,50,50,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  contentBackdrop: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1f2937',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    color: '#4b5563',
    opacity: 0.95,
    lineHeight: 28,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  progressText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  nextStepText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    fontStyle: 'italic',
  },
  skipButtonPlaceholder: {
    width: 70,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 6,
  },
  activeDot: {
    width: 30,
    backgroundColor: '#fff',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
    zIndex: 1,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
