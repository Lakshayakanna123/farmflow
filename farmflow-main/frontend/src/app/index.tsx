import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay, 
  runOnJS 
} from 'react-native-reanimated';
import { Sprout } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { StorageService } from '../services/storage';

export default function SplashScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // Animation values
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    // 1. Trigger Animations
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 800 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(400, withSpring(0, { damping: 15 }));

    // 2. Auth Check & Navigation Redirect
    const timer = setTimeout(async () => {
      try {
        const currentUser = await StorageService.getCurrentUser();
        if (currentUser) {
          router.replace('/(tabs)/dashboard');
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error('Splash screen auth check failed', err);
        router.replace('/login');
      }
    }, 2200); // Allow animation to finish

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  return (
    <View 
      style={{ backgroundColor: colors.background }} 
      className="flex-1 items-center justify-center"
    >
      <Animated.View 
        style={[
          logoAnimatedStyle,
          { 
            backgroundColor: colors.primary + '12',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 8,
          }
        ]}
        className="w-32 h-32 rounded-[40px] items-center justify-center mb-6"
      >
        <Sprout size={64} color={colors.primary} strokeWidth={2.2} />
      </Animated.View>

      <Animated.View style={textAnimatedStyle} className="items-center">
        <Text 
          style={{ color: colors.text }} 
          className="text-3xl font-extrabold tracking-tight mb-1"
        >
          FarmFlow
        </Text>
        <Text 
          style={{ color: colors.primary }} 
          className="text-lg font-bold uppercase tracking-[0.25em] ml-1"
        >
          Animal Farm Management
        </Text>
        
        <View className="flex-row items-center mt-12">
          <Text 
            style={{ color: colors.textSecondary }} 
            className="text-xs font-semibold tracking-wider uppercase opacity-60"
          >
            Operations, teams, and issues in harmony
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
