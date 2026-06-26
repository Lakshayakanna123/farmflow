import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const { colors, isDark } = useTheme();
  const [isMounted, setIsMounted] = React.useState(visible);

  // Shared value for sheet translation
  const translateY = useSharedValue(SCREEN_HEIGHT);
  // Shared value for backdrop opacity
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      backdropOpacity.value = withTiming(0.4, { duration: 300 });
    } else if (isMounted) {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
        runOnJS(setIsMounted)(false);
      });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible, isMounted]);

  const handleClose = () => {
    if (!visible) {
      onClose();
      return;
    }
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(() => {
        setIsMounted(false);
        onClose();
      })();
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!isMounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} className="z-[999]">
      {/* Backdrop */}
      <Animated.View 
        style={[
          backdropStyle, 
          { backgroundColor: '#000000', ...StyleSheet.absoluteFill }
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet Container */}
      <View className="flex-1 justify-end">
        <Animated.View
          style={[
            sheetStyle,
            { 
              backgroundColor: colors.card,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(62, 39, 35, 0.05)',
              maxHeight: SCREEN_HEIGHT * 0.8,
            }
          ]}
          className="pb-8 pt-4 px-6 shadow-2xl"
        >
          {/* Handle bar */}
          <View className="items-center mb-4">
            <View 
              style={{ backgroundColor: colors.textSecondary + '30' }} 
              className="w-12 h-1.5 rounded-full" 
            />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            {title ? (
              <Text 
                style={{ color: colors.text }} 
                className="text-lg font-bold"
              >
                {title}
              </Text>
            ) : <View />}
            <Pressable 
              onPress={handleClose}
              style={{ backgroundColor: colors.textSecondary + '15' }}
              className="p-1.5 rounded-full"
            >
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Children content */}
          <View className="flex-shrink-1">
            {children}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};
